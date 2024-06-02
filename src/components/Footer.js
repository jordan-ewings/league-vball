/* ---------------------------------- */
// Footer

import React, { useMemo } from 'react';
import { useSession } from '../contexts/SessionContext';

/* ---------------------------------- */

export default function Footer() {

  const { session } = useSession();
  const leagueTitle = useMemo(() => session.league.title, [session.league.title]);

  return (
    <footer className='footer'>
      <div className='container-fluid'>
        <span>{leagueTitle}</span>
      </div>
    </footer>
  );
}