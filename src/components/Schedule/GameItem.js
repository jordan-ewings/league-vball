import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useAuth, useLeague, useOptions } from '../../contexts/SessionContext';
import { useFirebase } from '../../hooks/useFirebase';
import { get, child, ref, onValue, off, set, update, runTransaction } from "firebase/database";
import {
  Collapse,
} from 'react-bootstrap';

import {
  TeamLabel,
} from '../common';
import { db } from '../../firebase';

/* ---------------------------------- */

export default function GameItem({ game }) {

  const { leagueId } = useLeague();
  const { controls } = useAuth();

  const [teams, setTeams] = useState(game.teams);
  const [formMatches, setFormMatches] = useState(null);
  const [form, setForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState(null);

  const teamIds = useMemo(() => Object.keys(game.teams), [game.teams]);
  const matchIds = useMemo(() => Object.keys(game.matches), [game.matches]);
  const weekId = useMemo(() => game.week, [game.week]);
  const gameId = useMemo(() => game.id, [game.id]);

  /* ---------------------------------- */
  // matches listener

  const matchesRefPath = `games/${leagueId}/${weekId}/${gameId}/matches`;
  const matches = useFirebase(matchesRefPath);

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
    if (matches) {
      handleMatchUpdates();
    }
  }, [matches]);

  /* ---------------------------------- */
  // interaction handlers

  // match item click
  const handleMatchItemClick = (matchId, teamId) => {
    if (!form) return;
    const newMatches = JSON.parse(JSON.stringify(formMatches));
    const match = newMatches[matchId];
    if (!teamId) {
      if (match.status == 'CNCL') {
        match.status = 'PRE';
      } else {
        match.status = 'CNCL';
        delete match.winner;
      }
    } else {
      if (match.winner && match.winner == teamId) {
        delete match.winner;
        match.status = 'PRE';
      } else {
        match.winner = teamId;
        match.status = 'POST';
      }
    }

    setFormMatches(newMatches);
    setAlert(null);
    console.log('newMatches:', newMatches);
  }

  // edit button click
  const toggleForm = () => {
    if (form) {
      setForm(false);
      setFormMatches(null);
    } else {
      console.log('matches:', matches);
      setForm(true);
      setFormMatches(JSON.parse(JSON.stringify(matches)));
    }

    setAlert(null);
  }

  // save button click - actual version
  const handleSave = async () => {

    setPending(true);
    const updates = {};
    updates[matchesRefPath] = formMatches;

    let updateRecords = false;
    matchIds.forEach(matchId => {
      const match = matches[matchId];
      const formMatch = formMatches[matchId];
      if (match.status == 'POST' || formMatch.status == 'POST') {
        if (match.status != formMatch.status) {
          updateRecords = true;
        } else {
          if (match.winner != formMatch.winner) {
            updateRecords = true;
          }
        }
      }
    });

    if (updateRecords) {
      const allGames = await get(child(ref(db), `games/${leagueId}`)).then(s => s.val());
      teamIds.forEach(teamId => {
        const stats = {
          overall: { count: 0, wins: 0, losses: 0, record: '0-0', winPct: 0 },
          week: { count: 0, wins: 0, losses: 0, record: '0-0', winPct: 0 },
        };

        Object.keys(allGames).forEach(wId => {
          Object.values(allGames[wId]).forEach(g => {
            if (!g.teams[teamId]) return;

            const matchesPost = (g.id == gameId)
              ? Object.values(formMatches).filter(m => m.status == 'POST')
              : Object.values(g.matches).filter(m => m.status == 'POST');

            matchesPost.forEach(m => {
              const pushKeys = ['overall'];
              if (wId == weekId) pushKeys.push('week');
              pushKeys.forEach(key => {
                stats[key].count++;
                stats[key].wins += (m.winner == teamId) ? 1 : 0;
                stats[key].losses += (m.winner != teamId) ? 1 : 0;
                stats[key].record = `${stats[key].wins}-${stats[key].losses}`;
                stats[key].winPct = stats[key].wins / stats[key].count;
              });
            });
          });
        });

        updates[`teams/${leagueId}/${teamId}/stats/games`] = stats.overall;
        updates[`stats/${leagueId}/${weekId}/${teamId}/games`] = stats.week;

      });
    }

    console.log('updates:', updates);
    await update(ref(db), updates);
  }

  // new handle save (more efficient)
  const handleSave2 = async () => {

    setPending(true);
    const updates = {};
    updates[matchesRefPath] = formMatches;

    const getCount = (mObj) => Object.values(mObj).filter(m => m.status == 'POST').length;
    const getWins = (mObj, teamId) => Object.values(mObj).filter(m => m.status == 'POST' && m.winner == teamId).length;
    const getLosses = (mObj, teamId) => Object.values(mObj).filter(m => m.status == 'POST' && m.winner != teamId).length;

    teamIds.forEach(teamId => {

      const teamsPath = `teams/${leagueId}/${teamId}/stats/games`;
      const statsPath = `stats/${leagueId}/${weekId}/${teamId}/games`;

      [teamsPath, statsPath].forEach(path => {
        runTransaction(ref(db, path), (stats) => {
          if (stats) {
            stats.count = stats.count + (getCount(formMatches) - getCount(matches));
            stats.wins = stats.wins + (getWins(formMatches, teamId) - getWins(matches, teamId));
            stats.losses = stats.losses + (getLosses(formMatches, teamId) - getLosses(matches, teamId));
            stats.record = `${stats.wins}-${stats.losses}`;
            stats.winPct = stats.wins / stats.count;
          }
          return stats;
        });
      });

    });

    await update(ref(db), updates);
  }

  /* ---------------------------------- */
  // render functions

  // add on click if form
  const renderTeamMatchItem = (matchId, teamId) => {
    const match = (formMatches) ? formMatches[matchId] : (matches) ? matches[matchId] : null;
    const isWinner = (match && match.winner) ? match.winner == teamId : false;
    return (
      <div className="match-item result" onClick={() => handleMatchItemClick(matchId, teamId)}>
        <i className={`bi ${isWinner ? 'bi-check-circle' : 'bi-circle'}`}></i>
      </div>
    );
  };

  const renderCancelMatchItem = (matchId) => {
    const match = (formMatches) ? formMatches[matchId] : (matches) ? matches[matchId] : null;
    const isCancelled = (match && match.status) ? match.status == 'CNCL' : false;
    return (
      <div className={`match-item cancel ${isCancelled ? 'picked' : ''}`} onClick={() => handleMatchItemClick(matchId)}>
        <i className="bi bi-x-circle"></i>
      </div>
    );
  };

  /* ---------------------------------- */
  // return

  return (
    <div className={`game-item ${form ? 'game-item-form' : ''}`}>
      <div className="row g-0">
        <div className={`main-col ${controls ? 'col-8' : 'col-9'} `}>
          <div className="team-col">
            <TeamLabel team={teams[teamIds[0]]} withRecord />
            <TeamLabel team={teams[teamIds[1]]} withRecord />
          </div>
          <div className="matches-col">
            {matchIds.map(matchId => (
              <div key={matchId} className="match-col">
                {renderTeamMatchItem(matchId, teamIds[0])}
                {renderTeamMatchItem(matchId, teamIds[1])}
                {renderCancelMatchItem(matchId)}
              </div>
            ))}
          </div>
        </div>
        <div className={`stat-col ${controls ? 'col-4' : 'col-3'}`}>
          <div className="info-col">
            <div className="game-time">{game.time}</div>
            <div className="game-court">Court {game.court}</div>
          </div>
          <div className="edit-col">
            <div
              className={`edit-icon-circle admin-control ${controls ? '' : 'd-none'}`}
              role="button"
              onClick={toggleForm}>
              <i className={`fa-solid ${form ? 'fa-xmark' : 'fa-pen'} edit-icon`}></i>
            </div>
          </div>
        </div>
      </div>
      <Collapse in={form}>
        <div className="form-footer row g-0">
          <div className="alert-col col-8">{alert}</div>
          <div className="save-col col-4">
            <button
              className="btn w-100 btn-primary"
              disabled={!form || JSON.stringify(matches) == JSON.stringify(formMatches)}
              onClick={handleSave}
            >Submit</button>
          </div>
        </div>
      </Collapse>
    </div>
  )
}
