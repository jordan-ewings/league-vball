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

import './style.css';

/* ---------------------------------- */

export default function Standings() {



  return (
    <div className="section">
      <MainHeader />
      <div className="main-body">
        <Leaderboard />
        <StatsMenu />
      </div>
    </div>
  );
}

/* ---------------------------------- */

function Leaderboard() {

  const [loading, setLoading] = useState(true);
  const { leagueId } = useLeague();
  const [procTeams, setProcTeams] = useState([]);
  const teams = useFirebase('teams/' + leagueId);

  useEffect(() => {
    if (!teams) return;
    const teamsArr = Object.values(teams).map(team => {
      team.stats.games.winPct = team.stats.games.winPct || 0;
      return team;
    });

    teamsArr.sort((a, b) => {
      let aGS = a.stats.games;
      let bGS = b.stats.games;
      if (aGS.winPct != bGS.winPct) return bGS.winPct - aGS.winPct;
      if (aGS.wins != bGS.wins) return bGS.wins - aGS.wins;
      if (aGS.losses != bGS.losses) return aGS.losses - bGS.losses;
      if (a.id != b.id) return a.id - b.id;
      return 0;
    });

    setProcTeams(teamsArr);
    setLoading(false);
  }, [teams]);

  return (
    <div id="leaderboard-container">
      <ContCard title="LEADERBOARD" loading={loading}>
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
              {procTeams.map((team, i) => (
                <LeaderboardItem key={team.id} team={team} />
              ))}
            </tbody>
          </table>
        </div>
      </ContCard>
    </div>
  );
}

/* ---------------------------------- */
// LeaderboardItem

function LeaderboardItem({ team }) {

  const formatPct = (val) => {
    return val.toFixed(3).replace(/^0+/, '');
  }

  return (
    <tr className="leaderboard-item">
      <td className="team">
        <TeamLabel team={team} />
      </td>
      <td className="wins">{team.stats.games.wins}</td>
      <td className="losses">{team.stats.games.losses}</td>
      <td className="winPct">{formatPct(team.stats.games.winPct)}</td>
      <td className="drinks">{team.stats.drinks.count}</td>
    </tr>
  );
}

/* ---------------------------------- */
// StatsMenu

function StatsMenu() {

  const navigate = useNavigate();
  const { weeks } = useLeague();
  const [loading, setLoading] = useState(true);
  const [weeksArr, setWeeksArr] = useState([]);

  useEffect(() => {
    if (Object.keys(weeks).length == 0) return;
    const arr = Object.values(weeks).map(week => {
      return {
        id: week.id,
        title: week.label,
        date: new Date(week.gameday).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      }
    });

    setWeeksArr(arr);
    setLoading(false);
  }, [weeks]);

  return (
    <div id="stats-container">
      <ContCard title="STATS" loading={loading}>
        {weeksArr.map(week => (
          <MenuItem
            key={week.id}
            main={week.title}
            trail={week.date}
            nav={true}
            onClick={() => navigate('/stats/' + week.id)}
          />
        ))}
      </ContCard>
    </div>
  )
}

/* ---------------------------------- */
// WeekStats

export function WeekStats() {

  const { leagueId, teams, weeks } = useLeague();
  const { weekId } = useParams();
  const navigate = useNavigate();
  const { setNavHidden } = useNavHidden();

  const week = weeks[weekId];
  const [updates, setUpdates] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!week) return;
    setLoading(false);
    setNavHidden(true);
  }, [week]);

  useEffect(() => {
    if (loading) return;
    console.log('updates:', updates);
  }, [updates]);

  const handleSave = () => {
    if (Object.keys(updates).length == 0) return;
    if (saving || saved) return;

    setSaving(true);
    const updatesObj = {};
    Object.keys(updates).forEach(teamId => {
      const change = updates[teamId];
      updatesObj[`stats/${leagueId}/${weekId}/${teamId}/drinks/count`] = increment(change);
      updatesObj[`teams/${leagueId}/${teamId}/stats/drinks/count`] = increment(change);
    });

    update(ref(db), updatesObj)
      .then(() => {
        setSaving(false);
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setUpdates({});
        }, 1000);
      })
      .catch((error) => {
        console.error('Error updating drinks:', error);
      });
  }

  const renderSaveButton = () => {
    if (loading) return null;
    const disabled = Object.keys(updates).length == 0;
    const text = (!saving && !saved) ? 'Save' : null;
    const icon = (saving)
      ? 'fa-solid fa-spinner fa-spin'
      : (saved)
        ? 'fa-solid fa-check'
        : null;

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
    if (loading) return null;
    return (
      <ButtonInline
        className="btn-back"
        icon="fa-solid fa-chevron-left"
        text="Back"
        onClick={() => {
          navigate('/standings');
          setNavHidden(false);
        }}
      />
    );
  }

  return !loading && (
    <div id="week-stats-container">
      <MainHeader>
        {renderBackButton()}
        <div className="main-header-title">
          <span>{week.label}</span>
        </div>
        {renderSaveButton()}
      </MainHeader>
      <div className="main-body">
        <ContCard title="TEAM DRINKS">
          {Object.values(teams).map(team => (
            <TeamDrinksItem
              key={team.id}
              team={team}
              week={week}
              setUpdates={setUpdates}
            />
          ))}
        </ContCard>
      </div>
    </div>
  );

}

/* ---------------------------------- */

function TeamDrinksItem({ team, week, setUpdates }) {

  const { leagueId } = useLeague();
  const [value, setValue] = useState(null);
  const weekDrinksPath = `stats/${leagueId}/${week.id}/${team.id}/drinks/count`;
  const drinks = useFirebase(weekDrinksPath);

  useEffect(() => {
    if (drinks == null) return;
    setValue(drinks);
  }, [drinks]);

  useEffect(() => {
    if (value == null) return;
    if (value == drinks) {
      setUpdates((prev) => {
        const newUpdates = { ...prev };
        delete newUpdates[team.id];
        return newUpdates;
      });
    } else {
      setUpdates((prev) => {
        const newUpdates = { ...prev };
        newUpdates[team.id] = value - drinks;
        return newUpdates;
      });
    }
  }, [value]);


  return (
    <MenuItem
      className="team-drinks-item"
      main={<TeamLabel team={team} />}
      trail={
        <Stepper
          initial={drinks}
          value={value}
          setValue={setValue}
        />
      }
    />
  );
}



