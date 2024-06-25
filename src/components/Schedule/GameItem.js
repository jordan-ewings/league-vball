import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useFirebase, useLeaguePaths, useFunctions } from '../../firebase/useFirebase';
import {
  Collapse,
  Alert,
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
  const [note, setNote] = useState(null);

  const teams = game.teams;
  const teamIds = Object.keys(game.teams);
  const matchIds = Object.keys(game.matches);
  const weekId = game.week;
  const gameId = game.id;

  const matches = useFirebase(refs.games(weekId, gameId, 'matches'));

  /* ---------------------------------- */
  // calculated values

  // cancelled games
  const isCancelled = (m) => m.status == 'CNCL';
  const getCancelled = (mData) => {
    if (!mData) return [];
    return Object.keys(mData).filter(mId => isCancelled(mData[mId]));
  };

  // get games that are not pre
  const isNotPre = (m) => m.status != 'PRE';
  const getNotPre = (mData) => {
    if (!mData) return [];
    return Object.keys(mData).filter(mId => isNotPre(mData[mId]));
  };

  const allCancelled = getCancelled(matches).length == 2;
  const allMatchesEntered = getNotPre(matches).length == 2;
  const saveDisabled = !form || pending || isEqual(matches, formMatches);
  const matchItemsDisabled = !form || pending;

  /* ---------------------------------- */
  // if game changes

  // if (GID != game.id) {
  //   setGID(game.id);
  //   setForm(false);
  //   setFormMatches(null);
  //   setPending(false);
  //   setAlert(null);
  //   setNote(null);
  // }

  /* ---------------------------------- */
  // matches listener

  const handleMatchUpdates = () => {
    if (GID == game.id) {
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
    } else {
      setGID(game.id);
      setForm(false);
      setFormMatches(null);
      setPending(false);
      setAlert(null);
    }

    const cancelled = getCancelled(matches);
    const c1 = cancelled.includes(matchIds[0]);
    const c2 = cancelled.includes(matchIds[1]);
    if (c1 && !c2) setNote('Game 1 cancelled');
    else if (!c1 && c2) setNote('Game 2 cancelled');
    else setNote(null);
  };

  useEffect(() => {
    if (matches) {
      handleMatchUpdates();
    }
  }, [matches]);

  useEffect(() => {
    if (formMatches) {
      console.log('formMatches:', formMatches);
    }
  }, [formMatches]);

  /* ---------------------------------- */
  // interaction handlers

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

  const updateFormMatches = (matchId, newMatch) => {
    setFormMatches(prev => {
      const newMatches = copy(prev);
      newMatches[matchId] = newMatch;
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

    const isPost = (m) => m.status == 'POST';
    const bothPost = (m1, m2) => isPost(m1) && isPost(m2);
    const diffWinner = (m1, m2) => m1.winner != m2.winner;

    // determine if records need to be updated
    let updateRecords = false;
    matchIds.forEach(mId => {
      const m = matches[mId];
      const mForm = formMatches[mId];
      if (bothPost(m, mForm) === true) {
        if (diffWinner(m, mForm) === true) {
          updateRecords = true;
        }
      } else if (isPost(m) === true || isPost(mForm) === true) {
        updateRecords = true;
        return;
      } else {
        return;
      }
    });

    console.log('updateRecords:', updateRecords);
    updateGameMatches(weekId, gameId, formMatches, updateRecords);
  }

  /* ---------------------------------- */
  // render functions

  const getMatch = (matchId) => {
    return (formMatches) ? formMatches[matchId] : (matches) ? matches[matchId] : null;
  }

  /* ---------------------------------- */
  // return

  return (
    <div className={`game-item ${form ? 'game-item-form' : ''} ${pending ? 'pending' : ''} ${allMatchesEntered ? 'post' : ''}`}>
      <div className="hstack gap-2-alt align-items-start">

        <div className="vstack flex-grow-1 flex-shrink-1 overflow-hidden">
          {teamIds.map(teamId => (
            <div key={teamId} className="main-row team-row">
              <TeamLabel team={teams[teamId]} withRecord />
              <div className="hstack">
                <TeamMatchItem match={getMatch(matchIds[0])} teamId={teamId} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[0], newMatch)} />
                <TeamMatchItem match={getMatch(matchIds[1])} teamId={teamId} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[1], newMatch)} />
              </div>
            </div>
          ))}
          <div className={`alt-row ${getCancelled(formMatches).length == 0 ? 'none' : ''}`}>
            <Collapse in={!form}>
              <div><span className="cancel-note">{note}</span></div>
            </Collapse>
            <Collapse in={form}>
              <div>
                <div className="hstack justify-content-between">
                  <ButtonInline text="Cancel All" className="cancel-label" onClick={() => handleCancelAllMatches()} disabled={!form || pending || getCancelled(formMatches).length == 2} />
                  <div className="hstack">
                    <CancelMatchItem match={getMatch(matchIds[0])} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[0], newMatch)} />
                    <CancelMatchItem match={getMatch(matchIds[1])} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[1], newMatch)} />
                  </div>
                </div>
              </div>
            </Collapse>
          </div>
          <div className="alert-row">
            <Collapse in={alert != null}>
              <div>
                <Alert variant="danger" className="hstack gap-1 py-1 px-2 m-0 mt-2">
                  <i className="bi bi-exclamation-triangle"></i>
                  <span>{alert}</span>
                </Alert>
              </div>
            </Collapse>
          </div>
        </div>

        <div className={`vr ${!form && allCancelled ? 'cancelled' : ''}`}></div>

        <div className={`vstack flex-grow-0 flex-shrink-0 ps-1 ${readOnly ? 'pe-2' : ''}`}>
          <div className="hstack gap-2-alt">
            <div className="vstack">
              <div className="game-time">{game.time}</div>
              <div className="game-court">Court {game.court}</div>
            </div>
            <div className="vstack justify-content-start">
              <IconButton icon={form ? 'bi-x-lg' : 'bi-three-dots'} onClick={toggleForm} hide={readOnly} />
            </div>
          </div>
          <div className="mt-auto">
            <Collapse in={form && !saveDisabled}>
              <div>
                <button className={`btn w-100 btn-primary`} onClick={handleSave} disabled={saveDisabled}>
                  Submit
                </button>
              </div>
            </Collapse>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------------------------------- */
