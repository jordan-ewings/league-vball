import React, { useMemo } from 'react';
import { useOptions } from '../contexts/SessionContext';
import { useFirebaseCache } from '../firebase/useFirebase';

import {
  ContCard,
  RadioMenuItem,
  TeamLabel,
} from '../components/common';

/* ---------------------------------- */
// TeamSelect

export default function TeamSelect() {

  const { favTeam, setFavTeam } = useOptions();
  const teams = useFirebaseCache('teams', raw => {
    const data = Object.values(raw).map(team => {
      return {
        id: team.id,
        name: team.name,
        nbr: team.nbr,
      };
    });

    data.sort((a, b) => {
      if (a.name === favTeam) return -1;
      if (b.name === favTeam) return 1;
      return 0;
    });
    return data;
  });

  return (
    // <div id="team-select-container">
    <ContCard title="MY TEAM" loading={!teams}>
      <div className="radio-menu">
        {teams && teams.map(team => {
          const isFav = team.name == favTeam;
          return (
            <RadioMenuItem
              key={team.id}
              title={<TeamLabel team={team} />}
              selected={isFav}
              onClick={() => setFavTeam(isFav ? null : team.name)}
            />
          );
        })}
      </div>
    </ContCard>
    // </div>
  );
}

