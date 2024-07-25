import React, { useState, useEffect, useSyncExternalStore, useRef, useMemo } from "react";
import { get, off, child, ref, onValue, set, update, onChildAdded, onChildChanged } from "firebase/database";
import { db } from "./firebase";
import { useLeague } from "../contexts/SessionContext";
import { type } from "@testing-library/user-event/dist/type";

/* ---------------------------------- */

export const store = new Map();
const subscribers = new Map();
const listeners = new Set();

/* ---------------------------------- */
// initFirebaseStore

export function initFirebaseStore(leagueId) {

  listeners.forEach((unsub) => unsub());
  listeners.clear();
  subscribers.clear();
  store.clear();

  console.log('initFirebaseStore:', leagueId);
  if (leagueId) {
    initLeague(leagueId);
    initTeams(leagueId);
    initWeeks(leagueId);
    initStats(leagueId);
    initGames(leagueId);
  }
}

/* ---------------------------------- */
// useFirebase

export function useFirebase(reference) {

  return useSyncExternalStore(
    (callback) => subscribe(reference, callback),
    () => getSnapshot(reference)
  );
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
// init firebase references

function initSnapshot(reference, data) {
  if (store.has(reference)) return;
  store.set(reference, data);
}

function setSnapshot(reference, data, notify = false) {
  store.set(reference, data);
  if (notify) notifySubscribers(reference);
}

function updateSnapshot(reference, childKey, childData, notify = false) {
  initSnapshot(reference, {});
  const data = getSnapshot(reference);
  const newData = { ...data, [childKey]: childData };
  setSnapshot(reference, newData, notify);
}

function notifySubscribers(reference) {
  if (subscribers.has(reference)) {
    subscribers.get(reference).forEach((cb) => cb());
  }
}

function getDataSnapPath(dataSnapshot) {
  const fullPath = dataSnapshot.ref.toString();
  const rootPath = dataSnapshot.ref.root.toString();
  const path = fullPath.replace(rootPath, '');
  return path;
}

/* ---------------------------------- */
// initLeague
// store leagueId

function initLeague(leagueId) {
  store.set('leagueId', leagueId);
}

/* ---------------------------------- */
// initTeams

function initTeams(leagueId) {
  const teamsPath = makePath(leagueId, 'teams');
  const teamAdded = onChildAdded(ref(db, teamsPath), (team) => {
    updateSnapshot(teamsPath, team.key, team.val(), true);
    setSnapshot(getDataSnapPath(team), team.val(), true);
  });
  listeners.add(teamAdded);
}

/* ---------------------------------- */
// initWeeks

function initWeeks(leagueId) {
  const weeksPath = makePath(leagueId, 'weeks');
  const weekAdded = onChildAdded(ref(db, weeksPath), (week) => {
    updateSnapshot(weeksPath, week.key, week.val(), true);
    setSnapshot(getDataSnapPath(week), week.val(), true);
  });
  listeners.add(weekAdded);
}

/* ---------------------------------- */
// initStats

function initStats(leagueId) {
  const statsPath = makePath(leagueId, 'stats');
  const statAdded = onChildAdded(ref(db, statsPath), (stat) => {
    const statPath = statsPath + '/' + stat.key;
    const weekAdded = onChildAdded(stat.ref, (week) => {
      const weekPath = statPath + '/' + week.key;
      const teamAdded = onChildAdded(week.ref, (team) => {
        updateSnapshot(weekPath, team.key, team.val(), true);
      });
      const teamChanged = onChildChanged(week.ref, (team) => {
        updateSnapshot(weekPath, team.key, team.val(), true);
      });
      listeners.add(teamAdded);
      listeners.add(teamChanged);
    });
    listeners.add(weekAdded);
  });
  listeners.add(statAdded);
}

/* ---------------------------------- */
// initGames

function initGames(leagueId) {
  const gamesPath = makePath(leagueId, 'games');
  const weekAdded = onChildAdded(ref(db, gamesPath), (week) => {
    const weekPath = gamesPath + '/' + week.key;
    const gameAdded = onChildAdded(week.ref, (game) => {
      updateSnapshot(weekPath, game.key, game.val(), true);
    });
    const gameChanged = onChildChanged(week.ref, (game) => {
      updateSnapshot(weekPath, game.key, game.val(), true);
      console.log('gameChanged:', 'week:', week.key, 'game:', game.key);
      console.log('weekGames:', getSnapshot(weekPath));
    });
    listeners.add(gameAdded);
    listeners.add(gameChanged);
  });
  listeners.add(weekAdded);
}

/* ---------------------------------- */
// useNode
// subscribe to firebase reference

function useNode(root, ...nodes) {
  const refs = useLeaguePaths();
  const reference = refs[root](...nodes);
  const data = useFirebase(reference);
  const loading = data === null || data === undefined;
  const result = useMemo(() => {
    const r = { reference };
    if (loading) r.loading = true;
    if (!loading) r.data = data;
    return r;
  }, [loading, data, reference]);
  return result;
}

export function useTeams(teamId) {
  return useNode('teams', teamId);
}

export function useWeeks(weekId) {
  return useNode('weeks', weekId);
}

export function useGames(weekId) {
  return useNode('games', weekId);
}

export function useStats(stat, weekId) {
  return useNode('stats', stat, weekId);
}

/* ---------------------------------- */
// read

const getLeagueId = () => getSnapshot('leagueId');
const getStoreKeys = (matchStart) => {
  const keys = Array.from(store.keys());
  if (matchStart) {
    const LID = getLeagueId();
    const search = LID + '/' + matchStart;
    return keys.filter(key => key.startsWith(search));
  }
  return keys;
}

export function readAllGames() {
  const weekGamesKeys = getStoreKeys('games');
  const games = weekGamesKeys.reduce((acc, weekPath) => {
    const weekId = weekPath.split('/').slice(-1)[0];
    const weekGames = getSnapshot(weekPath);
    Object.entries(weekGames).forEach(([gameId, game]) => {
      const path = weekPath + '/' + gameId;
      acc[path] = { ...game, weekId, gameId, ref: path };
    });
    return acc;
  }, {});

  return games;
}

/* ---------------------------------- */
// LOGGING of store (testing)

export function useStore() {

  const teams = useTeams();
  const weeks = useWeeks();
  const games = useGames('WK01');
  const stats = useStats('games', 'ALL');

  return {
    teams,
    weeks,
    games,
    stats,
    store,
  };
}

/* ---------------------------------- */
// useLeaguePaths

export function useLeaguePaths() {

  const { leagueId } = useLeague();
  const [paths, setPaths] = useState({
    weeks: (weekId, ...nodes) => makePath(leagueId, ['weeks', weekId, ...nodes]),
    games: (weekId, gameIndex, ...nodes) => makePath(leagueId, ['games', weekId, gameIndex, ...nodes]),
    teams: (teamId, ...nodes) => makePath(leagueId, ['teams', teamId, ...nodes]),
    stats: (stat, weekId, teamId, ...nodes) => makePath(leagueId, ['stats', stat, weekId, teamId, ...nodes]),
  });

  useEffect(() => {
    if (leagueId) {
      setPaths({
        weeks: (weekId, ...nodes) => makePath(leagueId, ['weeks', weekId, ...nodes]),
        games: (weekId, gameIndex, ...nodes) => makePath(leagueId, ['games', weekId, gameIndex, ...nodes]),
        teams: (teamId, ...nodes) => makePath(leagueId, ['teams', teamId, ...nodes]),
        stats: (stat, weekId, teamId, ...nodes) => makePath(leagueId, ['stats', stat, weekId, teamId, ...nodes]),
      });
    }
  }, [leagueId]);

  return paths;
}

/* ---------------------------------- */
// makePath

function makePath(leagueId, nodes) {
  const nodesArr = Array.isArray(nodes) ? nodes : [nodes];
  const parts = nodesArr.filter(n => n !== undefined && n !== null);
  const ext = parts.length > 0 ? '/' + parts.join('/') : '';
  return (leagueId) ? leagueId + ext : null;
}
