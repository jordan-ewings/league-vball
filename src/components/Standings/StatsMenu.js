import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useLeague, useOptions, useNavHidden } from '../../contexts/SessionContext';
import { useFirebase, useCache } from '../../firebase/useFirebase';
import { get, child, ref, onValue, off, set, update, increment } from "firebase/database";

import {
  MainHeader,
  ContCard,
  MenuItem,
  TeamLabel,
  ButtonInline,
  Stepper,
} from '../common';
import { db } from '../../firebase/firebase';

/* ---------------------------------- */
// StatsMenu

export default function StatsMenu() {

  const navigate = useNavigate();
  const weeks = useCache('weeks');
  const options = useMemo(() => (weeks ? Object.values(weeks) : null), [weeks]);

  return (
    <div id="stats-container">
      <ContCard title="STATS" loading={!options}>
        {options && options.map(week => (
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
