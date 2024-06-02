// In the vanilla js version of this app, i defined a custom element representing a commonly used 'card' throughout the site
// here's the code for that:
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

// now, create a similar component in react

/* ---------------------------------- */
// ContCard

import React, { useState, useEffect } from 'react';

/* ---------------------------------- */

export function ContCard({ children, title, footer }) {

  return (
    <div className="cont-card">
      <div className="cont-card-title">{title && <span>{title}</span>}</div>
      <div className="cont-card-body">{children}</div>
      <div className="cont-card-footer">{footer && <span>{footer}</span>}</div>
    </div>
  );

}