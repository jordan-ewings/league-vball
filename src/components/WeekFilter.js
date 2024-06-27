/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { useFirebase, useFirebaseCache } from '../firebase/useFirebase';

/* ---------------------------------- */

export default function WeekButtons({ activeWeek, setActiveWeek }) {

  const weeks = useFirebaseCache('weeks', (raw) => Object.values(raw));
  const formatDate = (str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  useLayoutEffect(() => {
    const activeButton = document.querySelector('.week-filter-btn.active');
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeWeek, weeks]);

  /* -------------------- */
  // render

  return (
    <div className="week-filter">
      <ButtonGroup className="week-filter-btn-group">
        {weeks && weeks.map(({ id, label, gameday }) => (
          <Button key={id} className="week-filter-btn" variant={null} active={id == activeWeek} onClick={() => setActiveWeek(id)}>
            <span className="week-btn-label">{label}</span>
            <span className="week-btn-date">{formatDate(gameday)}</span>
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}
