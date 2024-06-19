/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';
import {
  MainHeader,
  ContCard,
  Spinner,
} from '../common';

import './style.css';

/* ---------------------------------- */

export default function WeekButtons({ activeWeek, setActiveWeek }) {

  const weeks = useFirebaseCache('weeks', (raw) => {
    return Object.values(raw);
  });

  const activeButtonRef = useRef(null);

  useLayoutEffect(() => {
    const activeButton = activeButtonRef.current;
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeWeek, weeks]);

  const formatDate = (str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  /* -------------------- */
  // render

  if (!weeks) {
    return (
      <div className="d-flex justify-content-center">

      </div>
    );
  }

  return (
    <div className="week-filter-btn-group btn-group" role="group">
      {weeks.map(({ id, label, gameday }) => (
        <button
          key={id}
          ref={id == activeWeek ? activeButtonRef : null}
          className={`btn week-filter-btn ${id == activeWeek ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveWeek(id)}
        >
          <span className="week-btn-label">{label}</span>
          <span className="week-btn-date">{formatDate(gameday)}</span>
        </button>
      ))}
    </div>
  );
}
