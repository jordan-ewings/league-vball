/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';

import { MainHeader } from '../common';
import WeekGames from './WeekGames';
import WeekButtons from './WeekButtons';

import './style.css';

/* ---------------------------------- */

export default function Schedule() {

  const currentWeek = useCurrentWeek();
  const [activeWeek, setActiveWeek] = useState(null);

  useEffect(() => {
    if (currentWeek) {
      setActiveWeek(currentWeek);
    }
  }, [currentWeek]);

  return (
    <div className="section">
      <MainHeader>
        <WeekButtons activeWeek={activeWeek} setActiveWeek={setActiveWeek} />
      </MainHeader>
      <div className="main-body">
        <WeekGames weekId={activeWeek} />
      </div>
    </div>
  );
};

/* ---------------------------------- */

function useCurrentWeek() {

  return useFirebaseCache('weeks', raw => {
    const weeks = Object.values(raw);
    const finalWeek = weeks.pop();
    const nextWeek = weeks.find(week => {
      const today = new Date().setHours(0, 0, 0, 0);
      const gameday = new Date(week.gameday).setHours(0, 0, 0, 0);
      return gameday > today;
    });
    return nextWeek ? nextWeek.id : finalWeek.id;
  });
}
