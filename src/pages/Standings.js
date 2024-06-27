/* ---------------------------------- */
// Standings

import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import Leaderboard from '../components/Leaderboard';
import StatsMenu from '../components/StatsMenu';
import { MainHeader } from '../components/common';

/* ---------------------------------- */

export default function Standings() {

  const { state } = useLocation();
  const statsMenuRef = useRef(null);

  useEffect(() => {
    if (state && state.from === 'stats') {
      window.scrollTo({ top: statsMenuRef.current.offsetTop, behavior: 'instant' })
    }
  }, [state]);

  return (
    <div className="page">
      <MainHeader />
      <div className="main-body vstack flex-md-row">
        <div className="col-md-6">
          <Leaderboard />
        </div>
        <div className="col-md-6" ref={statsMenuRef}>
          <StatsMenu />
        </div>
      </div>
    </div>
  );
}
