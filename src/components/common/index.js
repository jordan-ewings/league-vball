import React, { useState, useEffect, useMemo } from 'react';
import { useOptions, useLeague } from '../../contexts/SessionContext';
import { useFirebase } from '../../hooks/useFirebase';

import './style.css';

/* ---------------------------------- */
// stdChild

function stdChild(arg) {
  // return typeof arg === 'string' ? <span>{arg}</span> : arg;
  // if no arg, return null
  // if arg is a string, return a span element with the string as the text
  // otherwise, return the arg
  return arg ? (typeof arg === 'string' ? <span>{arg}</span> : arg) : null;
}

/* ---------------------------------- */
// MainHeader

export function MainHeader({ children }) {
  return (
    <div className={`main-header ${children ? 'mb-3 mt-1' : ''}`}>
      {children}
    </div>
  )
}

/* ---------------------------------- */
// ContCard

export function ContCard({ children,
  title,
  footer,
  className = '',
  loading = false,
}) {

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

/* ---------------------------------- */
// MenuItem

export function MenuItem({
  className = '',
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
    <div className="spinner spinner-border spinner-border-sm"></div>
  );
}

/* ---------------------------------- */
// ButtonInline

export function ButtonInline({ icon, text, onClick, className = '' }) {
  return (
    <div className={`button-inline ${className}`} role="button" onClick={onClick}>
      {icon && <i className={icon}></i>}
      <span>{text}</span>
    </div>
  );
}

/* ---------------------------------- */
// Stepper

export function Stepper({ initial, value, setValue, disabled }) {

  const [change, setChange] = useState(0);

  const handleClick = (diff) => {
    const newValue = value + diff;
    if (newValue < 0) return;
    setValue(newValue);
    setChange(newValue - initial);
  }

  // if initial changes, reset value and change
  useEffect(() => {
    setChange(0);
  }, [initial]);

  return (
    <div className={`stepper ${change != 0 ? 'changed' : ''} ${disabled ? 'disabled' : ''}`}>
      <div className="stepper-value-initial">{initial}</div>
      <div className={`stepper-value ${!change && value == 0 ? 'zero' : ''}`}>{value}</div>
      <div className="stepper-input">
        <div className="stepper-btn-group">
          <div role="button" className="stepper-btn stepper-down" onClick={() => handleClick(-1)}>
            <i className="bi bi-dash-lg"></i>
          </div>
          <div className="separator"></div>
          <div role="button" className="stepper-btn stepper-up" onClick={() => handleClick(1)}>
            <i className="bi bi-plus-lg"></i>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */
// TextInput
// e.g. <TextInput type="password" placeholder="Enter password..." ref={ref} />
// e.g. <TextInput type="text" placeholder="Enter name..." onChange={handleChange} value={name} />
// (variety of props that may or may not be used)
// must allow other components to pass in a ref (but not required)

export const TextInput = React.forwardRef(({ type, placeholder, onChange }, ref) => {
  return (
    <input className="text-input" type={type} placeholder={placeholder} onChange={onChange} ref={ref} />
  );
});