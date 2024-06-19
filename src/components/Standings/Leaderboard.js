import React, { useMemo } from 'react';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';
import {
  ContCard,
  TeamLabel,
  Table,
} from '../common';

/* ---------------------------------- */

export default function Leaderboard() {

  const teams = useFirebase('teams', (raw) => processTeams(raw));

  return (
    <div id="leaderboard-container">
      <ContCard title="LEADERBOARD" loading={!teams}>
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
            {teams && teams.map((team, i) => (
              <tr key={team.id} className="leaderboard-item">
                <td className="team"><TeamLabel team={team} /></td>
                <td className="wins">{team.stats.games.wins}</td>
                <td className="losses">{team.stats.games.losses}</td>
                <td className="winPct">{team.stats.games.winPct}</td>
                <td className="drinks">{team.stats.drinks.count}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ContCard>
    </div>
  );
}

/* ---------------------------------- */

function processTeams(raw) {

  const data = Object.values(raw).map(team => {
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
