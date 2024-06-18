/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useAuth, useLeague, useOptions } from '../../contexts/SessionContext';
import { useFirebase, useCache } from '../../firebase/useFirebase';
import { get, child, ref, onValue, off, set, update, runTransaction } from "firebase/database";
import { db } from '../../firebase/firebase';

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
} from '../common';

import GameItem from './GameItem';
import './style.css';

/* ---------------------------------- */

export default function Schedule() {

  const currentWeek = useCurrentWeek();
  const [activeWeek, setActiveWeek] = useState(currentWeek);

  useEffect(() => {
    setActiveWeek(currentWeek);
  }, [currentWeek]);

  return activeWeek && (
    <div className="section">
      <MainHeader>
        <WeekButtons activeWeek={activeWeek} setActiveWeek={setActiveWeek} />
      </MainHeader>
      <div className="main-body">
        <WeekGames weekId={activeWeek} />
      </div>
    </div>
  );
};

/* ---------------------------------- */
// WeekButtons

function WeekButtons({ activeWeek, setActiveWeek }) {

  const weeks = useCache('weeks');
  const buttonsRef = useRef({});

  useEffect(() => {
    const activeButton = buttonsRef.current[activeWeek];
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeWeek]);

  const formatDate = (str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="week-filter-btn-group btn-group" role="group">
      {weeks && Object.entries(weeks).map(([key, week]) => (
        <button
          key={key}
          ref={el => buttonsRef.current[key] = el}
          className={`btn week-filter-btn ${key == activeWeek ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveWeek(key)}
        >
          <span className="week-btn-label">{week.label}</span>
          <span className="week-btn-date">{formatDate(week.gameday)}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- */
// WeekGames

function WeekGames({ weekId }) {

  const gamesByTime = useWeekGamesData(weekId);

  return (
    <div className="week-games">
      {gamesByTime && Object.entries(gamesByTime).map(([time, games]) => (
        <ContCard key={time} className="game-group">
          {games.map((game, index) => (
            <React.Fragment key={game.id}>
              <GameItem game={game} />
              {index < games.length - 1 && <div className="game-separator"></div>}
            </React.Fragment>
          ))}
        </ContCard>
      ))}
    </div>
  );
}

/* ---------------------------------- */

function useCurrentWeek() {

  const weeks = useCache('weeks');
  if (!weeks) return null;

  const finalWeek = Object.values(weeks).pop();
  const nextWeek = Object.values(weeks).find(week => {
    const today = new Date().setHours(0, 0, 0, 0);
    const gameday = new Date(week.gameday).setHours(0, 0, 0, 0);
    return gameday > today;
  });

  return nextWeek ? nextWeek.id : finalWeek.id;
}

/* ---------------------------------- */

function useWeekGamesData(weekId) {

  const games = useCache('games');
  const teams = useCache('teams');
  if (!games || !teams) return null;

  const gamesForWeek = Object.values(games[weekId]).map(game => {
    Object.keys(game.teams).forEach(teamId => {
      const team = teams[teamId];
      game.teams[teamId] = {
        id: team.id,
        nbr: team.nbr,
        name: team.name,
      };
    });
    return game;
  });

  const timeSlots = gamesForWeek.map(g => g.time).filter((v, i, a) => a.indexOf(v) === i);
  return timeSlots.reduce((acc, time) => {
    acc[time] = gamesForWeek.filter(g => g.time === time);
    return acc;
  }, {});
}