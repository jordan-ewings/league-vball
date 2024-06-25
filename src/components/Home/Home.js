/* ---------------------------------- */
// Home

import React from 'react';

import { MainHeader } from '../common';
import LeagueSelect from './LeagueSelect';
import AdminAccess from './AdminAccess';
import TeamSelect from './TeamSelect';

import '../../theme/Home.css';

/* ---------------------------------- */

export default function Home() {

  return (
    <div className="page">
      {/* <MainHeader /> */}
      <div className="main-body">
        <LeagueSelect />
        <AdminAccess />
        <TeamSelect />
      </div>
    </div>
  );
}
