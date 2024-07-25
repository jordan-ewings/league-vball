/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { useLeaguePaths, useFirebase, useWeeks, useFirebaseCache, store } from '../firebase/useFirebase';
import { Storage } from '../contexts/SessionContext';
import { isPlatform } from '@ionic/react';
import { MainHeader, SpinnerBlock } from '../components/common';
import WeekGames from '../components/WeekGames';
import WeekButtons from '../components/WeekFilter';

/* ---------------------------------- */

export default function Schedule() {

  const { data: weeks } = useWeeks();
  const currentWeek = getCurrentWeek(weeks);
  const [activeWeek, setActiveWeek] = useState(null);

  useEffect(() => {
    if (currentWeek) {
      // setActiveWeek(Storage.getExpire('lastWeek') || currentWeek);
      const storedWeek = Storage.getExpire('lastWeek');
      if (storedWeek) {
        if (weeks[storedWeek]) {
          setActiveWeek(storedWeek);
        } else {
          Storage.remove('lastWeek');
          setActiveWeek(currentWeek);
        }
      } else {
        setActiveWeek(currentWeek);
      }
    }
  }, [currentWeek, weeks]);

  // store last week for one hour
  useEffect(() => {
    if (activeWeek) Storage.setExpire('lastWeek', activeWeek, 1000 * 60 * 60);
  }, [activeWeek]);

  if (!weeks) return <SpinnerBlock align="center" size="3rem" />;

  return (
    <div className="page">
      <MainHeader>
        <WeekButtons activeWeek={activeWeek} setActiveWeek={setActiveWeek} />
      </MainHeader>
      <div className="main-body vstack align-items-center">
        <WeekGames weekId={activeWeek} />
      </div>
    </div>
  );
};

/* ---------------------------------- */

function getCurrentWeek(weeks) {
  if (!weeks) return null;
  const today = new Date().setHours(0, 0, 0, 0);
  const weeksArr = Object.values(weeks);
  const nextWeek = weeksArr.find(week => {
    const gameday = new Date(week.gameday).setHours(0, 0, 0, 0);
    return gameday > today;
  });

  return nextWeek ? nextWeek.id : weeksArr.pop().id;
}
