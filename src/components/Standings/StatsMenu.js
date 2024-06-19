import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';

import {
  ContCard,
  MenuItem,
} from '../common';

/* ---------------------------------- */
// StatsMenu

export default function StatsMenu() {

  const navigate = useNavigate();
  const weeks = useFirebaseCache('weeks', raw => Object.values(raw));

  return (
    <div id="stats-container">
      <ContCard title="STATS" loading={!weeks}>
        {weeks && weeks.map(week => (
          <MenuItem
            key={week.id}
            main={week.label}
            trail={new Date(week.gameday).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            nav={true}
            onClick={() => navigate(`/stats/${week.id}`)}
          />
        ))}
      </ContCard>
    </div>
  )
}