// team match item
// on click, returns the updated match object (if not disabled)

function TeamMatchItem({ match, teamId, disabled = false, onChange }) {

  if (!match) return <CheckboxButton className="match-item result" checked={false} disabled={true} />;

  return (
    <CheckboxButton
      className={`match-item result ${match.status != 'PRE' ? 'entered' : ''}`}
      color="green"
      checked={match.winner == teamId}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        const newMatch = copy(match);
        newMatch.status = (newMatch.winner == teamId) ? 'PRE' : 'POST';
        newMatch.winner = (newMatch.winner == teamId) ? null : teamId;
        if (!newMatch.winner) delete newMatch.winner;
        onChange(newMatch);
      }}
    />
  );
}

function CancelMatchItem({ match, disabled = false, onChange }) {

  if (!match) return <CheckboxButton className="match-item cancel" checked={false} disabled={true} />;

  return match && (
    <CheckboxButton
      className={`match-item cancel`}
      color="red"
      xMark={true}
      checked={match.status == 'CNCL'}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        const newMatch = copy(match);
        newMatch.status = (newMatch.status == 'CNCL') ? 'PRE' : 'CNCL';
        delete newMatch.winner;
        onChange(newMatch);
      }}
    />
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

// // function to convert games object to array
// function getGamesArray(games, teamId = null) {
//   const result = [];
//   Object.keys(games).forEach(wId => {
//     Object.keys(games[wId]).forEach(gId => {
//       const game = games[wId][gId];
//       if (teamId && !game.teams[teamId]) return;
//       result.push({ weekKey: wId, gameKey: gId, ...game });
//     });
//   });
//   return result;
// }

// // function to get a team's completed matches
// function getMatchesArray(games, teamId = null) {
//   const result = [];
//   const gamesArray = getGamesArray(games, teamId);
//   gamesArray.forEach(game => {
//     Object.keys(game.matches).forEach(mId => {
//       const match = game.matches[mId];
//       if (match.status != 'POST') return;
//       const item = { matchKey: mId, ...match, ...game };
//       delete item.matches;
//       result.push(item);
//     });
//   });
//   return result;
// }

// // function to get a team's stats, overall or for a week
// function getStatsForTeam(games, teamId, weekId = null) {
//   if (!teamId) return null;
//   const result = { count: 0, wins: 0, losses: 0, record: '0-0', winPct: 0 };
//   const matches = getMatchesArray(games, teamId).filter(m => !weekId || m.weekKey == weekId);
//   matches.forEach(m => {
//     result.count++;
//     result.wins += (m.winner == teamId) ? 1 : 0;
//     result.losses += (m.winner != teamId) ? 1 : 0;
//     result.record = `${result.wins}-${result.losses}`;
//     result.winPct = result.wins / result.count;
//   });
//   return result;
// }
