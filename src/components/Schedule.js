/* ---------------------------------- */
// Schedule

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useAuth, useLeague, useOptions } from '../contexts/SessionContext';
import { useFirebase } from '../hooks/useFirebase';
import { get, child, ref, onValue, off, set, update } from "firebase/database";
import {
  Collapse,
  Spinner,
} from 'react-bootstrap';

import {
  ContCard,
  MenuItem,
  RadioMenuItem,
  TeamLabel,
  TeamLabelWithRecord,
  Switch,
  ButtonInline,
} from './common';
import { db } from '../firebase';

/* ---------------------------------- */

export default function Schedule() {

  const { loading, weeks } = useLeague();
  const [activeWeek, setActiveWeek] = useState(null);

  useEffect(() => {
    if (loading) return;
    const finalWeek = Object.values(weeks).pop();
    const nextWeek = Object.values(weeks).find(week => new Date(week.gameday) > new Date());
    setActiveWeek(nextWeek ? nextWeek.id : finalWeek.id);
  }, [loading, weeks]);

  return (
    <div className="section">
      <div className="main-header mb-3 mt-1">
        <WeekButtons weeks={weeks} activeWeek={activeWeek} setActiveWeek={setActiveWeek} />
      </div>
      <div className="main-body">
        <WeekGames weekId={activeWeek} />
      </div>
    </div>
  );
};

/* ---------------------------------- */
// WeekButtons

