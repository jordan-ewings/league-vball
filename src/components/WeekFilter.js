/* ---------------------------------- */
// Schedule

import React, { useLayoutEffect } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { useWeeks } from '../firebase/useFirebase';
import { useAuth } from '../contexts/SessionContext';

/* ---------------------------------- */

export default function WeekButtons({ activeWeek, setActiveWeek }) {

  const { controls } = useAuth();
  const weeks = useWeeks();
  const formatDate = (str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  useLayoutEffect(() => {
    const activeButton = document.querySelector('.week-filter-btn.active');
    if (activeButton) activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeWeek, weeks]);

  /* -------------------- */
  // render

  return (
    <div className="week-filter">
      <ButtonGroup className="week-filter-btn-group">
        {Object.values(weeks.data).map(({ id, label, gameday }) => (
          <Button key={id} className="week-filter-btn" variant={null} active={id == activeWeek} onClick={() => setActiveWeek(id)}>
            <span className="week-btn-label">{label}</span>
            <span className="week-btn-date">{formatDate(gameday)}</span>
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}
