/* ---------------------------------- */
// Home

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSession } from '../contexts/SessionContext';

/* ---------------------------------- */
// memoize props shortcut
// arg is an array of props, each of which is either a value/object or a function
// use useMemo and useCallback accordingly



/* ---------------------------------- */

export default function Home() {

  return (
    <div className="section">
      <div className="main-header mb-3 mt-1 hidden">

      </div>
      <div className="main-body">
        <LeagueSelect />
      </div>
    </div>
  );
}

/* ---------------------------------- */
// league select (memoized)

function LeagueSelect() {

  const createRadioMenuOption = (league) => {
    const main = league.title.split(' ')[0] + ' Night';
    const sub = league.title.split(' ').slice(2).join(' ');
    return (
      <div className="d-flex justify-content-between align-items-center column-gap-2">
        <span>{main}</span>
        <span className="sub-main">{sub}</span>
      </div>
    );
  }

  const { session, setLeague } = useSession();
  const options = useMemo(() => {
    const leagues = Object.values(session.leagues);
    leagues.sort((a, b) => {
      if (a.season != b.season) return a.season - b.season;
      if (a.session != b.session) return a.session - b.session;
      if (a.league == b.league) return 0;
      let days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      return days.indexOf(a.league) - days.indexOf(b.league);
    });
    return leagues;
  });

  return (
    <div id="league-select-container">
      <ContCard title="SELECT LEAGUE">
        <RadioMenu onChange={handleChange} options={options} value={value} />
      </ContCard>
    </div>
  );
}






/* ---------------------------------- */
// ALL CODE BELOW THIS LINE IS OLD, VANILLA JS CODE AND WILL NOT BE USED IN REACT APP
// IT IS INCLUDED FOR REFERENCE ONLY TO FACILITATE TRANSITION TO REACT
// SCRIPT CONTENTS ABOVE THIS LINE IS REACT VERSION OF THE SAME FUNCTIONALITY AND WILL BE USED IN REACT APP
/* ---------------------------------- */

// /* ------------------------------------------------ */
// // home section in index.html

// <section id="index-section" class="d-none">
//   <div class="main-header mb-3 mt-1 hidden">

//   </div>
//   <div class="main-body">
//     <div id="league-select-container"></div>
//     <div id="admin-container"></div>
//     <div id="team-select-container"></div>
//   </div>
// </section>

// /* ------------------------------------------------ */
// // home.js (FULL FILE, NOT ALL MAY BE RELEVANT/USED)

// import { db, auth, session } from './firebase.js';

// import { createElement } from './util.js';
// import {
//   ContCard,
//   MenuItem,
//   RadioMenu,
//   TeamLabel
// } from './components/common.js';

// import App from './app.js';

// /* ------------------------------------------------ */

// const section = document.querySelector('#index-section');
// const mainHeader = section.querySelector('.main-header');
// const mainBody = section.querySelector('.main-body');

// const leagueSelectContainer = mainBody.querySelector('#league-select-container');
// const adminContainer = mainBody.querySelector('#admin-container');
// const teamSelectContainer = mainBody.querySelector('#team-select-container');

// /* ------------------------------------------------ */

// export default class Home {

//   static navLink = document.querySelector('#nav-index');

//   static init() {

//     this.reset();
//     this.addLeagueSelectContent();
//     this.addAdminContent();
//     this.addMyTeamContent();
//   }

//   static show() {
//     section.classList.remove('d-none');
//   }

//   static hide() {
//     section.classList.add('d-none');
//   }

//   static handleOptionsChange() {

//     // nothing

//   }

//   /* ------------------------------------------------ */
//   // private methods

//   static reset() {
//     leagueSelectContainer.innerHTML = '';
//     adminContainer.innerHTML = '';
//     teamSelectContainer.innerHTML = '';
//   }

//   /* ------------------------------------------------ */
//   // league select content

//   static addLeagueSelectContent() {

//     const card = new ContCard('SELECT LEAGUE');
//     leagueSelectContainer.appendChild(card);

//     const leagues = Object.values(session.leagues);
//     leagues.sort((a, b) => {
//       if (a.season != b.season) return a.season - b.season;
//       if (a.session != b.session) return a.session - b.session;
//       if (a.league == b.league) return 0;
//       let days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
//       return days.indexOf(a.league) - days.indexOf(b.league);
//     });

