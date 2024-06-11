/* ---------------------------------- */
// session context

import React, { useContext, useReducer, useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { get, child, ref, onValue, set } from "firebase/database";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

/* ---------------------------------- */
// local storage functions

class Storage {

  static get(key) {
    return localStorage.getItem(key);
  }

  static set(key, value) {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }
}

/* ---------------------------------- */
// AuthContext

const AuthContext = React.createContext();
function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [controls, setControls] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, newUser => {
      setUser(newUser);
      setAdmin(newUser && !newUser.isAnonymous);
      setControls(newUser && !newUser.isAnonymous);

      console.log('AUTH:', {
        user: newUser,
        admin: newUser && !newUser.isAnonymous,
        controls: newUser && !newUser.isAnonymous
      });
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback((password) => {
    const email = 'jordanewings@outlook.com';
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(() => {
    return signOut(auth);
  }, []);

  const value = useMemo(() => ({
    user,
    admin,
    controls,

    login,
    logout,
    setControls
  }), [user, admin, controls, login, logout]);

  return (<AuthContext.Provider value={value}>{children}</AuthContext.Provider>);
}

/* ---------------------------------- */
// OptionsContext

const OptionsContext = React.createContext();
function OptionsProvider({ children }) {

  const [favTeam, setFavTeamState] = useState(Storage.get('favTeam'));
  const setFavTeam = useCallback((teamName) => {
    Storage.set('favTeam', teamName);
    setFavTeamState(teamName);
    console.log('FAV TEAM:', teamName);
  }, []);

  const value = useMemo(() => ({
    favTeam,
    setFavTeam
  }), [favTeam, setFavTeam]);

  return (<OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>);
}

/* ---------------------------------- */
// LeagueContext

const LeagueContext = React.createContext();
function LeagueProvider({ children }) {

  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState({});
  const [leagueId, setLeagueIdState] = useState(Storage.get('leagueId'));
  const [league, setLeague] = useState({});
  const [teams, setTeams] = useState({});
  const [weeks, setWeeks] = useState({});
  const [games, setGames] = useState({});

  // fetch leagues only once and confirm valid leagueId
  useEffect(() => {
    const init = async () => {
      const dbLeagues = await get(child(ref(db), 'leagues')).then(s => s.val());
      setLeagues(dbLeagues);
      console.log('LEAGUES:', dbLeagues);
    };

    init();
  }, []);

  // fetch league data
  useEffect(() => {
    const init = async () => {

      setLeague(leagues[leagueId]);
      setTeams(await get(child(ref(db), 'teams/' + leagueId)).then(s => s.val()));
      setGames(await get(child(ref(db), 'games/' + leagueId)).then(s => s.val()));
      setWeeks(await get(child(ref(db), 'weeks/' + leagueId)).then(s => s.val()));

      setLoading(false);
    };

    // only fetch league data if leagueId is valid, which requires leagues to be fetched first
    const leaguesFetched = Object.keys(leagues).length > 0;
    if (leaguesFetched) {
      if (leagueId && leagues[leagueId]) {
        init();
      } else {
        setLeagueIdState(Object.keys(leagues)[0]);
      }
    }

  }, [leagueId, leagues]);

  const setLeagueId = useCallback((newLeagueId) => {
    if (newLeagueId !== leagueId) {
      setLoading(true);
      Storage.set('leagueId', newLeagueId);
      setLeagueIdState(newLeagueId);
    }
  }, [leagueId]);

  const value = useMemo(() => ({
    loading,
    leagues,
    leagueId,
    league,
    teams,
    weeks,
    games,
    setLeagueId
  }), [loading, leagues, leagueId, league, teams, weeks, games, setLeagueId]);

  return (<LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>);
}

/* ---------------------------------- */
// ContextProvider

export const useAuth = () => useContext(AuthContext);
export const useOptions = () => useContext(OptionsContext);
export const useLeague = () => useContext(LeagueContext);

export function ContextProvider({ children }) {

  return (
    <AuthProvider>
      <LeagueProvider>
        <OptionsProvider>
          {children}
        </OptionsProvider>
      </LeagueProvider>
    </AuthProvider>
  );
}

/* ---------------------------------- */

const store = new Map();
const subscribers = new Map();

export function useFirebase(reference) {

  initReference(reference);
  return useSyncExternalStore(
    (callback) => subscribe(reference, callback),
    () => getSnapshot(reference)
  );
}

export function readFirebase(reference) {
  return getSnapshot(reference);

}

function initReference(reference) {
  if (!reference) return;
  if (store.has(reference)) return;

  store.set(reference, null);
  console.log('New reference:', reference);
  const dbRef = ref(db, reference);
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    store.set(reference, data);
    if (subscribers.has(reference)) {
      subscribers.get(reference).forEach((cb) => cb(data));
    }
    // if (typeof data === 'object') {
    //   setupOrUpdateChildSubscribers(reference, data);
    // }
  });
}

// function setupOrUpdateChildSubscribers(reference, data) {
//   Object.keys(data).forEach((key) => {
//     const childRef = `${reference}/${key}`;
//     const childData = data[key];
//     const isObject = typeof childData === 'object';
//     const childStore = store.get(childRef);

//     const hasChanged = isObject
//       ? JSON.stringify(childData) !== JSON.stringify(childStore)
//       : childData !== childStore;

//     if (hasChanged) {
//       store.set(childRef, childData);
//       if (subscribers.has(childRef)) {
//         subscribers.get(childRef).forEach((cb) => cb(childData));
//       }
//     }

//     if (isObject) {
//       setupOrUpdateChildSubscribers(childRef, childData);
//     }
//   });
// }

function subscribe(reference, callback) {
  if (!reference) return;
  if (!subscribers.has(reference)) {
    subscribers.set(reference, new Set());
  }
  subscribers.get(reference).add(callback);

  // Call the callback immediately with the current data
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
