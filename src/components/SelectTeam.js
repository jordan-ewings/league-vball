import React, { useEffect, useMemo } from 'react';
import { useOptions, useLeague } from '../contexts/SessionContext';
import { useTeams } from '../firebase/useFirebase';

import {
  ContCard,
  Menu,
  RadioMenuItem,
  TeamLabel,
} from '../components/common';

/* ---------------------------------- */
// TeamSelect

export default function TeamSelect() {

  const { leagueId } = useLeague();
  const { favTeam, setFavTeam } = useOptions();
  const { data: teams } = useTeams();
  if (!leagueId) return null;

  return (
    <ContCard title="MY TEAM" loading={!teams}>
      <Menu>
        {teams && Object.values(teams)
          .sort((a, b) => {
            if (a.name === favTeam) return -1;
            if (b.name === favTeam) return 1;
            return 0;
          })
          .map(team => {
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
      </Menu>
    </ContCard>
  );
}

/* ---------------------------------- */



