/* ---------------------------------- */
// Navbar

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';

import { useNavHidden } from '../contexts/SessionContext';

/* ---------------------------------- */

export default function Navigation() {

  const { navHidden } = useNavHidden();
  const location = useLocation();
  const borderRef = useRef(null);

  useLayoutEffect(() => {
    if (!navHidden) {
      const active = document.querySelector('.nav-link.active');
      if (active) {
        borderRef.current.style.left = `${active.offsetLeft}px`;
        borderRef.current.style.width = `${active.offsetWidth}px`;
      }
    }
  }, [location.pathname, navHidden]);

  return (
    <Navbar className={navHidden ? 'hidden' : ''}>
      <Container>
        <Nav className="flex-grow-1">
          <NavLink to="/standings" className="nav-link">STANDINGS</NavLink>
          <NavLink to="/" className="nav-link flex-grow-0"><i className="fa-solid fa-volleyball-ball"></i></NavLink>
          <NavLink to="/schedule" className="nav-link">SCHEDULE</NavLink>
        </Nav>
        <div className="active-border" ref={borderRef}></div>
      </Container>
    </Navbar>
  );
}
