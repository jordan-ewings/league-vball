/* ---------------------------------- */
// Navbar

import React from 'react';
import { NavLink } from 'react-router-dom';

/* ---------------------------------- */

export default function Navbar() {

  return (
    <nav className="navbar">
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
