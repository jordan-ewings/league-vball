/* ---------------------------------- */
// app

import React, { useState, useEffect, useRef } from 'react'; // npm install react
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // npm install react-router-dom
import { CSSTransition, SwitchTransition } from 'react-transition-group'; // npm install react-transition-group
import { Container } from 'react-bootstrap'; // npm install react-bootstrap
import { ContextProvider } from './contexts/SessionContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Standings, { WeekStats } from './components/Standings';
import Schedule from './components/Schedule';

import { useLeague } from './contexts/SessionContext';

/* ---------------------------------- */

// const ROUTE_ORDER = ['/standings', '/', '/schedule'];

const AnimatedRoutes = () => {

  const { loading } = useLeague();
  const location = useLocation();
  // const [prevPath, setPrevPath] = useState(location.pathname);
  // const [slideDirection, setSlideDirection] = useState('slide-right');
  // if (location.pathname !== prevPath) {
  //   setPrevPath(location.pathname);
  //   const currentIdx = ROUTE_ORDER.indexOf(location.pathname);
  //   const prevIdx = ROUTE_ORDER.indexOf(prevPath);
  //   setSlideDirection(currentIdx > prevIdx ? 'slide-right' : 'slide-left');
  // }

  if (loading) return null;

  return (
    <SwitchTransition>
      <CSSTransition
        key={location.key}
        timeout={200}
        classNames="fade"
      >
        <Routes location={location}>
          <Route path="/" exact element={<Home />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/stats/:weekId" element={<WeekStats />} />
        </Routes>
      </CSSTransition>
    </SwitchTransition>
  );
};

export default function App() {

  return (
    <Router>
      <ContextProvider>
        <Navbar />
        <Container>
          <AnimatedRoutes />
        </Container>
        <Footer />
      </ContextProvider>
    </Router>
  )
}



