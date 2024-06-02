/* ---------------------------------- */
// Home

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '../contexts/SessionContext';

import { ContCard } from './common';

/* ---------------------------------- */

export default function Standings() {

  return (
    <div className="section">
      <MainHeader show={true}>

      </MainHeader>
      <div>
        {/* <LeagueSelect />
        <AdminControls />
        <TeamSelect /> */}
      </div>
    </div>
  );
}

/* ---------------------------------- */

function MainHeader({ children, show }) {

  return (
    <div className="main-header">
      {show && children}
    </div>
  );
}

/* ---------------------------------- */



