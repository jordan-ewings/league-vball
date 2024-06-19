/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';
import {
  MainHeader,
  ContCard,
  SpinnerBlock,
} from '../common';

import GameItem from './GameItem';
import './style.css';


/* ---------------------------------- */

export default function WeekGames({ weekId }) {

  // const gamesByTime = useWeekGamesData(weekId);
  const teams = useFirebaseCache('teams');
  const gamesByTime = useFirebaseCache('games', (raw) => {
    if (!teams) return null;
    if (!raw[weekId]) return null;
    const data = Object.values(raw[weekId]);
    data.forEach(game => {
      Object.keys(game.teams).forEach(teamId => {
        const team = teams[teamId];
        game.teams[teamId] = {
          id: team.id,
          nbr: team.nbr,
          name: team.name,
        };
      });
    });

    const times = data.map(g => g.time).filter((v, i, a) => a.indexOf(v) === i);
    return times.reduce((acc, time) => {
      acc[time] = data.filter(g => g.time === time);
      return acc;
    }, {});
  });

  if (!gamesByTime) {
    return <SpinnerBlock align="center" size="3rem" />
  }

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

function useWeekGamesData(weekId) {

  const teams = useFirebaseCache('teams');
  const games = useFirebaseCache('games', raw => {
    if (!teams) return null;
    const data = Object.values(raw[weekId]);
    data.forEach(game => {
      Object.keys(game.teams).forEach(teamId => {
        const team = teams[teamId];
        game.teams[teamId] = {
          id: team.id,
          nbr: team.nbr,
          name: team.name,
        };
      });
    });

    const times = data.map(g => g.time).filter((v, i, a) => a.indexOf(v) === i);
    return times.reduce((acc, time) => {
      acc[time] = data.filter(g => g.time === time);
      return acc;
    }, {});
  });

  return games;
}
