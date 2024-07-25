import React, { useState, useEffect, useSyncExternalStore, useRef, useMemo } from "react";
import { get, off, child, ref, onValue, set, update, onChildAdded } from "firebase/database";
import { db } from "./firebase";
import { useLeague } from "../contexts/SessionContext";

/* ---------------------------------- */

const cache = new Map();
const store = new Map();
const listStore = new Map();

const subscribers = new Map();
const listSubscribers = new Map();

const listeners = new Set();

/* ---------------------------------- */
// initFirebaseStore

export function initFirebaseStore() {

  listeners.forEach((ref) => off(ref));
  listeners.clear();
  subscribers.clear();
  store.clear();
  cache.clear();
}

/* ---------------------------------- */
// useFunctions



/* ---------------------------------- */
// getFirebase

export async function getFirebase(reference) {

  const data = await get(ref(db, reference)).then((snapshot) => {
    return snapshot.val();
  });

  return data;
}

/* ---------------------------------- */
// useLeaguePaths

export function useLeaguePaths() {

  const { leagueId } = useLeague();

  const weeks = useCallback((weekId, ...nodes) => {
    return `${leagueId}/weeks/` + makePath(weekId, ...nodes);
  }, [leagueId]);

  const games = useCallback((weekId, gameId, ...nodes) => {
    return `${leagueId}/games/` + makePath(weekId, gameId, ...nodes);
  }, [leagueId]);

  const teams = useCallback((teamId, ...nodes) => {
    return `${leagueId}/teams/` + makePath(teamId, ...nodes);
  }, [leagueId]);

  const stats = useCallback((weekId, teamId, ...nodes) => {
    return `${leagueId}/stats/` + makePath(weekId, teamId, ...nodes);
  }, [leagueId]);

  const paths = useMemo(() => {
    return { weeks, games, teams, stats };
  }, [weeks, games, teams, stats]);

  return paths;


  // const paths = useMemo(() => {
  //   return {
  //     weeks: (weekId, ...nodes) => parseReference(makePath('weeks', [weekId, ...nodes]), leagueId),
  //     games: (weekId, gameId, ...nodes) => parseReference(makePath('games', [weekId, gameId, ...nodes]), leagueId),
  //     teams: (teamId, ...nodes) => parseReference(makePath('teams', [teamId, ...nodes]), leagueId),
  //     stats: (weekId, teamId, ...nodes) => parseReference(makePath('stats', [weekId, teamId, ...nodes]), leagueId),
  //   }
  // }, [leagueId]);

  return paths;
}

/* ---------------------------------- */
// useGames

export function useGames(weekId) {

  const refs = useLeaguePaths();
  const reference = weekId ? refs.games(weekId) : null;
  return useOnChildAdded(reference);
}


function useOnChildAdded(reference) {

  const [data, setData] = useState(null);

  useEffect(() => {
    if (!reference) return;
    setData({});

    const handleChild = (snap) => {
      const val = snap.val();
      const key = snap.key;
      setData(prev => {
        const newData = { ...prev };
        newData[key] = val;
        return newData;
      });
    };

    const dataRef = ref(db, reference);
    onChildAdded(dataRef, handleChild);
    return () => off(dataRef, 'child_added', handleChild);
  }, [reference]);

  return data;
}

/* ---------------------------------- */
// useFirebaseCache

export function useFirebaseCache(reference, transform) {

  const { leagueId } = useLeague();
  const path = useMemo(() => parseReference(reference, leagueId), [reference, leagueId]);
  const data = _useFirebaseCache(path);
  const result = useMemo(() => {
    if (data !== null && data !== undefined) {
      return transform ? transform(data) : data;
    }
    return null;
  }, [data, transform]);

  return result;
}

function _useFirebaseCache(reference) {

  const [data, setData] = useState(cache.get(reference));

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
        console.log(`cache from store ${reference}:`, storeData);
        setData(storeData);
        return;
      }
      get(child(ref(db), reference)).then((snapshot) => {
        const data = snapshot.val();
        cache.set(reference, data);
        console.log(`cache from fetch ${reference}:`, data);
        setData(data);
      });
    }
  }, [reference]);

  return data;
}

/* ---------------------------------- */
// useFirebase

export function useFirebase(reference, transform) {

  const { leagueId } = useLeague();
  const path = useMemo(() => parseReference(reference, leagueId), [reference, leagueId]);
  const data = _useFirebase(path);
  const result = useMemo(() => {
    if (data !== null && data !== undefined) {
      return transform ? transform(data) : data;
    }
    return null;
  }, [data, transform]);

  return result;
}

function _useFirebase(reference) {

  initReference(reference);
  return useSyncExternalStore(
    (callback) => subscribe(reference, callback),
    () => getSnapshot(reference)
  );
}

function initReference(reference) {

  if (!reference) return;
  if (store.has(reference)) return;

  store.set(reference, null);
  const dataRef = ref(db, reference);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    store.set(reference, data);
    if (subscribers.has(reference)) {
      subscribers.get(reference).forEach((cb) => cb());
    }
  });

  listeners.add(dataRef);
}

function subscribe(reference, callback) {

  if (!reference) return;

  if (!subscribers.has(reference)) subscribers.set(reference, new Set());
  subscribers.get(reference).add(callback);

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
// helpers

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

function parseReference(reference, leagueId) {
  if (!reference) return null;
  if (!leagueId) return null;

  if (reference.includes(leagueId)) return reference;
  if (reference.includes('/')) {
    return reference.replace('/', `/${leagueId}/`);
  }
  return `${reference}/${leagueId}`;
}

function makePath(base, nodes) {
  const parts = nodes.filter(n => n !== undefined && n !== null);
  const ext = parts.length > 0 ? `/${parts.join('/')}` : '';
  return `${base}${ext}`;
}
