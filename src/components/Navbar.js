/* ---------------------------------- */
// Navbar

import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/* ---------------------------------- */

import { useNavHidden } from '../contexts/SessionContext';
import { MainHeader } from './common';

/* ---------------------------------- */

export default function Navbar() {

  const { navHidden } = useNavHidden();
  const nRef = useRef(null);
  // const nsRef = useRef(null);
  const location = useLocation();
  const activeRef = useRef(null);
  const [borderLeft, setBorderLeft] = useState(0);
  const [borderWidth, setBorderWidth] = useState(0);
  useEffect(() => {
    if (activeRef.current && !navHidden) {
      const active = activeRef.current;
      setBorderLeft(active.offsetLeft);
      setBorderWidth(active.offsetWidth);
    }
  }, [location.pathname, navHidden]);

  // when nRef is completely off the page, show nsRef
  // useEffect(() => {
  //   const n = nRef.current;
  //   const ns = nsRef.current;
  //   if (n && ns) {
  //     const handleScroll = () => {
  //       if (n.getBoundingClientRect().bottom < 0) {
  //         if (!ns.classList.contains('show')) {
  //           ns.classList.add('show');
  //         }
  //       } else {
  //         if (ns.classList.contains('show')) {
  //           ns.classList.remove('show');
  //         }
  //       }
  //     }

  //     window.addEventListener('scroll', handleScroll);
  //     return () => window.removeEventListener('scroll', handleScroll);
  //   }
  // }, []);

  return (
    <>
      <nav className={`navbar ${navHidden ? 'hidden' : ''}`} ref={nRef}>
        <div className="container-fluid px-0">
          <div className="navbar-nav flex-grow-1">
            <NavLink {...(location.pathname === '/standings' && { ref: activeRef })}
              to="/standings"
              className="nav-link"
            >
              STANDINGS
            </NavLink>
            <NavLink {...(location.pathname === '/' && { ref: activeRef })}
              to="/"
              className="nav-link flex-grow-0"
            >
              <i className="fa-solid fa-volleyball-ball"></i>
            </NavLink>
            <NavLink {...(location.pathname === '/schedule' && { ref: activeRef })}
              to="/schedule"
              className="nav-link"
            >
              SCHEDULE
            </NavLink>
          </div>
          <div className="active-border" style={{ left: borderLeft, width: borderWidth }}></div>
        </div>
      </nav>
      {/* <div className="navbar-scrolled fade" ref={nsRef}>
        <MainHeader>
          <MainHeader.Title text={
            location.pathname === '/' ? 'Home' :
              location.pathname === '/standings' ? 'Standings' :
                location.pathname === '/schedule' ? 'Schedule' : ''
          } />
        </MainHeader>
      </div> */}
    </>
  )
}