//     const userLeague = session.getLeague();
//     const radioMenu = new RadioMenu(false);
//     leagues.forEach(league => {
//       const main = league.title.split(' ')[0] + ' Night';
//       const sub = league.title.split(' ').slice(2).join(' ');
//       const title = createElement(`
//         <div class="d-flex justify-content-between align-items-center column-gap-2">
//           <span>${main}</span>
//           <span class="sub-main">${sub}</span>
//         </div>
//       `);
//       radioMenu.addOption(title, league.id, league.id == userLeague.id);
//     });

//     radioMenu.addEventListener('change', async (e) => {
//       const leagueId = radioMenu.getValue();
//       await App.setLeague(leagueId);
//     });

//     card.addContent(radioMenu);
//   }

//   /* ------------------------------------------------ */
//   // admin content

//   static addAdminContent() {

//     const card = new ContCard('ADMIN ACCESS');
//     adminContainer.appendChild(card);

//     const passwordInput = createElement('<input type="password" placeholder="Enter password...">');
//     const passwordMessage = createElement('<span class="d-none invalid-msg">Incorrect password</span>');
//     const signInSpinner = createElement('<div class="spinner-border spinner-border-sm d-none"></div>');
//     const loginButton = createElement('<div role="button"><i class="fa-regular fa-circle-right"></i></div>');
//     const logoutButton = createElement('<div role="button"><span>Logout</span></div>');
//     const adminSwitch = createElement(`
//       <div class="form-check form-switch">
//         <input class="form-check-input" type="checkbox" id="admin-switch" role="switch" ${session.adminControls ? 'checked' : ''}>
//       </div>
//     `);

//     const loginDiv = new MenuItem()
//       .addClass('login-form')
//       .addMain(passwordInput)
//       .addTrail(loginButton)
//       .addTrail(signInSpinner);

//     const loggedInDiv = new MenuItem()
//       .addClass('logged-in-form')
//       .addMain('Enable Controls')
//       .addTrail(adminSwitch);

//     const logoutDiv = new MenuItem()
//       .addClass('logout-form')
//       .addMain(logoutButton);


//     if (session.admin) {
//       card.addContent(loggedInDiv);
//       card.addContent(logoutDiv);
//       card.addFooter('Enable controls to edit game results and team stats.');
//     } else {
//       card.addContent(loginDiv);
//       card.addFooter(passwordMessage);
//     }

//     loginButton.addEventListener('click', async () => {
//       loginButton.classList.add('d-none');
//       signInSpinner.classList.remove('d-none');
//       const password = passwordInput.value;
//       await App.signIn(password)
//         .then(user => {
//           adminContainer.innerHTML = '';
//           this.addAdminContent();
//         })
//         .catch(error => {
//           passwordMessage.classList.remove('d-none');
//           console.log('Sign in failed:', error);
//           loginButton.classList.remove('d-none');
//           signInSpinner.classList.add('d-none');
//           passwordInput.value = '';
//         });
//     });

//     logoutButton.addEventListener('click', async () => {
//       await App.signOut();
//       adminContainer.innerHTML = '';
//       this.addAdminContent();
//     });

//     adminSwitch.querySelector('input').addEventListener('change', (e) => {
//       const value = e.target.checked;
//       App.setAdminControls(value);
//     });
//   }

//   /* ------------------------------------------------ */
//   // my team content

//   static addMyTeamContent() {

//     const card = new ContCard('MY TEAM');
//     teamSelectContainer.appendChild(card);

//     const teams = Object.values(session.teams);
//     const radioMenu = new RadioMenu(true);
//     teams.forEach(team => {
//       const title = new TeamLabel(team);
//       radioMenu.addOption(title, team.id, team.name == session.favTeam);
//     });

//     radioMenu.addEventListener('change', (e) => {
//       const teamId = radioMenu.getValue();
//       const favTeam = teamId ? teams.find(t => t.id == teamId).name : null;
//       App.setFavTeam(favTeam);
//     });

//     card.addContent(radioMenu);
//   }
// }

// /* ------------------------------------------------ */
// // common.js (FULL FILE, NOT ALL MAY BE RELEVANT/USED)

// import { createElement } from "../util.js";
// import { session } from "../firebase.js";

// /* ------------------------------------------------ */
// // helpers

// function stdInput(input) {

//   let content = input;

//   if (typeof input === 'string') {

//     if (input.includes('<')) {
//       const div = document.createElement('div');
//       div.innerHTML = input;
//       content = div.firstChild;
//     } else {
//       content = document.createElement('span');
//       content.textContent = input;
//     }
//   }

//   return content;
// }

// /* ------------------------------------------------ */
// // cont card

