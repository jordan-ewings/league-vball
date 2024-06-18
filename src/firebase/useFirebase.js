import React, { useState, useEffect, useSyncExternalStore } from "react";
import { get, off, child, ref, onValue, set, onChildAdded } from "firebase/database";
import { db } from "./firebase";
import { useLeague } from "../contexts/SessionContext";

/* ---------------------------------- */

const cache = new Map();
const store = new Map();
const subscribers = new Map();
const listeners = new Set();

/* ---------------------------------- */
// init (called from LeagueContext when league changes)
// clear existing cache, store, listeners, subscribers
// load some initial data to cache

export function initFirebaseStore() {

  listeners.forEach((ref) => off(ref));
  listeners.clear();
  subscribers.clear();
  store.clear();
  cache.clear();
}

/* ---------------------------------- */
// cache hooks

function readStore(reference) {
  if (store.has(reference)) {
    return store.get(reference);
  }
  return null;
}

function readCache(reference) {
  if (cache.has(reference)) {
    return cache.get(reference);
  }
  return null;
}

export function useFirebaseCache(reference) {

  const [data, setData] = useState(null);

  useEffect(() => {
    if (reference) {

      const cacheData = readCache(reference);
      if (cacheData) {
        setData(cacheData);
        return;
      }

      const storeData = readStore(reference);
      if (storeData) {
        cache.set(reference, storeData);
        console.log(`cache ${reference}:`, storeData);
        setData(storeData);
        return;
      }

      get(child(ref(db), reference)).then((snapshot) => {
        const data = snapshot.val();
        cache.set(reference, data);
        console.log(`cache ${reference}:`, data);
        setData(data);
      });

    }
  }, [reference]);

  return data;
}

export function useCache(node, ext) {
  const { leagueId } = useLeague();
  const path = (leagueId) ? `${node}/${leagueId}` + (ext ? '/' + ext : '') : null;
  return useFirebaseCache(path);
}

/* ---------------------------------- */
// sync hooks
// optionally transform data before returning

export function useSync(node, ext) {
  const { leagueId } = useLeague();
  const path = (leagueId) ? `${node}/${leagueId}` + (ext ? '/' + ext : '') : null;
  return useFirebase(path);
}

export function useSyncTeams(ext) {
  const { leagueId } = useLeague();
  const path = `teams/${leagueId}` + (ext ? '/' + ext : '');
  return useFirebase(path);
}

export function useSyncGames(ext) {
  const { leagueId } = useLeague();
  const path = `games/${leagueId}` + (ext ? '/' + ext : '');
  return useFirebase(path);
}

export function useSyncWeeks(ext) {
  const { leagueId } = useLeague();
  const path = `weeks/${leagueId}` + (ext ? '/' + ext : '');
  return useFirebase(path);
}

export function useSyncStats(ext) {
  const { leagueId } = useLeague();
  const path = `stats/${leagueId}` + (ext ? '/' + ext : '');
  return useFirebase(path);
}

/* ---------------------------------- */

export function useFirebase(reference) {

  initReference(reference);
  return useSyncExternalStore(
    (callback) => subscribe(reference, callback),
    () => getSnapshot(reference)
  );
}

/* ---------------------------------- */

function initReference(reference) {

  if (!reference) return;
  if (store.has(reference)) return;

  store.set(reference, null);
  const dataRef = ref(db, reference);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    store.set(reference, data);
    // console.log(`store ${reference}:`, data);
    if (subscribers.has(reference)) {
      subscribers.get(reference).forEach((cb) => cb());
    }
  });

  listeners.add(dataRef);
}

/* ---------------------------------- */

function subscribe(reference, callback) {

  if (!reference) return;
  if (!subscribers.has(reference)) {
    subscribers.set(reference, new Set());
  }

  subscribers.get(reference).add(callback);
  // if (store.has(reference)) {
  //   if (store.get(reference) !== null) {
  //     callback();
  //   }
  // }

  return () => {
    const callbackSet = subscribers.get(reference);
    if (callbackSet) {
      callbackSet.delete(callback);
      if (callbackSet.size === 0) {
        subscribers.delete(reference);
      }
    }
  };
}

function getSnapshot(reference) {
  return store.get(reference);
}

// function emitChange

/* ---------------------------------- */

