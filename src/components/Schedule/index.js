/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useAuth, useLeague, useOptions } from '../../contexts/SessionContext';
import { useFirebase } from '../../hooks/useFirebase';
import { get, child, ref, onValue, off, set, update, runTransaction } from "firebase/database";
import { db } from '../../firebase';

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

  const { loading, weeks } = useLeague();
  const [activeWeek, setActiveWeek] = useState(null);

  useEffect(() => {
    if (loading) return;
    const finalWeek = Object.values(weeks).pop();
    const nextWeek = Object.values(weeks).find(week => new Date(week.gameday) > new Date());
    setActiveWeek(nextWeek ? nextWeek.id : finalWeek.id);
  }, [loading, weeks]);

  return (
    <div className="section">
      <MainHeader>
        {!loading && <WeekButtons weeks={weeks} activeWeek={activeWeek} setActiveWeek={setActiveWeek} />}
      </MainHeader>
      <div className="main-body">
        {!loading && activeWeek && <WeekGames weekId={activeWeek} />}
      </div>
    </div>
  );
};

/* ---------------------------------- */
// WeekButtons

function WeekButtons({ weeks, activeWeek, setActiveWeek }) {

  const formatDate = (str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const buttonsRef = useRef({});
  useEffect(() => {
    const activeButton = buttonsRef.current[activeWeek];
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeWeek]);

  return (
    <div className="week-filter-btn-group btn-group" role="group">
      {Object.entries(weeks).map(([key, week]) => (
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

  const { games, teams } = useLeague();

  const gamesForWeek = useMemo(() => {
    const weekGames = games[weekId];
    if (!weekGames) return;
    return Object.values(weekGames).map((game) => {
      Object.keys(game.teams).forEach((teamId) => {
        const team = teams[teamId];
        game.teams[teamId] = {
          id: teamId,
          nbr: team.nbr,
          name: team.name,
        };
      });
      return game;
    });
  }, [games, teams, weekId]);

  const gamesByTime = useMemo(() => {
    if (!gamesForWeek) return;
    return gamesForWeek.reduce((acc, game) => {
      if (!acc[game.time]) {
        acc[game.time] = [];
      }
      acc[game.time].push(game);
      return acc;
    }, {});
  }, [gamesForWeek]);

  return (
    <div className="week-games">
      {Object.entries(gamesByTime).map(([time, games]) => (
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
