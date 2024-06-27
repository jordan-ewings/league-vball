/* ---------------------------------- */
// Navbar

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';

/* ---------------------------------- */

export default function Navigation() {

  const location = useLocation();
  const borderRef = useRef(null);
  const navRef = useRef(null);

  useLayoutEffect(() => {
    setActiveBorder();
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener('resize', setActiveBorder);
    return () => window.removeEventListener('resize', setActiveBorder);
  }, []);

  return (
    <Navbar ref={navRef}>
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

/* ---------------------------------- */

function setActiveBorder() {
  const nav = document.querySelector('.navbar');
  const hidden = nav.classList.contains('hidden');
  if (hidden) return;

  const active = document.querySelector('.nav-link.active');
  if (active) {
    const border = document.querySelector('.active-border');
    border.style.left = `${active.offsetLeft}px`;
    border.style.width = `${active.offsetWidth}px`;
  }
}

/* ---------------------------------- */

export function toggleNav(bool) {
  const nav = document.querySelector('.navbar');
  if (nav) nav.classList.toggle('hidden', !bool);
}

