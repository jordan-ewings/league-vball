/* ---------------------------------- */
// Standings

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useLeague, useOptions, useNavHidden } from '../../contexts/SessionContext';
import { useFirebase } from '../../hooks/useFirebase';
import { get, child, ref, onValue, off, set, update, increment } from "firebase/database";
import {
  Collapse,
  Placeholder,
} from 'react-bootstrap';

import {
  MainHeader,
  ContCard,
  MenuItem,
  RadioMenuItem,
  TeamLabel,
  Spinner,
  Switch,
  ButtonInline,
  Stepper,
} from '../common';
import { db } from '../../firebase';

import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './style.css';

/* ---------------------------------- */

export default function Standings() {

  return (
    <div className="section">
      <div className="main-body">
        <Leaderboard />
        <StatsMenu />
      </div>
    </div>
  );
}

/* ---------------------------------- */

function Leaderboard() {

  const { leagueId } = useLeague();
  const teams = useFirebase('teams/' + leagueId);
  const procTeams = useMemo(() => sortTeams(teams), [teams]);

  return (
    <div id="leaderboard-container">
      <ContCard title="LEADERBOARD" loading={!procTeams}>
        <div className="table-responsive">
          <table className="leaderboard-table table table-borderless align-middle text-nowrap m-0">
            <thead>
              <tr>
                <th className="team">TEAM</th>
                <th className="wins">W</th>
                <th className="losses">L</th>
                <th className="winPct">PCT</th>
                <th className="drinks"><i className="fa-solid fa-beer"></i></th>
              </tr>
            </thead>
            <tbody>
              {procTeams && procTeams.map((team, i) => (
                <tr key={team.id} className="leaderboard-item">
                  <td className="team"><TeamLabel team={team} /></td>
                  <td className="wins">{team.stats.games.wins}</td>
                  <td className="losses">{team.stats.games.losses}</td>
                  <td className="winPct">{team.stats.games.winPct}</td>
                  <td className="drinks">{team.stats.drinks.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContCard>
    </div>
  );
}

function sortTeams(teams) {
  if (!teams) return;
  const data = Object.values(teams).map(team => {
    team.stats.games.winPct = parseFloat(team.stats.games.winPct) || 0;
    return team;
  });

  data.sort((a, b) => {
    const ad = a.stats.games;
    const bd = b.stats.games;
    if (bd.winPct != ad.winPct) return bd.winPct - ad.winPct;
    if (bd.wins != ad.wins) return bd.wins - ad.wins;
    if (ad.losses != bd.losses) return ad.losses - bd.losses;
    return a.id - b.id;
  });

  return data.map(team => {
    const winPct = team.stats.games.winPct;
    const fmtPct = winPct.toFixed(3).replace(/^0+/, '');
    team.stats.games.winPct = fmtPct;
    return team;
  });
}

/* ---------------------------------- */
// StatsMenu

function StatsMenu() {

  const navigate = useNavigate();
  const { weeks } = useLeague();
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

/* ---------------------------------- */
// WeekStats

export function WeekStats() {

  const { weekId } = useParams();
  const { leagueId, teams, weeks } = useLeague();
  const { controls } = useAuth();

  const [updates, setUpdates] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const navigate = useNavigate();
  const { setNavHidden } = useNavHidden();
  useEffect(() => {
    setNavHidden(true);
    return () => setNavHidden(false);
  }, []);

  /* ---------------------------------- */
  // handleSave

  const handleSave = () => {
    const changes = Object.values(updates).filter(v => v != 0);
    if (changes.length == 0) return;
    if (saving) return;

    setSaving(true);
    const updatesObj = {};
    Object.keys(updates).forEach(teamId => {
      const change = updates[teamId];
      if (change == 0) return;
      updatesObj[`stats/${leagueId}/${weekId}/${teamId}/drinks/count`] = increment(change);
      updatesObj[`teams/${leagueId}/${teamId}/stats/drinks/count`] = increment(change);
    });

    console.log('Posting:', updatesObj);
    update(ref(db), updatesObj)
      .then(() => {
        setSaved(true);
        setTimeout(() => {
          setSaving(false);
          setSaved(false);
        }, 2000);
      })
      .catch((error) => {
        console.error('Error updating drinks:', error);
      });
  }

  /* ---------------------------------- */
  // MainHeader render

  const renderSaveButton = () => {
    if (!controls) return null;
    const isPending = Object.values(updates).filter(v => v != 0).length > 0;
    const disabled = saving ? false : !isPending;
    const text = (!saving) ? 'Save' : null;
    const icon = (!saving) ? null : (!saved) ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check';

    return (
      <ButtonInline
        className={`btn-save ${disabled ? 'disabled' : ''}`}
        onClick={handleSave}
        text={text}
        icon={icon}
      />
    );
  }

  const renderBackButton = () => {
    return (
      <ButtonInline
        className="btn-back"
        icon="fa-solid fa-chevron-left"
        text="Back"
        onClick={() => navigate('/standings')}
      />
    );
  }

  const renderTitle = () => {
    const title = weeks && weeks[weekId] ? weeks[weekId].label : 'Week';
    return (
      <div className="main-header-title">
        <span>{title}</span>
      </div>
    )
  }

  /* ---------------------------------- */
  // render

  return (
    <div id="week-stats-container">
      <MainHeader>
        {renderBackButton()}
        {renderTitle()}
        {renderSaveButton()}
      </MainHeader>
      <div className="main-body">
        <ContCard title="TEAM DRINKS" loading={!teams}>
          {teams && Object.values(teams).map(team => (
            <TeamDrinksItem
              key={team.id}
              team={team}
              dataPath={`stats/${leagueId}/${weekId}/${team.id}/drinks/count`}
              setUpdates={setUpdates}
            />
          ))}
        </ContCard>
      </div>
    </div>
  );

}

/* ---------------------------------- */

// function TeamDrinksItem({ team, dataPath, setUpdates }) {
const TeamDrinksItem = memo(function TeamDrinksItem({ team, dataPath, setUpdates }) {

  const { controls } = useAuth();
  const drinks = useFirebase(dataPath);

  useEffect(() => {
    if (drinks === null) return;
    setUpdates((prev) => {
      const newUpdates = { ...prev };
      newUpdates[team.id] = 0;
      return newUpdates;
    });
  }, [drinks, team.id]);

  const handleStepperChange = (newValue) => {
    setUpdates((prev) => {
      const newUpdates = { ...prev };
      newUpdates[team.id] = newValue - drinks;
      return newUpdates;
    });
  }

  if (drinks === null) return;

  console.log(`TeamDrinksItem: ${drinks !== null ? 'loaded' : 'loading'}`);
  return (
    <MenuItem
      className="team-drinks-item"
      main={<TeamLabel team={team} />}
      trail={controls ?
        <Stepper initialValue={drinks} onChange={handleStepperChange} /> :
        <span className={`drinks-value ${drinks == 0 ? 'zero' : ''}`}>{drinks}</span>
      }
    />
  );
});
// }



