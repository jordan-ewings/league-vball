import React, { useState, useEffect, useSyncExternalStore, useRef, useMemo } from "react";
import { get, off, child, ref, onValue, set, update, onChildAdded } from "firebase/database";
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
// update/push utilities

export function useAddWeek() {

  const refs = useLeaguePaths();

  const addWeek = async () => {
    const weeks = await getFirebase(refs.weeks());
    const lastWeek = Object.values(weeks).pop();
    const lastGameday = new Date(lastWeek.gameday);

    const newGameday = new Date(lastGameday).setDate(lastGameday.getDate() + 7);
    const gameday = new Date(newGameday).toISOString();
    const nbr = Object.keys(weeks).length + 1;
    const label = `Week ${nbr}`;
    const id = 'WK' + nbr.toString().padStart(2, '0');
    const weekRefs = {
      games: refs.games(id),
      stats: refs.stats(id),
    };

    const newWeek = { id, nbr, label, gameday, refs: weekRefs };
    console.log('addWeek:', newWeek);
    set(ref(db, refs.weeks(id)), newWeek).then(() => {
      console.log('addWeek: success');
    }).catch((error) => {
      console.error('addWeek: error', error);
    });
  };

  return addWeek;
}

/* ---------------------------------- */
// useFunctions

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

  const updateGameMatches = async (weekId, gameId, newMatches, updateRecords = true) => {

    const updates = {};
    updates[refs.games(weekId, gameId, 'matches')] = newMatches;

    if (updateRecords === false) {
      console.log('updateGameMatches:', updates);
      return update(ref(db), updates).then(() => {
        console.log('updateGameMatches: success');
      }).catch((error) => {
        console.error('updateGameMatches: error', error);
      });
    }

    const games = await getFirebase(refs.games());
    const game = games[weekId][gameId];
    game.matches = newMatches;
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
  };

  return {
    matchesFromGames,
    teamStatsFromGames,
    updateGameMatches,
  };
}

/* ---------------------------------- */
// getFirebase

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
