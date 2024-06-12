/* ---------------------------------- */
// app

import React, { useEffect } from 'react'; // npm install react
import { HashRouter as Router, Routes, Route } from 'react-router-dom'; // npm install react-router-dom
import { Container } from 'react-bootstrap'; // npm install react-bootstrap
import { ContextProvider } from './contexts/SessionContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Standings, { WeekStats } from './components/Standings';
import Schedule from './components/Schedule';

/* ---------------------------------- */

export default function App() {

  return (
    <Router>
      <ContextProvider>
        <Navbar />
        <Container>
          <Routes>
            <Route path="/" exact element={<Home />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/schedule" element={<Schedule />} />

            <Route path="/stats/:weekId" element={<WeekStats />} />
          </Routes>
        </Container>
        <Footer />
      </ContextProvider>
    </Router>
  )
}

