/* ---------------------------------- */
// session context

import React, { useContext, useReducer, useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { get, child, ref, onValue } from "firebase/database";
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

      // const dbLeague = leagues[leagueId];
      // const dbTeams = await get(child(ref(db), 'teams/' + leagueId)).then(s => s.val());
      // const dbWeeks = await get(child(ref(db), 'weeks/' + leagueId)).then(s => s.val());
      // const dbGames = await get(child(ref(db), 'games/' + leagueId)).then(s => s.val());

      // setLeague(dbLeague);
      // setTeams(dbTeams);
      // setWeeks(dbWeeks);
      // setGames(dbGames);

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
// REPLACEMENT FOR LEAGUE CONTEXT
// SWITCH TO EXTERNAL STORE
// components can access whatever parts of the store they need. E.g.:
// useLeagueData('leagues')
// useLeagueData('teams')
// useLeagueData('weeks')

// can also set up a listener for a specific database path.
// when path provided, will setup onValue listener for that path
// e.g.:
// useLeagueData('games', 'WK01')
// useLeagueData('games', 'WK01/GM01')
// sequence of events:
// 1. check if live firebase listener already exists for path
// 2a. if it does, add requestor to list of subscribers for that path
// 2b. if it does not, create new listener for path (onValue), create subscriber list for path and add requestor to list
// 3. return data from store for that path

// class LeagueDataStore {

//   constructor() {
//     this.loading = true;
//     this.leagues = {};
//     this.leagueId = Storage.get('leagueId');
//     this.league = {};

//     this.teams = {};
//     this.weeks = {};
//     this.games = {};

//     this.activeListeners = {};
//     this.subscribers = {};
//     this.init();
//   }

//   // get leagues, validate leagueId, get league data
//   async init() {

//     this.leagues = await get(child(ref(db), 'leagues')).then(s => s.val());
//     const defaultId = Object.keys(this.leagues)[0];
//     const hasInvalidId = !this.leagueId || !this.leagues[this.leagueId];
//     if (hasInvalidId) {
//       this.leagueId = defaultId;
//       Storage.set('leagueId', defaultId);
//     }

//     this.league = this.leagues[this.leagueId];
//     this.fetchLeagueData();
//   }

//   // on leagueId change
//   async setLeagueId(newLeagueId) {


//   }

//   // get data for current leagueId
//   async fetchStaticLeagueData() {
//     const id = this.leagueId;
//     this.teams = await get(child(ref(db), 'teams/' + id)).then(s => s.val());
//     this.weeks = await get(child(ref(db), 'weeks/' + id)).then(s => s.val());
//     this.games = await get(child(ref(db), 'games/' + id)).then(s => s.val());
//     this.loading = false;
//   }


//   // subscriptions
//   async subscribe(path, callback) {

//     if (!this.activeListeners[path]) {
//       this.activeListeners[path] = onValue(child(ref(db), path), s => {
//         const data = s.val();
//         this.subscribers[path].forEach(cb => cb(data));
//       });
//     }

//     if (!this.subscribers[path]) {
//       this.subscribers[path] = [];
//     }

//     this.subscribers[path].push(callback);



//   }







// }

// const dataStore = new LeagueDataStore();

// // won't set up/sync a firebase listener
// // e.g.:
// // useLeagueData('leagues')
// // useLeagueData('teams/T01')
// export function useLeagueDataOnce(path) {

//   return useSyncExternalStore(
//     () => dataStore.subscribeOnce(path),
//     () => dataStore.getSnapshot(path)
//   );
// }

// // will set up/sync a firebase listener (unless one already exists, in which case it will add to the existing listener)
// // e.g.:
// // useLeagueData('games', 'WK01')
// // useLeagueData('games', 'WK01/GM01')
// export function useLeagueData(path) {

//   return useSyncExternalStore(
//     () => dataStore.subscribe(path),
//     () => dataStore.getSnapshot(path)
//   );
// }


//   // return useSyncExternalStore(
//   //   () => dataStore.subscribe(keyArr, () => { }),
//   //   () => dataStore.getSnapshot(keyArr)
//   // );
// // }
