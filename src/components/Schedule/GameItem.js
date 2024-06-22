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
  Fade,
} from 'react-bootstrap';

import {
  TeamLabel,
  IconButton,
  CheckboxButton,
  ButtonInline,
} from '../common';


/* ---------------------------------- */

export default function GameItem({ game, readOnly }) {

  const refs = useLeaguePaths();
  const { updateGameMatches } = useFunctions();

  const [GID, setGID] = useState(game.id);
  const [formMatches, setFormMatches] = useState(null);
  const [form, setForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showSave, setShowSave] = useState(false);
  const [note, setNote] = useState(null);

  const teams = useMemo(() => game.teams, [game.teams]);
  const teamIds = useMemo(() => Object.keys(game.teams), [game.teams]);
  const matchIds = useMemo(() => Object.keys(game.matches), [game.matches]);
  const weekId = useMemo(() => game.week, [game.week]);
  const gameId = useMemo(() => game.id, [game.id]);

  const matches = useFirebase(refs.games(weekId, gameId, 'matches'));

  /* ---------------------------------- */
  // calculated values

  // cancelled games
  const isCancelled = (m) => m.status == 'CNCL';
  const getCancelled = (mData) => {
    if (!mData) return [];
    return Object.keys(mData).filter(mId => isCancelled(mData[mId]));
  };

  const someMatchesCancelled = getCancelled(matches).length > 0;
  const someFormMatchesCancelled = getCancelled(formMatches).length > 0;

  // get games that are not pre
  const isNotPre = (m) => m.status != 'PRE';
  const getNotPre = (mData) => {
    if (!mData) return [];
    return Object.keys(mData).filter(mId => isNotPre(mData[mId]));
  };

  const allMatchesPre = getNotPre(matches).length == 0;
  const allFormMatchesPre = getNotPre(formMatches).length == 0;




  /* ---------------------------------- */
  // if game changes

  if (GID != game.id) {
    setGID(game.id);
    setForm(false);
    setFormMatches(null);
    setPending(false);
    setAlert(null);
    setNote(null);
  }

  /* ---------------------------------- */
  // matches listener



  const handleMatchUpdates = () => {

    if (form) {
      if (pending) {
        setPending(false);
        setForm(false);
        setFormMatches(null);
      } else {
        setFormMatches(copy(matches));
        setAlert('Game updated by another user.');
      }
    }
    // setNote to either: Game 1 cancelled; Game 2 cancelled; Games cancelled
    const cancelled = getCancelled(matches);
    const c1 = cancelled.includes(matchIds[0]);
    const c2 = cancelled.includes(matchIds[1]);
    if (c1 && c2) setNote('Cancelled');
    else if (c1) setNote('Game 1 cancelled');
    else if (c2) setNote('Game 2 cancelled');
    else setNote(null);
  };

  // only run handleMatchUpdates when matches change and game is the same
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
      if (matchId) {
        const match = newMatches[matchId];
        match.status = (isCancelled) ? 'CNCL' : 'PRE';
        delete match.winner;
      }
      return newMatches;
    });
    setAlert(null);
  }

  const handleCancelAllMatches = () => {
    if (!form) return;
    setFormMatches(prev => {
      const newMatches = { ...prev };
      matchIds.forEach(mId => {
        const match = newMatches[mId];
        match.status = 'CNCL';
        delete match.winner;
      });
      return newMatches;
    });
    setAlert(null);
  }

  const handleResetAllMatches = () => {
    if (!form) return;
    setFormMatches(prev => {
      const newMatches = { ...prev };
      matchIds.forEach(mId => {
        const match = newMatches[mId];
        match.status = 'PRE';
        delete match.winner;
      });
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
      setFormMatches(copy(matches));
    }
    setAlert(null);
  }

  // save button click
  const handleSave = async () => {
    setPending(true);
    await updateGameMatches(weekId, gameId, formMatches);
  }

  /* ---------------------------------- */
  // render functions

  const renderMatchItem = (matchId, teamId) => {
    const match = (formMatches) ? formMatches[matchId] : (matches) ? matches[matchId] : null;
    const isWinner = (match && match.winner) ? match.winner == teamId : false;
    const isEntered = (match && match.status) ? match.status != 'PRE' : false;
    return (
      <CheckboxButton
        className={`match-item result ${isEntered ? 'entered' : ''}`}
        color="green"
        checked={isWinner}
        disabled={!form || pending}
        onClick={() => handleTeamMatchItemClick(matchId, teamId, !isWinner)}
      />
    );
  };

  const renderCancelMatchItem = (matchId) => {
    const matchData = (formMatches) ? formMatches : (matches) ? matches : null;
    const cancelled = getCancelled(matchData);
    const isCancelled = cancelled.includes(matchId);
    const noneCancelled = cancelled.length == 0;
    // const match = (formMatches) ? formMatches[matchId] : (matches) ? matches[matchId] : null;
    // const isCancelled = (match && match.status) ? match.status == 'CNCL' : false;
    // const isEntered = (match && match.status) ? match.status != 'PRE' : false;
    return (
      <CheckboxButton
        className={`match-item cancel ${noneCancelled ? 'none' : ''}`}
        color="red"
        xMark={true}
        // filled={false}
        checked={isCancelled}
        disabled={!form || pending}
        onClick={() => handleCancelMatchItemClick(matchId, !isCancelled)}
      />
    );
  };

  /* ---------------------------------- */
  // return

  return (
    <div className={`game-item ${form ? 'game-item-form' : ''} ${pending ? 'pending' : ''}`}>
      <div className="hstack gap-2-alt align-items-start">

        <div className="vstack gap-0 flex-grow-1 flex-shrink-1 overflow-hidden">
          {teamIds.map(teamId => (
            <div key={teamId} className="main-row team-row">
              <TeamLabel team={teams[teamId]} withRecord />
              <div className="hstack gap-1">
                {renderMatchItem(matchIds[0], teamId)}
                {renderMatchItem(matchIds[1], teamId)}
              </div>
            </div>
          ))}
          <div className="alt-row">
            <Collapse in={!form && note}>
              <div>
                <span className="cancel-note">{note}</span>
              </div>
            </Collapse>
            <Collapse in={form} onEntered={() => setShowSave(true)} onExit={() => setShowSave(false)}>
              <div>
                <div className="hstack justify-content-between">
                  <div className="hstack gap-2 align-self-end">
                    <ButtonInline
                      text="Reset"
                      className="reset-label"
                      onClick={() => handleResetAllMatches()}
                      disabled={getNotPre(formMatches).length == 0}
                    />
                    <div className="vr"></div>
                    <ButtonInline
                      text="Cancel"
                      className="cancel-label"
                      onClick={() => handleCancelAllMatches()}
                      disabled={getCancelled(formMatches).length == 2}
                    />
                  </div>
                  {/* <div className="hstack gap-1">
                    {renderCancelMatchItem(matchIds[0])}
                    {renderCancelMatchItem(matchIds[1])}
                  </div> */}
                </div>
              </div>
            </Collapse>
          </div>
          <div className="alert-row">
            <Collapse in={alert}>
              <div>
                <Alert variant="danger" className="hstack gap-1 py-1 px-2 m-0 mt-2">
                  <i className="bi bi-exclamation-triangle"></i>
                  <span>{alert}</span>
                </Alert>
              </div>
            </Collapse>
          </div>
        </div>

        <div className="vr"></div>

        <div className="vstack gap-1 flex-grow-0 flex-shrink-0">
          <div className="hstack gap-2-alt">
            <div className="vstack">
              <div className="game-time">{game.time}</div>
              <div className="game-court">Court {game.court}</div>
            </div>
            <div className="vstack justify-content-start">
              <IconButton
                icon={form ? 'bi-x-lg' : 'bi-three-dots-vertical'}
                // color={form ? 'text-secondary' : null}
                onClick={toggleForm}
                hide={readOnly}
              />
            </div>
          </div>
          <div className="mt-auto">
            <Fade in={showSave} timeout={50} mountOnEnter unmountOnExit>
              <div>
                <button className="btn btn-primary w-100" onClick={handleSave} disabled={!form || pending || isEqual(matches, formMatches)}>
                  Submit
                </button>
              </div>
            </Fade>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------------------------------- */
// helpers

function copy(object) {
  return JSON.parse(JSON.stringify(object));
}

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) == JSON.stringify(obj2);
}

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
