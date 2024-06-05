/* ---------------------------------- */
// Footer

import React, { useMemo } from 'react';
import { useLeague } from '../contexts/SessionContext';

/* ---------------------------------- */

export default function Footer() {

  const { loading, league } = useLeague();
  const leagueTitle = useMemo(() => league?.title, [league]);

  if (loading) return null;

  return (
    <footer className='footer'>
      <div className='container-fluid'>
        <span>{leagueTitle}</span>
      </div>
    </footer>
  );
}