/* ---------------------------------- */
// Standings

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useAuth, useLeague, useOptions } from '../contexts/SessionContext';
import { useFirebase } from '../hooks/useFirebase';
import { get, child, ref, onValue, off, set, update, runTransaction } from "firebase/database";
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
} from './common';
import { db } from '../firebase';

/* ---------------------------------- */

export default function Standings() {



  return (
    <div className="section">
      <MainHeader />
      <div className="main-body">
        <Leaderboard />
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
    <div id="leaderboard-container" className="padded-sides">
      <ContCard title="LEADERBOARD" loading={loading}>
        <div className="table-responsive">
          <table className="table table-borderless align-middle text-nowrap m-0">
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
                <tr key={team.id}>
                  <td className="team">
                    <TeamLabel team={team} />
                  </td>
                  <td className="wins">{team.stats.games.wins}</td>
                  <td className="losses">{team.stats.games.losses}</td>
                  <td className="winPct">{team.stats.games.winPct}</td>
                  <td className="drinks">{team.stats.drinks.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContCard>
    </div>
  );

  // return (
  //   <ContCard title="LEADERBOARD" loading={loading}>
  //     <div class="table-responsive">
  //       <table class="table table-borderless align-middle text-nowrap m-0">
  //         <thead>
  //           <tr>
  //             <th class="team">TEAM</th>
  //             <th class="wins">W</th>
  //             <th class="losses">L</th>
  //             <th class="winPct">PCT</th>
  //             <th class="drinks"><i class="fa-solid fa-beer"></i></th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {procTeams.map((team, i) => (
  //             <tr key={team.id}>
  //               <td class="team">
  //                 <TeamLabel team={team} />
  //               </td>
  //               <td class="wins">{team.stats.games.wins}</td>
  //               <td class="losses">{team.stats.games.losses}</td>
  //               <td class="winPct">{team.stats.games.winPct}</td>
  //               <td class="drinks">{team.stats.drinks.count}</td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     </div>
  //   </ContCard>
  // );


}



