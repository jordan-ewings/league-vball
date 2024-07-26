import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeks } from '../firebase/useFirebase';
import { ContCard, Menu, MenuItem } from './common';

/* ---------------------------------- */
// StatsMenu

export default function StatsMenu() {

  const navigate = useNavigate();
  const { data: weeks } = useWeeks();

  return (
    <div id="stats-container" className="vstack">
      <ContCard title="STATS" loading={!weeks}>
        <Menu>
          {weeks && Object.values(weeks).map(week => (
            <MenuItem
              key={week.id}
              main={week.label}
              trail={new Date(week.gameday).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              nav={true}
              role="button"
              onClick={() => navigate(`/stats/${week.id}`)}
            />
          ))}
        </Menu>
      </ContCard>
    </div>
  )
}
