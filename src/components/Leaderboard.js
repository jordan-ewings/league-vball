import React, { useMemo } from 'react';
import { useTeams, useStats } from '../firebase/useFirebase';
import {
  ContCard,
  TeamLabel,
  Table,
} from './common';

/* ---------------------------------- */

export default function Leaderboard() {

  const { data: teams } = useTeams();
  const { data: gameStats } = useStats('games', 'ALL');
  const { data: drinkStats } = useStats('drinks', 'ALL');
  const data = process(teams, gameStats, drinkStats);

  return (
    <div id="leaderboard-container" className="vstack">
      <ContCard title="LEADERBOARD" loading={!data}>
        <Table className="leaderboard-table">
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
            {data && data.map((team, i) => (
              <tr key={team.id} className="leaderboard-item">
                <td className="team"><TeamLabel team={team} /></td>
                <td className="wins">{team.wins}</td>
                <td className="losses">{team.losses}</td>
                <td className="winPct">{team.winPct}</td>
                <td className="drinks">{team.drinks}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ContCard>
    </div>
  );
}

/* ---------------------------------- */

function process(teams, gameStats, drinkStats) {

  if (!teams || !gameStats || !drinkStats) return null;

  const data = Object.values(teams).map(x => {
    const team = { ...x };
    const teamGameStats = gameStats[x.id];
    const teamDrinkStats = drinkStats[x.id];
    team.games = teamGameStats.count;
    team.wins = teamGameStats.wins;
    team.losses = teamGameStats.losses;
    team.winPctVal = team.games > 0 ? team.wins / team.games : 0;
    team.winPct = team.winPctVal.toFixed(3).replace(/^0+/, '');

    team.drinks = teamDrinkStats.count;
    return team;
  });

  data.sort((a, b) => {
    if (b.winPctVal != a.winPctVal) return b.winPctVal - a.winPctVal;
    if (b.wins != a.wins) return b.wins - a.wins;
    if (a.losses != b.losses) return a.losses - b.losses;
    return a.id - b.id;
  });

  return data;
}
