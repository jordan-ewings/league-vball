import React, { useState, useEffect, useSyncExternalStore } from "react";
import { get, child, ref, onValue, set } from "firebase/database";
import { db } from "../firebase";
import { useLeague } from "../contexts/SessionContext";

/* ---------------------------------- */

const store = new Map();
const subscribers = new Map();

/* ---------------------------------- */

export function resetFirebaseStore() {
  store.clear();
  subscribers.clear();
}

export function useFirebase(reference) {
  initReference(reference);
  const data = useSyncExternalStore(
    (callback) => subscribe(reference, callback),
    () => getSnapshot(reference)
  );
  return data;
}

/* ---------------------------------- */
// one-time hooks

/* ---------------------------------- */
// sync hooks

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

function initReference(reference) {
  if (!reference) return;
  if (store.has(reference)) return;

  store.set(reference, null);
  // console.log('New reference:', reference);
  const dbRef = ref(db, reference);
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    store.set(reference, data);
    if (subscribers.has(reference)) {
      subscribers.get(reference).forEach((cb) => cb(data));
    }
  });
}

function subscribe(reference, callback) {
  if (!reference) return;
  if (!subscribers.has(reference)) {
    subscribers.set(reference, new Set());
  }
  subscribers.get(reference).add(callback);

  if (store.has(reference)) {
    callback(store.get(reference));
  }

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

/* ---------------------------------- */

