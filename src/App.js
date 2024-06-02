/* ---------------------------------- */
// app

import React, { useEffect } from 'react'; // npm install react
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // npm install react-router-dom
import { Container } from 'react-bootstrap'; // npm install react-bootstrap
import { SessionProvider } from './contexts/SessionContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Standings from './components/Standings';
import Schedule from './components/Schedule';

/* ---------------------------------- */

export default function App() {

  return (
    <Router>
      <SessionProvider>
        <Navbar />
        <Container>
          <Routes>
            <Route path="/" exact element={<Home />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/schedule" element={<Schedule />} />
          </Routes>
        </Container>
        <Footer />
      </SessionProvider>
    </Router>
  )
}
