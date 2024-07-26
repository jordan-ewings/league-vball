import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/SessionContext';
import { toggleNav } from '../components/Navbar';
import { useLeaguePaths, useTeams, useWeeks, useStats } from '../firebase/useFirebase';
import { ref, update, increment } from "firebase/database";
import { db } from '../firebase/firebase';

import {
  MainHeader,
  ContCard,
  Menu,
  MenuItem,
  TeamLabel,
  Stepper,
} from '../components/common';

/* ---------------------------------- */
// WeekStats

export default function WeekStats() {

  const navigate = useNavigate();
  const { weekId } = useParams();
  const { controls } = useAuth();
  const refs = useLeaguePaths();
  const { data: teams } = useTeams();
  const { data: week } = useWeeks(weekId);
  const { data: teamDrinks } = useStats('drinks', weekId);
  const [updates, setUpdates] = useState({});

  useEffect(() => {
    toggleNav(false);
    return () => toggleNav(true);
  }, []);

  const handleSave = async () => {
    try {
      console.log('updates:', updates);
      await update(ref(db), updates);
      setUpdates({});
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  const getTeamDrinks = (teamId) => {
    if (teamDrinks && teamDrinks[teamId]) {
      return teamDrinks[teamId].count;
    }
    return null;
  }

  /* ---------------------------------- */
  // render

  return (
    <div className="page">
      <MainHeader>
        <MainHeader.BackButton onClick={() => navigate('/standings', { state: { from: 'stats' } })} />
        <MainHeader.Title text={week ? week.label : 'Week'} />
        {controls && <MainHeader.SaveButton onClick={handleSave} disabled={Object.keys(updates).length == 0} />}
      </MainHeader>
      <div className="main-body vstack align-items-center">
        <div className="col-12 col-md-8">
          <ContCard title="TEAM DRINKS" loading={!teams}>
            <Menu>
              {teams && teamDrinks && Object.values(teams).map(team => (
                <TeamDrinksItem
                  key={team.id}
                  team={team}
                  drinks={getTeamDrinks(team.id)}
                  refWeekStat={refs.stats('drinks', weekId, team.id, 'count')}
                  refTeamStat={refs.stats('drinks', 'ALL', team.id, 'count')}
                  setUpdates={setUpdates}
                  readOnly={!controls}
                />
              ))}
            </Menu>
          </ContCard>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */

function TeamDrinksItem({ team, drinks, refWeekStat, refTeamStat, setUpdates, readOnly }) {

  const handleStepperChange = (newValue) => {
    const change = newValue - drinks;
    setUpdates((prev) => {
      const updates = { ...prev };
      if (change !== 0) {
        updates[refWeekStat] = increment(change);
        updates[refTeamStat] = increment(change);
      } else {
        delete updates[refWeekStat];
        delete updates[refTeamStat];
      }
      return updates;
    });
  }

  return (
    <MenuItem
      className="team-drinks-item"
      main={<TeamLabel team={team} />}
      trail={drinks !== null && <Stepper initialValue={drinks} onChange={handleStepperChange} disabled={readOnly} />}
    />
  );
}
