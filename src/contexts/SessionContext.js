/* ---------------------------------- */
// session context

import React, { useContext, useReducer, useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { get, child, ref, onValue, set, onChildAdded } from "firebase/database";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { initFirebaseStore } from "../firebase/useFirebase";

/* ---------------------------------- */
// local storage functions

export class Storage {

  static get(key) {
    return localStorage.getItem(key);
  }

  static set(key, value) {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }

  static setExpire(key, value, expire = 1000 * 60 * 60) {
    if (!value) {
      if (localStorage.getItem(key)) localStorage.removeItem(key);
      return;
    }

    const now = new Date().getTime();
    const item = { value, expire: now + expire };
    localStorage.setItem(key, JSON.stringify(item));

  }

  static getExpire(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    const { value, expire } = JSON.parse(itemStr);
    const now = new Date().getTime();
    if (now > expire) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
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

  const [leagues, setLeagues] = useState(null);
  const [leagueId, setLeagueId] = useState(null);

  // get leagues from firebase
  useEffect(() => {
    const unsub = onValue(ref(db, 'leagues'), (snapshot) => {
      const leaguesDB = snapshot.val();
      const newLeagues = Object.values(leaguesDB);
      newLeagues.sort((a, b) => {
        if (a.season != b.season) return a.season - b.season;
        if (a.session != b.session) return a.session - b.session;
        if (a.league == b.league) return 0;
        let days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days.indexOf(a.league) - days.indexOf(b.league);
      });
      setLeagues(newLeagues);
    });

    return () => unsub();
  }, []);

  // leagueId
  useEffect(() => {
    if (!leagueId && leagues) {
      const storedId = Storage.get('leagueId');
      const league = leagues.find(l => l.id == storedId) || leagues[0];
      setLeagueId(league.id);
    }
  }, [leagueId, leagues]);

  useEffect(() => {
    if (leagueId) {
      Storage.set('leagueId', leagueId);
      initFirebaseStore(leagueId);
    }
  }, [leagueId]);

  const value = useMemo(() => ({
    leagues,
    leagueId,
    setLeagueId
  }), [leagues, leagueId, setLeagueId]);

  return (<LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>);
}

/* ---------------------------------- */
// NavHiddenContext

const NavHiddenContext = React.createContext();
function NavHiddenProvider({ children }) {

  const [navHidden, setNavHidden] = useState(false);

  const value = useMemo(() => ({
    navHidden,
    setNavHidden
  }), [navHidden, setNavHidden]);

  return (<NavHiddenContext.Provider value={value}>{children}</NavHiddenContext.Provider>);
}

/* ---------------------------------- */
// ContextProvider

export const useAuth = () => useContext(AuthContext);
export const useOptions = () => useContext(OptionsContext);
export const useLeague = () => useContext(LeagueContext);
export const useNavHidden = () => useContext(NavHiddenContext);

export function ContextProvider({ children }) {

  return (
    <NavHiddenProvider>
      <AuthProvider>
        <LeagueProvider>
          <OptionsProvider>
            {children}
          </OptionsProvider>
        </LeagueProvider>
      </AuthProvider>
    </NavHiddenProvider>
  );
}

/* ---------------------------------- */
// hooks