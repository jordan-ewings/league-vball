import React, { useState, useEffect } from 'react';
import { useOptions, useLeague } from '../../contexts/SessionContext';
import { useFirebase } from '../../hooks/useFirebase';

/* ---------------------------------- */
// stdChild

function stdChild(arg) {
  return typeof arg === 'string' ? <span>{arg}</span> : arg;
}

/* ---------------------------------- */
// ContCard

export function ContCard({ children,
  title,
  footer,
  className = '',
  loading = false,
}) {

  const renderBody = () => {
    return loading ? (
      <MenuItem main={<Spinner />} />
    ) : (
      children
    );
  }

  return (
    <div className={`cont-card ${className}`}>
      <div className="cont-card-title">{stdChild(title)}</div>
      <div className="cont-card-body">
        {loading ? <MenuItem main={<Spinner />} /> : children}
      </div>
      <div className="cont-card-footer">{stdChild(footer)}</div>
    </div>
  );

}

export function LoadingContCard({ title }) {
  return (
    <ContCard title={title} className="placeholder-glow">
      <MenuItem main={<Spinner />} />
    </ContCard>
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

/* ---------------------------------- */
// TeamLabel

export function TeamLabel({ team, withRecord = false }) {
  const { favTeam } = useOptions();
  const { leagueId } = useLeague();
  const recordPath = withRecord ? `teams/${leagueId}/${team.id}/stats/games/record` : null;
  const record = useFirebase(recordPath);

  return (
    <div className="team-label">
      <span className="team-nbr">{team.nbr}</span>
      <span className="team-name">{team.name}</span>
      {record && <span className="team-record">{record}</span>}
      {team.name == favTeam && <i className="fa-solid fa-user fav-team"></i>}
    </div>
  );
}

/* ---------------------------------- */
// Switch

export function Switch({ checked, onChange }) {
  return (
    <div className="form-check form-switch">
      <input className="form-check-input" type="checkbox" role="switch" checked={checked} onChange={onChange} />
    </div>
  );
}

/* ---------------------------------- */
// Spinner

export function Spinner() {
  return (
    <div className="spinner-border spinner-border-sm"></div>
  );
}

/* ---------------------------------- */
// ButtonInline

export function ButtonInline({ icon, text, onClick }) {
  return (
    <div role="button" onClick={onClick}>
      {icon && <i className={icon}></i>}
      <span>{text}</span>
    </div>
  );
}
