/* ---------------------------------- */
// session context

import React, { useContext, useReducer, useState, useEffect } from "react";
import { get, child, ref } from "firebase/database";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

/* ---------------------------------- */

const SessionContext = React.createContext();

function sessionReducer(state, action) {
  switch (action.type) {
    case 'updateSession':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

/* ---------------------------------- */

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }) {

  const [session, dispatch] = useReducer(sessionReducer, {
    leagues: {},
    league: {},
    teams: {},
    weeks: {},
    games: {},
    user: null,
    admin: false,
    adminControls: false,
    favTeam: null,
    loading: true
  });

  // initialize session
  useEffect(() => {
    async function init() {
      const leagues = await get(child(ref(db), 'leagues')).then(s => s.val());
      const leagueIdStorage = localStorage.getItem('leagueId');
      const leagueId = leagueIdStorage && leagues[leagueIdStorage] ? leagueIdStorage : Object.keys(leagues)[0];
      const league = leagues[leagueId];

      const teams = await get(child(ref(db), 'teams/' + league.id)).then(s => s.val());
      const weeks = await get(child(ref(db), 'weeks/' + league.id)).then(s => s.val());
      const games = await get(child(ref(db), 'games/' + league.id)).then(s => s.val());

      const favTeam = localStorage.getItem('favTeam');

      console.log('updateSession from init');
      dispatch({
        type: 'updateSession',
        payload: { leagues, league, teams, weeks, games, favTeam, loading: false }
      });
    }

    init();
  }, []);

  // listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, newUser => {
      const currUID = session.user ? session.user.uid : null;
      const newUID = newUser ? newUser.uid : null;
      if (currUID !== newUID) {
        setUser(newUser);
      }
    });

    return () => unsubscribe();
  }, [session.user]);

  // session change logging
  useEffect(() => {
    // see if initial run or update run
    if (session.loading) {
      console.log('Session Loading:', session);
    } else {
      console.log('Session Updated:', session);
    }
  }, [session]);

  /* ---------------------------------- */
  // methods to update session
  /* ---------------------------------- */

  // set league props, provided a leagueId
  async function setLeague(leagueId) {
    localStorage.setItem('leagueId', leagueId);
    const league = session.leagues[leagueId];
    const teams = await get(child(ref(db), 'teams/' + league.id)).then(s => s.val());
    const weeks = await get(child(ref(db), 'weeks/' + league.id)).then(s => s.val());
    const games = await get(child(ref(db), 'games/' + league.id)).then(s => s.val());

    console.log('updateSession from setLeague');
    dispatch({
      type: 'updateSession',
      payload: { league, teams, weeks, games }
    });
  }

  // set fav team, provided a team name
  // if no team name provided, null (and remove from local storage)
  function setFavTeam(teamName) {
    const favTeam = teamName ? teamName : null;
    if (teamName) {
      localStorage.setItem('favTeam', teamName);
    } else {
      localStorage.removeItem('favTeam');
    }

    console.log('updateSession from setFavTeam');
    dispatch({
      type: 'updateSession',
      payload: { favTeam }
    });
  }

  // set admin controls, provided a boolean
  function setAdminControls(bool) {
    const adminControls = bool;

    console.log('updateSession from setAdminControls');
    dispatch({
      type: 'updateSession',
      payload: { adminControls }
    });
  }

  // set user and admin status, provided a user object
  function setUser(newUser) {
    const user = newUser ? newUser : null;
    const admin = newUser && !newUser.isAnonymous ? true : false;
    const adminControls = newUser && !newUser.isAnonymous ? true : false;

    console.log('updateSession from setUser');
    dispatch({
      type: 'updateSession',
      payload: { user, admin, adminControls }
    });
  }

  // login, provided a password
  function login(password) {
    const email = 'jordanewings@outlook.com';
    return signInWithEmailAndPassword(auth, email, password);
  }

  // logout
  function logout() {
    return signOut(auth);
  }

  /* ---------------------------------- */
  // value for context provider
  /* ---------------------------------- */

  const value = {
    session,
    // readSession,

    setLeague,
    setFavTeam,
    setAdminControls,
    setUser,
    login,
    logout
  };

  return (
    <SessionContext.Provider value={value}>
      {!session.loading && children}
    </SessionContext.Provider>
  );
}
