import React, { useMemo } from 'react';
import { useLeague } from '../../contexts/SessionContext';

import {
  ContCard,
  RadioMenuItem,
} from '../common';

/* ---------------------------------- */
// league select

export default function LeagueSelect() {

  const { leagues, leagueId, setLeagueId } = useLeague();
  const options = sortLeagues(leagues);

  const createTitle = (title) => {
    const main1 = title.split(' ')[0] + ' Night';
    const main2 = title.split(' ').slice(2).join(' ');
    return (
      <div className="d-flex justify-content-start align-items-center column-gap-2">
        <span>{main1}</span>
        {/* <span className="sub-main">{main2}</span> */}
      </div>
    );
  }

  return (
    <div id="league-select-container">
      <ContCard title="SELECT LEAGUE" loading={!options}>
        <div className="radio-menu">
          {options && options.map(o => (
            <RadioMenuItem
              key={o.id}
              title={createTitle(o.title)}
              selected={o.id == leagueId}
              onClick={() => setLeagueId(o.id)}
            />
          ))}
        </div>
      </ContCard>
    </div>
  );
}

/* ---------------------------------- */

function sortLeagues(leagues) {
  if (leagues) {
    return Object.values(leagues).sort((a, b) => {
      if (a.season != b.season) return a.season - b.season;
      if (a.session != b.session) return a.session - b.session;
      if (a.league == b.league) return 0;
      let days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      return days.indexOf(a.league) - days.indexOf(b.league);
    });
  }
}