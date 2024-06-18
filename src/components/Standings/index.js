/* ---------------------------------- */
// Standings

import React from 'react';
import Leaderboard from './Leaderboard';
import StatsMenu from './StatsMenu';

import { useLeague } from '../../contexts/SessionContext';
import './style.css';

/* ---------------------------------- */

export default function Standings() {

  const { leagueId } = useLeague();

  if (!leagueId) return null;

  return (
    <div className="section">
      <div className="main-body">
        <Leaderboard />
        <StatsMenu />
      </div>
    </div>
  );
}
