/* ---------------------------------- */
// app

import React from 'react'; // npm install react
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // npm install react-router-dom
import { CSSTransition, SwitchTransition } from 'react-transition-group'; // npm install react-transition-group

import { ContextProvider } from '../contexts/SessionContext';
import Navbar from './Navbar';
import Home from './Home/Home';
import Standings from './Standings/Standings';
import Stats from './Stats/Stats';
import Schedule from './Schedule/Schedule';

import '@ionic/react/css/core.css';
import '@ionic/react/css/palettes/dark.always.css';
import { setupIonicReact } from '@ionic/react';
setupIonicReact({
  mode: 'ios'
});

/* ---------------------------------- */

const AnimatedRoutes = () => {

  const location = useLocation();

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



