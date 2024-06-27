import React from 'react';
import ReactDOM from 'react-dom/client';

import 'bootstrap/dist/css/bootstrap.min.css';
import './theme/App.css';
import './theme/common.css';

import './theme/Home.css';
import './theme/Standings.css';
import './theme/Schedule.css';

import App from './pages/App';

/* ---------------------------------- */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
