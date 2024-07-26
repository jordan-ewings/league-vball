/* ---------------------------------- */
// app

import React from 'react'; // npm install react
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // npm install react-router-dom
import { CSSTransition, SwitchTransition } from 'react-transition-group'; // npm install react-transition-group

import { ContextProvider, useLeague } from '../contexts/SessionContext';
import Navbar from '../components/Navbar';
import Home from './Home';
import Standings from './Standings';
import Stats from './Stats';
import Schedule from './Schedule';

import '@ionic/react/css/core.css';
import '@ionic/react/css/palettes/dark.always.css';
import { setupIonicReact } from '@ionic/react';
setupIonicReact({
  mode: 'ios'
});

/* ---------------------------------- */

export default function App() {

  return (
    <Router>
      <ContextProvider>
        <Navbar />
        <AnimatedRoutes />
      </ContextProvider>
    </Router>
  )
}

/* ---------------------------------- */

const AnimatedRoutes = () => {

  const location = useLocation();
  const { leagueId } = useLeague();
  if (!leagueId) return null;

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={location.key}
        classNames="fade"
        timeout={200}
        onEnter={() => window.scrollTo({ top: 0, behavior: 'instant' })}
      >
        <Routes location={location}>
          <Route path="/" exact element={<Home />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/stats/:weekId" element={<Stats />} />
        </Routes>
      </CSSTransition>
    </SwitchTransition>
  );
};