// export class ContCard extends HTMLElement {

//   constructor(title, body) {
//     super();
//     this.title = title || '';
//     this.body = body || '';
//     this.render();
//   }

//   render() {
//     this.classList.add('cont-card');
//     this.innerHTML = `
//       <div class="cont-card-title"></div>
//       <div class="cont-card-body"></div>
//       <div class="cont-card-footer"></div>
//     `;

//     if (this.title !== '') this.addTitle(this.title);
//     if (this.body !== '') this.addContent(this.body);

//     return this;
//   }

//   addTitle(title) {
//     const div = this.querySelector('.cont-card-title');
//     const content = stdInput(title);
//     div.appendChild(content);
//     return this;
//   }

//   addContent(content) {
//     const div = this.querySelector('.cont-card-body');
//     const item = stdInput(content);
//     div.appendChild(item);
//     return this;
//   }

//   addFooter(footer) {
//     const div = this.querySelector('.cont-card-footer');
//     const content = stdInput(footer);
//     div.appendChild(content);
//     return this;
//   }
// }

// // define the custom element
// customElements.define('cont-card', ContCard);

// /* ------------------------------------------------ */
// // menu item

// export class MenuItem extends HTMLElement {

//   constructor() {
//     super();
//     this.render();
//   }

//   // method for rendering the component
//   render() {
//     this.classList.add('menu-item');
//     this.innerHTML = `
//       <div class="label"></div>
//       <div class="contents">
//         <div class="main"></div>
//         <div class="info"></div>
//         <div class="trail"></div>
//       </div>
//     `;

//     return this;
//   }

//   addClass(classStr) {
//     if (classStr.includes(' ')) {
//       const classes = classStr.split(' ');
//       classes.forEach(cls => {
//         this.classList.add(cls);
//       });
//     } else {
//       this.classList.add(classStr);
//     }
//     return this;
//   }

//   addDataset(key, value) {
//     this.dataset[key] = value;
//     return this;
//   }

//   // enable nav
//   enableNav() {
//     const drill = document.createElement('div');
//     drill.classList.add('drill');
//     drill.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

//     this.setAttribute('role', 'button');
//     this.querySelector('.trail').appendChild(drill);
//     return this;
//   }

//   // set either text or element content for label
//   addLabel(label) {
//     const div = this.querySelector('.label');
//     const content = stdInput(label);
//     div.appendChild(content);
//     return this;
//   }

//   // set either text or element content for title
//   addMain(main) {
//     const div = this.querySelector('.main');
//     const content = stdInput(main);
//     div.appendChild(content);
//     return this;
//   }

//   addSubMain(subMain) {
//     const div = this.querySelector('.main');
//     const content = stdInput(subMain);
//     content.classList.add('sub-main');
//     div.appendChild(content);
//     return this;
//   }


//   addInfo(info) {
//     const div = this.querySelector('.info');
//     const content = stdInput(info);
//     div.appendChild(content);
//     return this;
//   }

//   addTrail(trail) {
//     const div = this.querySelector('.trail');
//     const content = stdInput(trail);
//     if (div.querySelector('.drill')) {
//       div.insertBefore(content, div.querySelector('.drill'));
//     } else {
//       div.appendChild(content);
//     }
//     return this;
//   }
// }

// // define the custom element
// customElements.define('menu-item', MenuItem);

// /* ------------------------------------------------ */
// // radio menu

// export class RadioMenu extends HTMLElement {

//   constructor(selectedOnTop) {
//     super();
//     this.selectedOnTop = selectedOnTop || false;
//     this.value = null;
//     this.appendOrder = [];
//     this.checkClass = 'bi bi-check-circle-fill';
//     this.uncheckClass = 'bi bi-circle';
//     this.render();
//   }

//   render() {
//     this.classList.add('radio-menu');
//     return this;
//   }

//   addOption(title, value, checked = false) {
//     const item = new MenuItem();
//     // const check = createElement('<i class="fa-regular fa-circle"></i>');
//     const check = document.createElement('i');
//     check.className = checked ? this.checkClass : this.uncheckClass;
//     if (checked === true) {
//       this.value = value;
//       item.classList.add('selected');
//     }
//     item.addMain(title);
//     item.addTrail(check);
//     item.addDataset('value', value);
//     item.setAttribute('role', 'button');
//     item.classList.add('radio-menu-item');
//     item.addEventListener('click', () => {
//       this.selectOption(item);
//     });
//     this.appendChild(item);
//     this.appendOrder.push(value);

