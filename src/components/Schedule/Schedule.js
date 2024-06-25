/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';
import { isPlatform } from '@ionic/react';
import { MainHeader, SpinnerBlock } from '../common';
import WeekGames from './WeekGames';
import WeekButtons from './WeekButtons';

import '../../theme/Schedule.css';

/* ---------------------------------- */

export default function Schedule() {

  const currentWeek = useCurrentWeek();
  const [activeWeek, setActiveWeek] = useState(null);

  useEffect(() => {
    if (currentWeek) {
      setActiveWeek(currentWeek);
    }
  }, [currentWeek]);

  // scroll to main header
  // useLayoutEffect(() => {
  //   const header = headerRef.current;
  //   if (header && !isPlatform('desktop')) {
  //     header.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   }
  // }, [activeWeek]);

  return !activeWeek ? <SpinnerBlock align="center" size="3rem" /> : (
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
