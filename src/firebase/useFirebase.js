import React, { useState, useEffect, useSyncExternalStore, useRef, useMemo } from "react";
import { get, off, child, ref, onValue, set, update } from "firebase/database";
import { db } from "./firebase";
import { useLeague } from "../contexts/SessionContext";

/* ---------------------------------- */

const cache = new Map();
const store = new Map();
const subscribers = new Map();
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
// misc methods/function to be performed on each data nodes

export function useFunctions() {

  const refs = useLeaguePaths();

  const matchesFromGames = (games) => {
    const result = [];
    Object.entries(games).forEach(([wId, wGames]) => {
      Object.entries(wGames).forEach(([gId, game]) => {
        Object.entries(game.matches).forEach(([mId, match]) => {
          result.push({
            weekId: wId,
            gameId: gId,
            matchId: mId,
            ...game,
            ...match
          });
        });
      });
    });

    return result;
  };

  const teamStatsFromGames = (games, teamId, weekId) => {
    const matchData = matchesFromGames(games).filter(m => m.teams[teamId] && m.status === 'POST');
    const data = weekId ? matchData.filter(m => m.weekId === weekId) : matchData;
    const count = data.length;
    const wins = (count > 0) ? data.filter(m => m.winner === teamId).length : 0;
    const losses = count - wins;
    const record = `${wins}-${losses}`;
    const winPct = (count > 0) ? wins / count : 0;

    return { count, wins, losses, record, winPct };
  };

  const updateGameMatches = async (weekId, gameId, newMatches) => {
    const games = await getFirebase(refs.games());
    const game = games[weekId][gameId];
    game.matches = newMatches;

    const updates = {};
    updates[refs.games(weekId, gameId, 'matches')] = newMatches;
    Object.keys(game.teams).forEach(teamId => {
      updates[refs.teams(teamId, 'stats', 'games')] = teamStatsFromGames(games, teamId);
      updates[refs.stats(weekId, teamId, 'games')] = teamStatsFromGames(games, teamId, weekId);
    });

    console.log('updateGameMatches:', updates);
    update(ref(db), updates).then(() => {
      console.log('updateGameMatches: success');
    }).catch((error) => {
      console.error('updateGameMatches: error', error);
    });

    // return new Promise((resolve) => {
    //   setTimeout(() => {
    //     console.log('updateGameMatches: success (test)');
    //     resolve();
    //   }, 5000);
    // });
  };

  return {
    matchesFromGames,
    teamStatsFromGames,
    updateGameMatches,
  };
}

/* ---------------------------------- */
// useFirebaseOnce
// transform is either:
// - a function to transform the data
// - 'array', indicating the data should be transformed into an array

export async function getFirebase(reference, transform) {

  const result = await get(child(ref(db), reference)).then(s => {
    const data = s.val();
    if (data !== null && data !== undefined) {
      if (transform) {
        if (transform === 'array') {
          return Object.values(data);
        }
        return transform(data);
      } else {
        return data;
      }
    }
    return null;
  });

  return result;
}

/* ---------------------------------- */
// useLeaguePaths

export function useLeaguePaths() {

  const { leagueId } = useLeague();
  const paths = useMemo(() => {
    return {
      weeks: (weekId, ...nodes) => parseReference(makePath('weeks', [weekId, ...nodes]), leagueId),
      games: (weekId, gameId, ...nodes) => parseReference(makePath('games', [weekId, gameId, ...nodes]), leagueId),
      teams: (teamId, ...nodes) => parseReference(makePath('teams', [teamId, ...nodes]), leagueId),
      stats: (weekId, teamId, ...nodes) => parseReference(makePath('stats', [weekId, teamId, ...nodes]), leagueId),
    }
  }, [leagueId]);

  return paths;
}

function makePath(base, nodes) {
  const parts = nodes.filter(n => n !== undefined && n !== null);
  const ext = parts.length > 0 ? `/${parts.join('/')}` : '';
  return `${base}${ext}`;
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

/* ---------------------------------- */
// checkers

function parseReference(reference, leagueId) {
  if (!reference) return null;
  if (!leagueId) return null;

  if (reference.includes(leagueId)) return reference;
  if (reference.includes('/')) {
    return reference.replace('/', `/${leagueId}/`);
  }
  return `${reference}/${leagueId}`;
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
    // console.log(`store ${reference}:`, data);
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

