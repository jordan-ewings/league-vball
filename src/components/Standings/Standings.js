/* ---------------------------------- */
// Standings

import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import Leaderboard from './Leaderboard';
import StatsMenu from './StatsMenu';
import { MainHeader } from '../common';

import '../../theme/Standings.css';

/* ---------------------------------- */

export default function Standings() {

  const { state } = useLocation();
  const scrollToStatsMenu = state && state.from === 'stats';
  const statsMenuRef = useRef(null);

  useEffect(() => {
    if (scrollToStatsMenu) {
      window.scrollTo({ top: statsMenuRef.current.offsetTop, behavior: 'instant' })
    }
  }, [scrollToStatsMenu]);

  return (
    <div className="section">
      <MainHeader />
      <div className="main-body">
        <Leaderboard />
        <div ref={statsMenuRef}><StatsMenu /></div>
      </div>
    </div>
  );
}