//     if (this.selectedOnTop === true) {
//       const items = this.querySelectorAll('.menu-item');
//       const sortedItems = Array.from(items).sort((a, b) => {
//         if (a.dataset.value == this.value) return -1;
//         if (b.dataset.value == this.value) return 1;
//         const aIndex = this.appendOrder.indexOf(a.dataset.value);
//         const bIndex = this.appendOrder.indexOf(b.dataset.value);
//         return aIndex - bIndex;
//       });
//       this.innerHTML = '';
//       sortedItems.forEach(item => {
//         this.appendChild(item);
//       });
//     }

//     return this;
//   }

//   async selectOption(item) {
//     // this.value = item.dataset.value;

//     // if item is already selected, clear value
//     const sameValue = item.dataset.value == this.value;
//     this.value = sameValue ? null : item.dataset.value;

//     await this.updateElements();
//     this.dispatchEvent(new CustomEvent('change', { detail: this.value }));

//     return this;
//   }

//   getValue() {
//     return this.value;
//   }

//   async updateElements() {
//     const items = this.querySelectorAll('.menu-item');
//     items.forEach(item => {
//       const trail = item.querySelector('.trail');
//       const check = trail.querySelector('i');
//       const isValue = item.dataset.value == this.value;
//       check.className = isValue ? this.checkClass : this.uncheckClass;
//       item.classList.toggle('selected', isValue);
//     });

//     if (this.selectedOnTop === true) {

//       // get new order
//       const sortedItems = Array.from(items).sort((a, b) => {
//         if (a.dataset.value == this.value) return -1;
//         if (b.dataset.value == this.value) return 1;
//         const aIndex = this.appendOrder.indexOf(a.dataset.value);
//         const bIndex = this.appendOrder.indexOf(b.dataset.value);
//         return aIndex - bIndex;
//       });

//       // get positions of each item
//       let positions = [];
//       items.forEach(item => {
//         positions.push(item.getBoundingClientRect().top);
//       });

//       // translate items to new positions
//       items.forEach(item => {
//         const index = sortedItems.indexOf(item);
//         const newTop = positions[index];
//         const currentTop = item.getBoundingClientRect().top;
//         const diff = newTop - currentTop;
//         item.style.transition = 'transform 0.3s ease-in-out';
//         item.style.transform = `translateY(${diff}px)`;
//       });

//       // after transition, overwrite this with items in new order
//       await new Promise(resolve => {
//         setTimeout(() => {
//           this.innerHTML = '';
//           sortedItems.forEach(item => {
//             this.appendChild(item);
//             item.style.transition = '';
//             item.style.transform = '';
//           });
//           resolve();
//         }, 300);
//       });
//     }

//     return this;
//   }
// }

// customElements.define('radio-menu', RadioMenu);

// /* ------------------------------------------------ */
// // stepper

// export class Stepper extends HTMLElement {

//   constructor(value) {
//     super();
//     this.initial = value || 0;
//     this.value = value || 0;
//     this.change = 0;
//     this.render();
//   }

//   render() {

//     this.classList.add('stepper-item');
//     this.innerHTML = `
//       <div class="stepper-count-initial d-none">${this.initial}</div>
//       <div class="stepper-count">${this.value}</div>
//       <div class="stepper-container admin-control">
//         <div class="stepper">
//           <div role="button" class="stepper-btn stepper-down">
//             <i class="fa-solid fa-minus"></i>
//           </div>
//           <div class="separator"></div>
//           <div role="button" class="stepper-btn stepper-up">
//             <i class="fa-solid fa-plus"></i>
//           </div>
//         </div>
//       </div>
//     `;

//     this.setListeners();
//     return this;
//   }

//   disableEditMode() {
//     this.querySelector('.stepper-container').classList.add('d-none');
//     return this;
//   }

//   enableEditMode() {
//     this.querySelector('.stepper-container').classList.remove('d-none');
//     return this;
//   }

//   setListeners() {
//     const btns = this.querySelectorAll('.stepper-btn');
//     btns.forEach(btn => {
//       btn.addEventListener('click', (e) => {
//         const diff = btn.classList.contains('stepper-up') ? 1 : -1;
//         if (this.value + diff < 0) return;
//         this.value += diff;
//         this.change = this.value - this.initial;
//         this.updateElements();
//         this.dispatchEvent(new CustomEvent('change', { detail: this.change }));
//       });
//     });
//   }

//   reset() {
//     this.value = this.initial;
//     this.change = 0;
//     this.updateElements();
//   }

