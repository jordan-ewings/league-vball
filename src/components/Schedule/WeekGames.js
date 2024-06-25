/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';
import { useAuth } from '../../contexts/SessionContext';
import {
  MainHeader,
  ContCard,
  SpinnerBlock,
} from '../common';

import GameItem from './GameItem';

/* ---------------------------------- */

export default function WeekGames({ weekId }) {

  const { controls } = useAuth();
  const gamesByTime = useWeekGamesData(weekId);

  return (
    <div className="week-games">
      {gamesByTime && Object.entries(gamesByTime).map(([time, games]) => (
        <ContCard key={time} className="game-group">
          <GameItem game={games[0]} readOnly={!controls} />
          {games[1] && <GameItem game={games[1]} readOnly={!controls} />}
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
    if (!weekId) return null;

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