function WeekButtons({ weeks, activeWeek, setActiveWeek }) {

  const formatDate = (str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="btn-group d-flex flex-nowrap overflow-x-scroll" role="group">
      {Object.entries(weeks).map(([key, week]) => (
        <button
          key={key}
          className={`btn week-filter-btn d-flex flex-column justify-content-center align-items-center text-nowrap ${key == activeWeek ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveWeek(key)}
        >
          <span className="week-btn-label">{week.label}</span>
          <span className="week-btn-date">{formatDate(week.gameday)}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- */
// WeekGames

function WeekGames({ weekId }) {

  const { games, teams } = useLeague();

  const gamesForWeek = useMemo(() => {
    const weekGames = games[weekId];
    if (!weekGames) return;
    return Object.values(weekGames).map((game) => {
      Object.keys(game.teams).forEach((teamId) => {
        const team = teams[teamId];
        game.teams[teamId] = {
          id: teamId,
          nbr: team.nbr,
          name: team.name,
        };
      });
      return game;
    });
  }, [games, teams, weekId]);

  const gamesByTime = useMemo(() => {
    if (!gamesForWeek) return;
    return gamesForWeek.reduce((acc, game) => {
      if (!acc[game.time]) {
        acc[game.time] = [];
      }
      acc[game.time].push(game);
      return acc;
    }, {});
  }, [gamesForWeek]);

  return gamesByTime && (
    <div className="week-games">
      {Object.entries(gamesByTime).map(([time, games]) => (
        <ContCard key={time} className="game-group">
          {games.map((game, index) => (
            <React.Fragment key={game.id}>
              <GameItem game={game} />
              {index < games.length - 1 && <div className="game-separator"></div>}
            </React.Fragment>
          ))}
        </ContCard>
      ))}
    </div>
  );
}

/* ---------------------------------- */
// GameItem

function GameItem({ game }) {

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
  // need to update matches along with team records
  const handleSave = async () => {

    setPending(true);
    const updates = {};
    updates[matchesRefPath] = formMatches;

    // calculate change in team records
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
            ['overall', 'week'].forEach(key => {
              if (key == 'week' && wId != weekId) return;
              const s = stats[key];
              s.count++;
              s.wins += (m.winner == teamId) ? 1 : 0;
              s.losses += (m.winner != teamId) ? 1 : 0;
              s.record = `${s.wins}-${s.losses}`;
              s.winPct = s.wins / s.count;
            });
          });
        });
      });

      updates[`teams/${leagueId}/${teamId}/stats/games`] = stats.overall;
      updates[`stats/${leagueId}/${weekId}/${teamId}/games`] = stats.week;

    });

    console.log('updates:', updates);
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

  // if (!matches) return null;

  // console.log('Render');
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

/* ---------------------------------- */

// function ToggleIcon({
//   on = false,
//   icon = 'bi bi-circle',
//   iconOn = 'bi bi-check-circle',
//   className = '',
//   classOnModifier = 'picked',
//   onClick
// }) {

//   const iconClass = (on && iconOn) ? iconOn : icon;
//   const divClass = (on && classOnModifier) ? className + ' ' + classOnModifier : className;

//   return (
//     <div className={divClass} {...(onClick && { onClick })}>
//       <i className={iconClass}></i>
//     </div>
//   );

// }






/* ---------------------------------- */
// OLD CODE

// function createWeekCarouselItem(week) {

//   const item = createElement(`<div class="carousel-item week-group" id="week-${week.id}-group" data-week="${week.id}"></div>`);
//   const games = Object.values(session.games[week.id]);
//   const times = games.map(g => g.time).filter((v, i, a) => a.indexOf(v) === i);

//   times.forEach(time => {

//     const card = new ContCard();
//     card.classList.add('game-group');

//     const timeGames = games.filter(g => g.time == time);
//     timeGames.forEach((game, index) => {
//       const gameItem = new GameItem(game);
//       const separator = createElement(`<div class="game-separator"></div>`);
//       card.addContent(gameItem);
//       if (index < timeGames.length - 1) {
//         card.addContent(separator);
//       }
//     });

//     item.appendChild(card);
//   });

//   return item;
// }

/* ------------------------------------------------ */
// game item

// export class GameItem extends HTMLElement {

//   constructor(data) {
//     super();
//     this.data = data;
//     this.form = false;

//     // look up team data
//     this.teamIds = Object.keys(this.data.teams);
//     this.teamIds.forEach(teamId => {
//       let team = session.teams[teamId];
//       this.data.teams[teamId] = {
//         nbr: team.nbr,
//         name: team.name,
//         record: team.stats.games.record,
//       };
//     });

//     this.render();
//   }

//   /* ----- helpers ----- */

//   getButton() {
//     return this.querySelector('.stat-col [role="button"]');
//   }

//   getTeamItem(teamId) {
//     return this.querySelector('.team-item[data-team_id="' + teamId + '"]');
//   }

//   getMatchItem(matchId, teamId) {
//     return this.querySelector('.match-item[data-match_id="' + matchId + '"][data-team_id="' + teamId + '"]');
//   }

//   getMatchItems(matchId) {
//     return this.querySelectorAll('.match-item[data-match_id="' + matchId + '"]');
//   }

//   getGameStatus() {
//     const matchIds = Object.keys(this.data.matches);
//     const statuses = matchIds.map(matchId => this.data.matches[matchId].status);
//     let gameStatus = 'PRE';
//     if (statuses.includes('POST')) gameStatus = 'IN';
//     if (!statuses.includes('PRE')) gameStatus = 'POST';
//     return gameStatus;
//   }

//   /* ----- handlers ----- */

//   enableEditMode() {
//     this.querySelector('.stat-col').classList.replace('col-3', 'col-4');
//     this.querySelector('.main-col').classList.replace('col-9', 'col-8');
//     this.getButton().classList.remove('d-none');

//     return this;
//   }

//   disableEditMode() {
//     this.querySelector('.stat-col').classList.replace('col-4', 'col-3');
//     this.querySelector('.main-col').classList.replace('col-8', 'col-9');
//     this.getButton().classList.add('d-none');

//     return this;
//   }

//   handleAdminChange() {
//     if (session.adminControls) {
//       this.enableEditMode();
//     } else {
//       this.disableEditMode();
//     }
//   }

//   /* ----- alert handling ----- */

//   showAlert(type, message) {

//     const alert = createAlert(type, message);
//     alert.querySelector('.btn-close').remove();
//     this.querySelector('.alert-col').innerHTML = '';
//     this.querySelector('.alert-col').appendChild(alert);

//     return this;
//   }

//   hideAlert() {

//     if (this.querySelector('.alert')) {
//       this.querySelector('.alert').remove();
//     }

//     return this;
//   }

//   /* ----- form toggling ----- */

//   toggleForm() {

//     this.form = !this.form;
//     this.classList.toggle('game-item-form', this.form);

//     // button
//     const btnIcon = this.getButton().querySelector('.edit-icon');
//     btnIcon.classList.toggle('fa-pen', !this.form);
//     btnIcon.classList.toggle('fa-xmark', this.form);

//     // match item selections
//     if (this.form) {
//       this.newMatches = JSON.parse(JSON.stringify(this.data.matches));
//       this.setSaveButton();
//     } else {
//       this.newMatches = null;
//       this.setMatchItemElements();
//       this.setSaveButton();
//     }

//     // show/hide form elements
//     this.hideAlert();
//     // this.querySelectorAll('.match-item.cancel').forEach(matchItem => {
//     //   matchItem.classList.toggle('d-none', !this.form);
//     // });

//     // form footer
//     const formFooter = this.querySelector('.form-footer');
//     if (this.form) {
//       bootstrap.Collapse.getOrCreateInstance(formFooter).show();
//     } else {
//       formFooter.classList.remove('show');
//     }

//     return this;
//   }

//   /* ----- handle match item clicks ----- */

//   handleMatchItemClick(matchItem) {

//     const matchId = matchItem.dataset.match_id;
//     const teamId = matchItem.dataset.team_id;
//     const match = this.newMatches[matchId];

//     // handle cancel match click
//     if (matchItem.classList.contains('cancel')) {
//       if (match.status == 'CNCL') {
//         match.status = 'PRE';
//       } else {
//         match.status = 'CNCL';
//         delete match.winner;
//       }

//     } else {
//       const isWinner = (match.winner) ? match.winner == teamId : false;
//       if (isWinner) {
//         delete match.winner;
//         match.status = 'PRE';
//       } else {
//         match.winner = teamId;
//         match.status = 'POST';
//       }
//     }

//     this.hideAlert();
//     this.setMatchItemElements();
//     this.setSaveButton();

//     console.log('newMatches:', this.newMatches);
//   }

//   /* ----- enable/disable save button ----- */

//   setSaveButton() {

//     const btn = this.querySelector('.form-footer button');
//     let changed = false;
//     if (this.newMatches) {
//       if (JSON.stringify(this.data.matches) != JSON.stringify(this.newMatches)) {
//         changed = true;
//       }
//     }

//     btn.disabled = (changed) ? false : true;
//   }

//   /* ----- set/update elements ----- */

//   setTeamItemElements() {

//     const teamIds = Object.keys(this.data.teams);
//     teamIds.forEach(teamId => {
//       const team = this.data.teams[teamId];
//       const teamItem = this.getTeamItem(teamId);
//       teamItem.querySelector('.team-nbr').textContent = team.nbr;
//       teamItem.querySelector('.team-name').textContent = team.name;
//       teamItem.querySelector('.team-record').textContent = team.record;
//     });
//   }

//   setMatchItemElements() {

//     const matchIds = Object.keys(this.data.matches);
//     matchIds.forEach(matchId => {

//       const match = (this.newMatches) ? this.newMatches[matchId] : this.data.matches[matchId];
//       const matchCol = this.querySelector(`.match-col[data-match_id="${matchId}"]`);
//       const matchItems = this.getMatchItems(matchId);

//       matchCol.classList.toggle('post', match.status != 'PRE');
//       matchCol.classList.toggle('cancelled', match.status == 'CNCL');

//       matchItems.forEach(matchItem => {

//         if (matchItem.classList.contains('cancel')) {
//           matchItem.classList.toggle('picked', match.status == 'CNCL');
//           return;
//         }

//         const teamId = matchItem.dataset.team_id;
//         const isWinner = (match.winner) ? match.winner == teamId : false;
//         const icon = matchItem.querySelector('i');
//         icon.classList.toggle('bi-check-circle', isWinner);
//         icon.classList.toggle('bi-circle', !isWinner);
//       });

//     });
//   }

//   /* ----- render the component ----- */

//   render() {

//     const teamIds = Object.keys(this.data.teams);
//     const matchIds = Object.keys(this.data.matches);

//     const matchItem = (matchIdx, teamIdx) => {
//       return `
//         <div role="button" class="match-item result" data-match_id="${matchIds[matchIdx]}" data-team_id="${teamIds[teamIdx]}">
//           <i class="bi bi-circle"></i>
//         </div>
//       `;
//     };

//     const cancelMatchItem = (matchIdx) => {
//       return `
//         <div role="button" class="match-item cancel" data-match_id="${matchIds[matchIdx]}">
//           <i class="bi bi-x-circle"></i>
//         </div>
//       `;
//     };

//     const matchCancelledOverlay = `
//       <div class="cancelled-overlay">
//         <i class="bi bi-slash-circle"></i>
//       </div>
//     `;

//     this.id = 'game-' + this.data.id;
//     this.dataset.game_id = this.data.id;
//     this.classList.add('game-item');

//     this.innerHTML = `
//       <div class="row g-0">
//         <div class="main-col col-8">
//           <div class="team-col">
            
//           </div>
//           <div class="matches-col">
//             <div class="match-col" data-match_id="${matchIds[0]}">
//               ${matchItem(0, 0)}
//               ${matchItem(0, 1)}
//               ${cancelMatchItem(0)}
//             </div>
//             <div class="match-col" data-match_id="${matchIds[1]}">
//               ${matchItem(1, 0)}
//               ${matchItem(1, 1)}
//               ${cancelMatchItem(1)}
//             </div>
//           </div>
//         </div>
//         <div class="stat-col col-4">
//           <div class="info-col">
//             <div class="game-time"></div>
//             <div class="game-court"></div>
//           </div>
//           <div class="edit-col">
//             <div class="edit-icon-circle admin-control" role="button">
//               <i class="fa-solid fa-pen edit-icon"></i>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div class="form-footer collapse row g-0">
//         <div class="alert-col col-8"></div>
//         <div class="save-col col-4">
//           <button class="btn w-100 btn-primary" disabled>Submit</button>
//         </div>
//       </div>
//     `;

//     // add team items
//     this.teamIds.forEach((teamId, teamIdx) => {
//       const team = this.data.teams[teamId];
//       const item = new TeamLabel(team);
//       item.classList.add('team-item', 'team-item-' + (teamIdx + 1));
//       item.dataset.team_id = teamId;
//       item.appendRecord();
//       item.setFavTeamIconAnchor('.team-record');
//       this.querySelector('.team-col').appendChild(item);
//     });

//     // populate game info
//     this.querySelector('.game-time').textContent = this.data.time;
//     this.querySelector('.game-court').textContent = 'Court ' + this.data.court;

//     // populate match items
//     this.setMatchItemElements();

//     // set event listeners
//     const btn = this.getButton();
//     btn.addEventListener('click', (e) => {
//       this.toggleForm();
//     });

//     const matchItems = this.querySelectorAll('.match-item');
//     matchItems.forEach(matchItem => {
//       matchItem.addEventListener('click', (e) => {
//         if (this.form) this.handleMatchItemClick(matchItem);
//       });
//     });

//     const saveBtn = this.querySelector('.form-footer button');
//     saveBtn.addEventListener('click', async (e) => {
//       e.preventDefault();
//       this.classList.add('pending');
//       await this.pushMatchUpdates();
//     });

//     // set admin controls
//     if (!session.adminControls) this.disableEditMode();

//     return this;
//   }

//   /* ----- push match updates ----- */

//   async pushMatchUpdates() {

//     const gameId = this.data.id;
//     const weekId = this.data.week;
//     const refs = session.getLeague().refs;
//     const allGames = await session.getOnce(refs.games);
//     const weeks = Object.keys(allGames);
//     const teams = Object.keys(this.data.teams);

//     // update game matches
//     const updates = {};
//     updates[`${refs.games}/${weekId}/${gameId}/matches`] = this.newMatches;

//     // update weekly and overall team stats
//     teams.forEach(teamId => {

//       // init stats
//       const stats = {};
//       stats.overall = { count: 0, wins: 0, losses: 0, record: '0-0', winPct: 0 };
//       weeks.forEach(week => {
//         stats[week] = { count: 0, wins: 0, losses: 0, record: '0-0', winPct: 0 };
//       });

//       // update stats
//       weeks.forEach(week => {

//         const teamGames = Object.values(allGames[week]).filter(game => game.teams[teamId]);
//         teamGames.forEach(game => {

//           const matchesPost = (game.id == gameId)
//             ? Object.values(this.newMatches).filter(match => match.status == 'POST')
//             : Object.values(game.matches).filter(match => match.status == 'POST');

//           matchesPost.forEach(match => {
//             ['overall', week].forEach(key => {
//               const s = stats[key];
//               s.count++;
//               s.wins += (match.winner == teamId) ? 1 : 0;
//               s.losses += (match.winner != teamId) ? 1 : 0;
//               s.record = s.wins + '-' + s.losses;
//               s.winPct = s.wins / s.count;
//             });
//           });
//         });
//       });

//       // append stats to updates
//       updates[`${refs.teams}/${teamId}/stats/games`] = stats.overall;
//       updates[`${refs.stats}/${weekId}/${teamId}/games`] = stats[weekId];
//     });

//     // push updates
//     console.log('updates:', updates);
//     await session.update(updates);
//   }


//   /* ----- handle game data updates ----- */

//   updateTeamRecord(teamId, record) {

//     if (!this.data.teams[teamId]) return this;
//     this.data.teams[teamId].record = record;
//     this.setTeamItemElements();
//   }

//   /* ----- handle match data updates ----- */

//   updateMatchResults(newMatches) {

//     this.data.matches = newMatches;

//     const pending = this.classList.contains('pending');
//     const form = this.form;
//     const state = (!form) ? 'formClosed' : (pending) ? 'formOpenUserChange' : 'formOpenDiffUserChange';

//     if (state == 'formClosed') {
//       this.setMatchItemElements();
//     }

//     if (state == 'formOpenUserChange') {
//       this.classList.remove('pending');
//       this.toggleForm();
//       this.setMatchItemElements();
//       this.setSaveButton();
//     }

//     if (state == 'formOpenDiffUserChange') {
//       this.newMatches = JSON.parse(JSON.stringify(newMatches));
//       this.setMatchItemElements();
//       this.setSaveButton();
//       this.showAlert('danger', 'Game updated by another user.');
//     }
//   }

// }

// customElements.define('game-item', GameItem);