//   resetWith(value) {
//     this.initial = value;
//     this.value = value;
//     this.change = 0;
//     this.updateElements();
//   }

//   updateElements() {
//     const anyChange = this.change != 0;
//     this.classList.toggle('changed', anyChange);
//     this.querySelector('.stepper-count').textContent = this.value;
//     this.querySelector('.stepper-count-initial').textContent = this.initial;
//     this.querySelector('.stepper-count-initial').classList.toggle('d-none', !anyChange);

//     // if !anyChange and this.value == 0, add css class to show '0' as gray
//     this.querySelector('.stepper-count').classList.toggle('zero', !anyChange && this.value == 0);
//   }
// }

// customElements.define('stepper-item', Stepper);

// /* ------------------------------------------------ */
// // button

// export class Button extends HTMLElement {

//   constructor(className, innerHTML) {
//     super();
//     this.initial = {
//       innerHTML: innerHTML || '',
//       className: 'action-button' + (className ? ' ' + className : ''),
//     };
//     this.render();
//   }

//   render() {
//     this.role = 'button';
//     this.reset();
//     return this;
//   }

//   show() {
//     this.classList.remove('d-none');
//     this.initial.className = this.className;
//     this.reset();
//     return this;
//   }

//   hide() {
//     this.classList.add('d-none');
//     this.initial.className = this.className;
//     return this;
//   }

//   // setting states
//   reset() {
//     this.innerHTML = this.initial.innerHTML;
//     this.className = this.initial.className;
//     return this;
//   }

//   enable() {
//     this.classList.remove('disabled');
//     return this;
//   }

//   disable() {
//     this.classList.add('disabled');
//     return this;
//   }

//   startSave() {
//     this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
//     this.disable();
//     return this;
//   }

//   errorSave() {
//     this.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i>';
//     return this;
//   }

//   endSave() {
//     this.innerHTML = '<i class="fa-solid fa-check"></i>';
//     return this;
//   }
// }

// customElements.define('action-button', Button);

// /* ------------------------------------------------ */
// // favTeamIcon

// export class FavTeamListener {

//   /* ------------------------------------------------ */
//   // static methods

//   static instances = [];

//   static updateAll() {
//     FavTeamListener.instances = FavTeamListener.instances.filter(instance => {
//       return document.body.contains(instance.element);
//     });
//     FavTeamListener.instances.forEach(instance => instance.update());
//   }

//   /* ------------------------------------------------ */
//   // instance methods

//   constructor(element) {
//     this.element = element;
//     this.teamNameElement = this.element.querySelector('.team-name');
//     this.anchorElement = this.teamNameElement;
//     this.update();

//     FavTeamListener.instances.push(this);
//   }

//   // custom icon location (icon will be inserted after this element)
//   setAnchor(selector) {
//     const anchor = this.element.querySelector(selector);
//     if (anchor) this.anchorElement = anchor;
//     this.update();
//   }

//   // toggle icon based on session.favTeam
//   update() {

//     const isFav = session.favTeam == this.teamNameElement.textContent;
//     const anchor = this.anchorElement;
//     const icon = createElement('<i class="fa-solid fa-user fav-team"></i>');
//     const iconOld = this.element.querySelector('i.fav-team');

//     if (iconOld) iconOld.remove();
//     if (isFav) anchor.after(icon);
//   }
// }

// document.addEventListener('session-setFavTeam', FavTeamListener.updateAll);

// /* ------------------------------------------------ */
// // teamLabel
// // often need to show team name alongside other team info (e.g., number, name), so this component is useful

// export class TeamLabel extends HTMLElement {

//   constructor(team) {
//     super();
//     this.team = team;
//     this.render();

//     this.favTeamListener = new FavTeamListener(this);
//   }

//   render() {
//     this.classList.add('team-label');
//     this.classList.add('d-flex', 'align-items-center', 'column-gap-2', 'flex-nowrap');
//     this.innerHTML = `
//       <span class="team-nbr">${this.team.nbr}</span>
//       <span class="team-name">${this.team.name}</span>
//     `;
//     return this;
//   }

//   appendRecord() {
//     const record = (this.team.stats) ? this.team.stats.games.record : this.team.record;
//     const span = createElement(`<span class="team-record">${record}</span>`);
//     this.appendChild(span);
//   }

//   setFavTeamIconAnchor(selector) {
//     this.favTeamListener.setAnchor(selector);
//   }

// }

// customElements.define('team-label', TeamLabel);


