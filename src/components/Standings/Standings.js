/* ---------------------------------- */
// Standings

import React, { useEffect } from 'react';

import Leaderboard from './Leaderboard';
import StatsMenu from './StatsMenu';
import { MainHeader } from '../common';
import { useNavHidden } from '../../contexts/SessionContext';

import './style.css';

/* ---------------------------------- */

export default function Standings() {

  const { setNavHidden } = useNavHidden();

  useEffect(() => {
    setNavHidden(false);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="section">
      <MainHeader />
      <div className="main-body">
        <Leaderboard />
        <StatsMenu />
      </div>
    </div>
  );
}
