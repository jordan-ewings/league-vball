/* ---------------------------------- */
// Footer

import React, { useMemo } from 'react';
import { useLeague } from '../contexts/SessionContext';

/* ---------------------------------- */

export default function Footer() {

  const leagueTitle = useLeagueTitle();

  return (
    <footer className='footer'>
      <div className='container-fluid'>
        <span>{leagueTitle}</span>
      </div>
    </footer>
  );
}

/* ---------------------------------- */

function useLeagueTitle() {

  const { leagues, leagueId } = useLeague();
  if (leagues && leagueId) {
    return leagues.find(l => l.id === leagueId).title;
  }
}