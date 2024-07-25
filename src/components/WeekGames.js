/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { onChildAdded, ref, off, set, get } from 'firebase/database';
import { db } from '../firebase/firebase';
import { useFirebase, useWeeks, useTeams, useFirebaseCache, useLeaguePaths, useGames, store, readAllGames } from '../firebase/useFirebase';
import { useAuth } from '../contexts/SessionContext';
import {
  MainHeader,
  ContCard,
  SpinnerBlock,
  CheckboxButton,
} from './common';

import { Fade } from 'react-bootstrap';

import GameItem from './GameItem';

/* ---------------------------------- */

export default function WeekGames({ weekId }) {

  const weeks = useWeeks();

  return (
    <div className="week-games col-12 col-sm-8">
      {Object.values(weeks.data).map(week => (
        <WeekGamesItem key={week.id} weekId={week.id} show={week.id === weekId} />
      ))}
    </div>
  );
}

/* ---------------------------------- */

function WeekGamesItem({ weekId, show = false }) {

  const { controls } = useAuth();
  const games = useGames(weekId);
  const gamesByTime = useMemo(() => getGamesByTime(games), [games]);

  if (!gamesByTime) {
    return show ? <SpinnerBlock align="center" size="3rem" /> : null;
  }

  return (
    <div className={show ? '' : 'd-none'}>
      <Fade in={show} appear={true}>
        <div>
          {Object.entries(gamesByTime).map(([time, games]) => (
            <ContCard key={time} className="game-group">
              <GameItem game={games[0]} readOnly={!controls} isDisplayed={show} />
              {games[1] && <GameItem game={games[1]} readOnly={!controls} isDisplayed={show} />}
            </ContCard>
          ))}
          {gamesByTime.length !== 0 && <GameItemLegend />}
          {gamesByTime.length === 0 && (
            <div className="d-flex justify-content-center no-games-msg">
              <span>No games scheduled</span>
            </div>
          )}
        </div>
      </Fade >
    </div>
  );
}

/* ---------------------------------- */

function getGamesByTime(games) {
  if (games.loading) return null;
  const weekId = games.reference.split('/').slice(-1)[0];
  const gamesArr = Object.entries(games.data).map(([gameId, game]) => {
    return { ...game, weekId, gameId, ref: games.reference + '/' + gameId };
  });
  const times = gamesArr.map(g => g.time).filter((v, i, a) => a.indexOf(v) === i);
  const timeGames = times.reduce((acc, time) => {
    acc[time] = gamesArr.filter(g => g.time === time);
    return acc;
  }, {});
  return timeGames;
}

/* ---------------------------------- */

function GameItemLegend() {

  return (
    <ContCard className="game-group legend" title="LEGEND">
      <div className="game-item legend">
        <div className="vstack gap-1">
          <div className="legend-item hstack">
            <span>Winner</span>
            <div className="legend-key">
              <CheckboxButton className="match-item result" checked={true} disabled={true} />
            </div>
          </div>
          <div className="legend-item hstack">
            <span>Not entered</span>
            <div className="legend-key">
              <CheckboxButton className="match-item result" checked={false} disabled={true} />
            </div>
          </div>
          <div className="legend-item hstack">
            <span>Cancelled</span>
            <div className="legend-key">
              <div className="vr status-bar cancelled"></div>
            </div>
          </div>
        </div>
      </div>
    </ContCard>
  );
}

