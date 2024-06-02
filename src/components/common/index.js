import React, { useState, useEffect } from 'react';

/* ---------------------------------- */
// ContCard

export function ContCard({ children,
  title,
  footer
}) {

  const stdChild = (arg) => {
    return typeof arg === 'string' ? <span>{arg}</span> : arg;
  }

  return (
    <div className="cont-card">
      <div className="cont-card-title">{stdChild(title)}</div>
      <div className="cont-card-body">{children}</div>
      <div className="cont-card-footer">{stdChild(footer)}</div>
    </div>
  );

}

/* ---------------------------------- */
// MenuItem

export function MenuItem({
  className,
  icon,
  main,
  info,
  trail,
  nav = false,
  onClick
}) {

  const stdChild = (arg) => {
    return typeof arg === 'string' ? <span>{arg}</span> : arg;
  }

  return (
    <div className={`menu-item ${className}`} {...(onClick && { role: 'button' })} onClick={onClick}>
      <div className="label">
        {icon}
      </div>
      <div className="contents">
        <div className="main">{stdChild(main)}</div>
        <div className="info">{stdChild(info)}</div>
        <div className="trail">
          {stdChild(trail)}
          {nav && <div className="drill"><i className="fa-solid fa-chevron-right"></i></div>}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */
// RadioMenuItem

export function RadioMenuItem({ title, selected = false, onClick }) {

  return (
    <MenuItem
      className={`radio-menu-item ${selected ? 'selected' : ''}`}
      main={title}
      trail={<i className={`bi ${selected ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>}
      onClick={onClick}
    />
  )
}
