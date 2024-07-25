/* ---------------------------------- */
// Home

import React from 'react';

import { MainHeader } from '../components/common';
import LeagueSelect from '../components/SelectLeague';
import AdminAccess from '../components/Login';
import TeamSelect from '../components/SelectTeam';

import { useStore, store, readAllGames } from '../firebase/useFirebase';

/* ---------------------------------- */

export default function Home() {

  // const store = useStore();
  // const games = readAllGames();
  // console.log('games:', games);
  // console.log('store:', store);

  return (
    <div className="page home">
      <MainHeader />
      <div className="main-body vstack flex-md-row">
        <div className="d-flex flex-column col-md-6">
          <LeagueSelect />
          <AdminAccess />
        </div>
        <div className="d-flex flex-column col-md-6">
          <TeamSelect />
        </div>
      </div>
    </div>
  );
}
