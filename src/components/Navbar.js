/* ---------------------------------- */
// Navbar

import React from 'react';
import { NavLink } from 'react-router-dom';

/* ---------------------------------- */

import { useNavHidden } from '../contexts/SessionContext';

/* ---------------------------------- */

export default function Navbar() {

  const { navHidden } = useNavHidden();

  return (
    <nav className={`navbar ${navHidden ? 'hidden' : ''}`}>
      <div className="container-fluid px-0">
        <div className="navbar-nav flex-grow-1">
          <NavLink to="/standings" className="nav-link flex-fill">STANDINGS</NavLink>
          <NavLink to="/" className="nav-link flex-grow-0"><i className="fa-solid fa-volleyball-ball"></i></NavLink>
          <NavLink to="/schedule" className="nav-link flex-fill">SCHEDULE</NavLink>
        </div>
      </div>
    </nav>
  )
}
