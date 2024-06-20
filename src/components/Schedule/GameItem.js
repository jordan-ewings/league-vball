import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useAuth, useLeague, useOptions } from '../../contexts/SessionContext';
import { useFirebase, getFirebase, useLeaguePaths, useFunctions } from '../../firebase/useFirebase';
import { get, child, ref, onValue, off, set, update, runTransaction } from "firebase/database";
import {
  Container,
  Collapse,
  Stack,
  Row,
  Col,
  Alert,
} from 'react-bootstrap';

import {
  TeamLabel,
} from '../common';
import { db } from '../../firebase/firebase';

/* ---------------------------------- */

export default function GameItem({ game, readOnly }) {

  const refs = useLeaguePaths();

  const [formMatches, setFormMatches] = useState(null);
  const [form, setForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState(null);

  const teams = useMemo(() => game.teams, [game.teams]);
  const teamIds = useMemo(() => Object.keys(game.teams), [game.teams]);
  const matchIds = useMemo(() => Object.keys(game.matches), [game.matches]);
  const weekId = useMemo(() => game.week, [game.week]);
  const gameId = useMemo(() => game.id, [game.id]);

  /* ---------------------------------- */
  // matches listener

  const matches = useFirebase(refs.games(weekId, gameId, 'matches'));

  const handleMatchUpdates = () => {
    if (form && pending) {
      setPending(false);
      setForm(false);
    }
    if (form && !pending) {
      setFormMatches(JSON.parse(JSON.stringify(matches)));
      setAlert('Game updated by another user.');
    }
  };

  useEffect(() => {
    if (matches) handleMatchUpdates();
  }, [matches]);

  /* ---------------------------------- */
  // interaction handlers

  const handleTeamMatchItemClick = (matchId, teamId, isWinner) => {
    if (!form) return;
    setFormMatches(prev => {
      const newMatches = { ...prev };
      const match = newMatches[matchId];
      match.status = (isWinner) ? 'POST' : 'PRE';
      match.winner = (isWinner) ? teamId : null;
      if (!isWinner) delete match.winner;
      return newMatches;
    });

    setAlert(null);
  }

  const handleCancelMatchItemClick = (matchId, isCancelled) => {
    if (!form) return;
    setFormMatches(prev => {
      const newMatches = { ...prev };
      const match = newMatches[matchId];
      match.status = (isCancelled) ? 'CNCL' : 'PRE';
      delete match.winner;
      return newMatches;
    });

    setAlert(null);
  }

  // edit button click
  const toggleForm = () => {
    if (form) {
      setForm(false);
      setFormMatches(null);
    } else {
      setForm(true);
      setFormMatches(JSON.parse(JSON.stringify(matches)));
    }
    setAlert(null);
  }

  // save button click
  const handleSave = async () => {

    setPending(true);
    const updates = {};
    const games = await getFirebase(refs.games(), data => {
      data[weekId][gameId].matches = formMatches;
      return data;
    });

    updates[refs.games(weekId, gameId, 'matches')] = formMatches;
    teamIds.forEach(teamId => {
      updates[refs.teams(teamId, 'stats', 'games')] = getStatsForTeam(games, teamId);
      updates[refs.stats(weekId, teamId, 'games')] = getStatsForTeam(games, teamId, weekId);
    });

    console.log('updates:', updates);
    update(ref(db), updates);
    // await new Promise(resolve => setTimeout(resolve, 2000));
    // handleMatchUpdates();
  }

  /* ---------------------------------- */
  // render functions

  const renderMatchItem = (matchId, teamId) => {
    if (!teamId) return renderCancelMatchItem(matchId);
    const match = (formMatches) ? formMatches[matchId] : (matches) ? matches[matchId] : null;
    const isWinner = (match && match.winner) ? match.winner == teamId : false;
    return (
      <IconButton
        className="match-item result"
        bare
        icon={`bi ${isWinner ? 'bi-check-circle' : 'bi-circle'}`}
        onClick={() => handleTeamMatchItemClick(matchId, teamId, !isWinner)}
        disabled={!form}
        small={!form}
      />
    );
  };

  const renderCancelMatchItem = (matchId) => {
    const match = (formMatches) ? formMatches[matchId] : (matches) ? matches[matchId] : null;
    const isCancelled = (match && match.status) ? match.status == 'CNCL' : false;
    return (
      <IconButton
        className={`match-item cancel ${isCancelled ? 'picked' : ''}`}
        bare
        icon="bi bi-x-circle"
        onClick={() => handleCancelMatchItemClick(matchId, !isCancelled)}
        disabled={!form}
        small={!form}
      />
    );
  };

  /* ---------------------------------- */
  // return

  return (
    <div className={`game-item ${form ? 'game-item-form' : ''}`}>
      <div className="row g-0">
        <div className={`main-col ${!readOnly ? 'col-8' : 'col-9'} `}>
          {[...teamIds, null].map(teamId => (
            <div key={teamId} className={`main-row ${teamId ? 'team-row' : 'cancel-row'}`}>
              {teamId ? < TeamLabel team={teams[teamId]} withRecord /> :
                <div className="team-label cancel-label">
                  <span class="team-nbr"></span>
                  <span class="team-name">Cancel</span>
                </div>
              }
              <div className="matches-row">
                {renderMatchItem(matchIds[0], teamId)}
                {renderMatchItem(matchIds[1], teamId)}
              </div>
            </div>
          ))}
        </div>
        <div className={`stat-col ${!readOnly ? 'col-4' : 'col-3'}`}>
          <div className="info-col">
            <div className="game-time">{game.time}</div>
            <div className="game-court">Court {game.court}</div>
          </div>
          <div className="edit-col">
            <IconButton icon={form ? 'bi-x-lg' : 'bi-three-dots'} onClick={toggleForm} hide={readOnly} />
          </div>
        </div>
      </div>
      <Collapse in={form}>
        <div className="form-footer row g-0">
          <div className="alert-col col-8">
            <Alert variant="danger" show={alert}>
              <i className="bi bi-exclamation-triangle"></i>
              <span>{alert}</span>
            </Alert>
          </div>
          <div className="save-col col-4">
            <button className="btn w-100 btn-primary" onClick={handleSave} disabled={!form || JSON.stringify(matches) == JSON.stringify(formMatches)}>
              Submit
            </button>
          </div>
        </div>
      </Collapse>
    </div>
  )
}

/* ---------------------------------- */

function IconButton({ icon, bare = false, small = false, onClick, className = '', hide = false, disabled = false }) {
  if (hide) return null;
  let divClass = 'icon-button';
  if (className) divClass += ` ${className}`;
  if (bare) divClass += ' bare';
  if (small) divClass += ' small';
  if (disabled) divClass += ' disabled';
  // const divClass = `icon-button ${className} ${bare ? 'bare' : ''} ${small ? 'small' : ''} ${disabled ? 'disabled' : ''}`;
  return (
    <div className={divClass} role="button" onClick={onClick}>
      <i className={icon}></i>
    </div>
  );
}

/* ---------------------------------- */
// helpers

// function to convert games object to array
function getGamesArray(games, teamId = null) {
  const result = [];
  Object.keys(games).forEach(wId => {
    Object.keys(games[wId]).forEach(gId => {
      const game = games[wId][gId];
      if (teamId && !game.teams[teamId]) return;
      result.push({ weekKey: wId, gameKey: gId, ...game });
    });
  });
  return result;
}

// function to get a team's completed matches
function getMatchesArray(games, teamId = null) {
  const result = [];
  const gamesArray = getGamesArray(games, teamId);
  gamesArray.forEach(game => {
    Object.keys(game.matches).forEach(mId => {
      const match = game.matches[mId];
      if (match.status != 'POST') return;
      const item = { matchKey: mId, ...match, ...game };
      delete item.matches;
      result.push(item);
    });
  });
  return result;
}

// function to get a team's stats, overall or for a week
function getStatsForTeam(games, teamId, weekId = null) {
  if (!teamId) return null;
  const result = { count: 0, wins: 0, losses: 0, record: '0-0', winPct: 0 };
  const matches = getMatchesArray(games, teamId).filter(m => !weekId || m.weekKey == weekId);
  matches.forEach(m => {
    result.count++;
    result.wins += (m.winner == teamId) ? 1 : 0;
    result.losses += (m.winner != teamId) ? 1 : 0;
    result.record = `${result.wins}-${result.losses}`;
    result.winPct = result.wins / result.count;
  });
  return result;
}
