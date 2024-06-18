import React, { useMemo } from 'react';
import { useOptions } from '../../contexts/SessionContext';
import { useCache } from '../../firebase/useFirebase';

import {
  ContCard,
  RadioMenuItem,
  TeamLabel,
} from '../common';

/* ---------------------------------- */
// TeamSelect

export default function TeamSelect() {

  const { favTeam, setFavTeam } = useOptions();
  const teams = useCache('teams');

  const options = !teams ? null : Object.values(teams).sort((a, b) => {
    if (a.name === favTeam) return -1;
    if (b.name === favTeam) return 1;
    return 0;
  });

  return (
    <div id="team-select-container">
      <ContCard title="MY TEAM" loading={!options}>
        <div className="radio-menu">
          {options && options.map(team => {
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
    </div>
  );
}

