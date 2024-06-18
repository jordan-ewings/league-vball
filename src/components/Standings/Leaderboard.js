import React, { useMemo } from 'react';
import { useSync, useSyncTeams, useFirebase, useCache } from '../../firebase/useFirebase';
import { useLeague } from '../../contexts/SessionContext';
import {
  ContCard,
  TeamLabel,
  Table,
} from '../common';

/* ---------------------------------- */

export default function Leaderboard() {

  // const teams = useLeaderboardData();
  const { leagueId } = useLeague();
  const teamsRaw = useFirebase(`teams/${leagueId}`);
  const teams = useMemo(() => sortLeaderboardData(teamsRaw), [teamsRaw]);

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

function sortLeaderboardData(teamsRaw) {

  if (!teamsRaw) return null;

  const data = Object.values(teamsRaw);
  data.forEach(team => {
    team.stats.games.winPct = parseFloat(team.stats.games.winPct) || 0;
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

function useLeaderboardData() {

  const teams = useSync('teams');
  // const teams = useSyncTeams();
  if (!teams) return null;
  console.log('teams:', teams);

  const data = Object.values(teams);
  data.forEach(team => {
    team.stats.games.winPct = parseFloat(team.stats.games.winPct) || 0;
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