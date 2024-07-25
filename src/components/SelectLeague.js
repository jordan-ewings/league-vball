import React, { useMemo, useState, useEffect } from 'react';
import { useLeague } from '../contexts/SessionContext';

import {
  ContCard,
  Menu,
  MenuCollapsible,
  RadioMenuItem,
  MenuItem,
} from '../components/common';

/* ---------------------------------- */
// league select

export default function LeagueSelect() {

  const { leagues, leagueId, setLeagueId } = useLeague();
  const [activeSS, setActiveSS] = useState(null);

  const getSSKey = (league) => league.season + '-' + league.session;
  const getSSTitle = (ssKey) => {
    const [season, session] = ssKey.split('-');
    const sessionNbr = parseInt(session);
    const sessionLabel = sessionNbr == 1 ? '1st Session' : '2nd Session';
    return (
      <div className="ss-label">
        <span>{season + ' - ' + sessionLabel}</span>
      </div>
    );
  }
  const toProperCase = (str) => {
    return str.split(' ').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  const seasonSessions = useMemo(() => {
    if (!leagues) return null;
    return leagues.reduce((acc, league) => {
      const ss = getSSKey(league);
      if (!acc[ss]) acc[ss] = [];
      acc[ss].push(league);
      return acc;
    }, {});
  }, [leagues]);

  useEffect(() => {
    if (!leagueId) return;
    const league = leagues.find(l => l.id == leagueId);
    if (league) setActiveSS(getSSKey(league));
  }, [leagueId, leagues]);

  return (
    <ContCard title="SELECT LEAGUE" loading={!leagues}>
      <Menu>
        {seasonSessions && Object.entries(seasonSessions).map(([ss, options]) => (
          <MenuCollapsible key={ss} inactive={activeSS && activeSS != ss} expanded={activeSS == ss} title={getSSTitle(ss)} onClick={(newState) => setActiveSS(newState ? ss : null)}>
            {options.map(o => (
              <RadioMenuItem
                key={o.id}
                title={toProperCase(o.league) + ' Night'}
                selected={o.id == leagueId}
                onClick={() => setLeagueId(o.id)}
              />
            ))}
          </MenuCollapsible>
        ))}
      </Menu>
    </ContCard>
  );
}

/* ---------------------------------- */
