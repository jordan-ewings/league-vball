/* ---------------------------------- */
// Standings

import React from 'react';

import Leaderboard from './Leaderboard';
import StatsMenu from './StatsMenu';

import './style.css';

/* ---------------------------------- */

export default function Standings() {

  return (
    <div className="section">
      <div className="main-body">
        <Leaderboard />
        <StatsMenu />
      </div>
    </div>
  );
}
