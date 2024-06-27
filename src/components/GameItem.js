import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useFirebase, useLeaguePaths, useFunctions } from '../firebase/useFirebase';
import {
  Collapse,
  Alert,
} from 'react-bootstrap';

import {
  TeamLabel,
  IconButton,
  CheckboxButton,
  ButtonInline,
} from './common';

/* ---------------------------------- */

export default function GameItem({ game, readOnly }) {

  const refs = useLeaguePaths();
  const { updateGameMatches } = useFunctions();

  const [GID, setGID] = useState(game.id);
  const [formMatches, setFormMatches] = useState(null);
  const [form, setForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState(false);

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

  const liveMatches = formMatches || matches;

  const allCancelled = getCancelled(matches).length == 2;
  const someCancelled = getCancelled(matches).length == 1;
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
          setAlert(true);
        }
      }
    } else {
      setGID(game.id);
      setForm(false);
      setFormMatches(null);
      setPending(false);
      setAlert(false);
    }
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
    setAlert(false);
  }

  const updateFormMatches = (matchId, newMatch) => {
    setFormMatches(prev => {
      const newMatches = copy(prev);
      newMatches[matchId] = newMatch;
      return newMatches;
    });
    setAlert(false);
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
    setAlert(false);
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

  const renderTeamRowContent = (teamId) => {
    return (
      <div className="hstack justify-content-between">
        <TeamLabel team={teams[teamId]} withRecord />
        <div className="hstack gap-1">
          <TeamMatchItem match={getMatch(matchIds[0])} teamId={teamId} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[0], newMatch)} />
          <div className="match-separator vr"></div>
          <TeamMatchItem match={getMatch(matchIds[1])} teamId={teamId} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[1], newMatch)} />
        </div>
      </div>
    );
  }

  const renderCancelRowContent = () => {
    return (
      <div>
        <div className="hstack justify-content-between">
          {/* <ButtonInline text="Cancel All" className="cancel-label" onClick={() => handleCancelAllMatches()} disabled={!form || pending || getCancelled(formMatches).length == 2} /> */}
          <div className="cancel-label"></div>
          <div className="hstack gap-1">
            <CancelMatchItem match={getMatch(matchIds[0])} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[0], newMatch)} />
            <div className="match-separator vr"></div>
            <CancelMatchItem match={getMatch(matchIds[1])} disabled={matchItemsDisabled} onChange={newMatch => updateFormMatches(matchIds[1], newMatch)} />
          </div>
        </div>
      </div>
    );
  }

  const renderNoteRowContent = () => {
    const can = getCancelled(matches);
    const cancelNote = (can.length == 1) ? 'Game ' + (matchIds.indexOf(can[0]) + 1) + ' cancelled' : null;
    return (
      <div>
        <div className="vstack justify-content-end">
          {cancelNote && <span className="cancel-note">{cancelNote}</span>}
        </div>
      </div>
    );
  }

  const renderAlertRowContent = () => {
    return (
      <div>
        <Alert variant="danger" className="hstack gap-1 py-1 px-2 m-0 mt-2">
          <i className="bi bi-exclamation-triangle"></i>
          <span>Game updated</span>
        </Alert>
      </div>
    );
  }

  const renderLabelRowContent = () => {
    return (
      <div>
        <div className="hstack justify-content-between align-items-end">
          <div className="team-header"></div>
          <div className="hstack gap-1">
            <div className="match-header"><span>G1</span></div>
            <div className="match-separator vr"></div>
            <div className="match-header"><span>G2</span></div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------- */
  // return

  let gameItemClass = 'game-item';
  if (!form) gameItemClass += ' view';
  if (form) gameItemClass += ' form';
  if (pending) gameItemClass += ' pending';
  if (allMatchesEntered) gameItemClass += ' post';

  let statusBarClass = 'status-bar vr';
  if (getCancelled(liveMatches).length == 2) statusBarClass += ' cancelled';

  return (
    <div className={gameItemClass}>
      <div className="hstack gap-2-alt align-items-start">

        <div className="vstack overflow-hidden">
          <div className="main-row team-row">{renderTeamRowContent(teamIds[0])}</div>
          <div className="main-row team-row">{renderTeamRowContent(teamIds[1])}</div>
          {/* <Collapse in={!form && someCancelled} className="note-row">{renderNoteRowContent()}</Collapse> */}
          <Collapse in={form} className="cancel-row">{renderCancelRowContent()}</Collapse>
          <Collapse in={form} className="label-row">{renderLabelRowContent()}</Collapse>
          <Collapse in={alert} className="alert-row">{renderAlertRowContent()}</Collapse>
        </div>

        <div className={statusBarClass}></div>

        <div className={`vstack flex-fit ps-1 ${readOnly ? 'pe-2' : ''}`}>
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
  let classNames = 'match-item result ' + match.status.toLowerCase();

  return (
    <CheckboxButton
      className={classNames}
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
  let classNames = 'match-item cancel ' + match.status.toLowerCase();

  return match && (
    <CheckboxButton
      className={classNames}
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
