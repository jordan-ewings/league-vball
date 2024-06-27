/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { useFirebase, useFirebaseCache } from '../firebase/useFirebase';
import { useAuth } from '../contexts/SessionContext';
import {
  MainHeader,
  ContCard,
  SpinnerBlock,
  CheckboxButton,
} from './common';

import GameItem from './GameItem';

/* ---------------------------------- */

export default function WeekGames({ weekId }) {

  const { controls } = useAuth();
  const gamesByTime = useWeekGamesData(weekId);

  return (
    <div className="week-games col-12 col-sm-8">
      {gamesByTime && Object.entries(gamesByTime).map(([time, games]) => (
        <ContCard key={time} className="game-group">
          <GameItem game={games[0]} readOnly={!controls} />
          {games[1] && <GameItem game={games[1]} readOnly={!controls} />}
        </ContCard>
      ))
      }
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
              <span>Both games cancelled</span>
              <div className="legend-key">
                <div className="vr status-bar cancelled"></div>
              </div>
            </div>
          </div>
        </div>
      </ContCard>
    </div >
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
