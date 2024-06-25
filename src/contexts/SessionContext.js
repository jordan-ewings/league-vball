/* ---------------------------------- */
// session context

import React, { useContext, useReducer, useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { get, child, ref, onValue, set } from "firebase/database";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { initFirebaseStore } from "../firebase/useFirebase";

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
  const [leagueId, setLeagueIdState] = useState(null);

  useEffect(() => {
    const init = async () => {
      const leaguesDB = await get(child(ref(db), 'leagues')).then(s => s.val());
      const newLeagues = Object.values(leaguesDB);

      const storedId = Storage.get('leagueId');
      const defaultId = Object.keys(leaguesDB)[0];
      const newLeagueId = storedId && leaguesDB[storedId] ? storedId : defaultId;

      setLeagues(newLeagues);
      setLeagueIdState(newLeagueId);
    }

    init();
  }, []);

  const setLeagueId = useCallback((newLeagueId) => {
    if (newLeagueId !== leagueId) {
      Storage.set('leagueId', newLeagueId);
      setLeagueIdState(newLeagueId);
      initFirebaseStore();
    }
  }, [leagueId]);

  // useEffect(() => {
  //   if (leagueId) {
  //     Storage.set('leagueId', leagueId);
  //     initFirebaseStore();
  //   }
  // }, [leagueId]);

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