import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useTeams, useLeaguePaths, readAllGames } from '../firebase/useFirebase';
import { Collapse, Alert, } from 'react-bootstrap';
import {
  TeamLabel,
  IconButton,
  CheckboxButton,
  ButtonInline,
} from './common';
import { db } from '../firebase/firebase';
import { get, ref, set, update } from 'firebase/database';

/* ---------------------------------- */

export default function GameItem({ game, readOnly, isDisplayed }) {

  const gameId = game.gameId;
  const gamePath = game.ref;
  const gameWeekId = game.weekId;
  const match = game.match;

  const [form, setForm] = useState(false);
  const [formMatch, setFormMatch] = useState(null);
  const [formPending, setFormPending] = useState(false);
  const [alert, setAlert] = useState(false);

  const refs = useLeaguePaths();
  const { data: allTeams } = useTeams();
  const getTeam = (teamId) => allTeams[teamId];
  const getLiveMatch = () => form ? formMatch : match;
  const matchItemsDisabled = !form || formPending;
  const saveDisabled = !form || formPending || isEqual(match, formMatch);

  const closeForm = () => {
    setForm(false);
    setFormMatch(null);
    setAlert(false);
  }
  const openForm = () => {
    setForm(true);
    setFormMatch(copy(match));
    setAlert(false);
  }

  const toggleForm = () => {
    if (form) {
      closeForm();
    } else {
      openForm();
    }
  }

  const handleMatchUpdate = () => {
    if (!form) return;
    if (formPending) {
      setFormPending(false);
      closeForm();
      return;
    }
    setFormMatch(copy(match));
    setAlert(true);
    console.log('Alert: game updated');
  }

  /* ---------------------------------- */
  // onGameUpdate

  useEffect(() => {
    if (match) handleMatchUpdate();
  }, [match]);

  useEffect(() => {
    if (!isDisplayed) closeForm();
  }, [isDisplayed]);

  useEffect(() => {
    if (formMatch) console.log('formMatch:', formMatch);
  }, [formMatch]);

  /* ---------------------------------- */
  // cancelFormMatch

  const cancelFormMatch = () => {
    if (!form) return;
    setFormMatch(prev => {
      const newMatch = copy(prev);
      newMatch.status = 'CNCL';
      Object.keys(newMatch.results).forEach(resultId => newMatch.results[resultId] = '');
      return newMatch;
    });
    setAlert(false);
  }

  /* ---------------------------------- */
  // handleSave

  const handleSave = async () => {

    setFormPending(true);

    // prepare team stats updates
    const allGames = readAllGames();
    const allResults = [];
    Object.entries(allGames).forEach(([gPath, gData]) => {
      const weekId = gData.weekId;
      const status = gPath === gamePath ? formMatch.status : gData.match.status;
      const results = gPath === gamePath ? formMatch.results : gData.match.results;
      Object.values(results).forEach(result => {
        const winnerId = result;
        const loserId = winnerId !== '' ? gData.match.teams.find(t => t !== winnerId) : '';
        allResults.push({ weekId, status, winnerId, loserId });
      });
    });

    // calculate All and weekId stats for each team in this game
    const teamStats = {};
    match.teams.forEach(teamId => {
      const stats = { "ALL": {}, [gameWeekId]: {} };
      Object.keys(stats).forEach(stat => {
        const res = stat === 'ALL' ? allResults : allResults.filter(r => r.weekId === stat);
        const wins = res.filter(r => r.winnerId === teamId).length;
        const losses = res.filter(r => r.loserId === teamId).length;
        const record = `${wins}-${losses}`;
        const count = wins + losses;
        stats[stat] = { count, wins, losses, record };
      });
      teamStats[teamId] = stats;
    });

    // add updates to batch
    const updates = {};
    updates[gamePath + '/match/status'] = formMatch.status;
    updates[gamePath + '/match/results'] = formMatch.results;
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      Object.entries(stats).forEach(([weekId, data]) => {
        updates[refs.stats('games', weekId, teamId)] = data;
      });
    });

    console.log('updates:', updates);
    update(ref(db), updates);
  }

  /* ---------------------------------- */

  const itemClass = ['game-item'];
  itemClass.push(form ? 'form' : 'view');
  itemClass.push(getLiveMatch().status.toLowerCase());
  if (formPending) itemClass.push('pending');

  return (
    <div className={itemClass.join(' ')}>
      <div className="hstack gap-2-alt align-items-start">
        <div className="vstack overflow-hidden">
          {match && match.teams.map(teamId => (
            <div key={teamId} className="main-row team-row">
              <div className="hstack justify-content-between gap-1">
                <TeamLabel team={getTeam(teamId)} withRecord />
                <div className="hstack gap-1">
                  <TeamMatchItem match={getLiveMatch()} resultId="G1" teamId={teamId} disabled={matchItemsDisabled} onChange={newMatch => setFormMatch(newMatch)} />
                  <div className="match-separator vr"></div>
                  <TeamMatchItem match={getLiveMatch()} resultId="G2" teamId={teamId} disabled={matchItemsDisabled} onChange={newMatch => setFormMatch(newMatch)} />
                </div>
              </div>
            </div>
          ))}
          <CollapseDiv in={form} className="form-row">
            <div className="hstack justify-content-between">
              <div className="vstack quick-actions">
                <ButtonInline text="CANCEL" className="cancel-match-btn" onClick={() => cancelFormMatch()} disabled={matchItemsDisabled || formMatch.status == 'CNCL'} />
              </div>
              <div className="hstack gap-1">
                <div className="match-header"><span>G1</span></div>
                <div className="match-separator vr"></div>
                <div className="match-header"><span>G2</span></div>
              </div>
            </div>
          </CollapseDiv>
          <CollapseDiv in={alert} className="alert-row">
            <Alert variant="danger" className="hstack gap-1 py-1 px-2 m-0 mt-2">
              <i className="bi bi-exclamation-triangle"></i>
              <span>Game updated</span>
            </Alert>
          </CollapseDiv>
        </div>
        <div className="status-bar vr"></div>
        <div className={`vstack flex-fit ps-1 ${readOnly ? 'pe-2' : ''}`}>
          <div className="hstack gap-2-alt">
            <div className="vstack">
              <div className="game-time">{game.time}</div>
              <div className="game-court">Court {game.court}</div>
            </div>
            <div className="vstack justify-content-start">
              <IconButton className={form ? 'form-btn form-btn-close' : 'form-btn form-btn-open'} icon={form ? 'bi-x-lg' : 'bi-three-dots'} onClick={() => toggleForm()} hide={readOnly} />
            </div>
          </div>
          <div className="mt-auto">
            <CollapseDiv in={form && !saveDisabled}>
              <button className={`btn w-100 btn-primary`} onClick={() => handleSave()} disabled={saveDisabled}>
                Submit
              </button>
            </CollapseDiv>
          </div>
        </div>

      </div>
    </div>
  );

}

/* ---------------------------------- */
// CollapseDiv
// wraps contents to ensure first child doesn't have display flex (causes issues with collapse)

function CollapseDiv({ children, ...props }) {
  return (
    <Collapse {...props}>
      <div>
        {children}
      </div>
    </Collapse>
  );
}

/* ---------------------------------- */
// TeamMatchItem

function TeamMatchItem({ match, resultId, teamId, disabled = false, onChange }) {

  if (!match) return <CheckboxButton className="match-item result" checked={false} disabled={true} />;
  const result = match.results[resultId];

  return (
    <CheckboxButton
      className="match-item result"
      checked={result == teamId}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        const newMatch = copy(match);
        newMatch.results[resultId] = (result == teamId) ? '' : teamId;
        newMatch.status = Object.values(newMatch.results).every(r => r === '') ? 'PRE' : 'POST';
        onChange(newMatch);
      }}
    />
  )
}

/* ---------------------------------- */
// helpers

function copy(object) {
  return JSON.parse(JSON.stringify(object));
}

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) == JSON.stringify(obj2);
}
