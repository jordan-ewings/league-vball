import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOptions, useLeague } from '../../contexts/SessionContext';
import { useFirebase } from '../../firebase/useFirebase';
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  checkmarkCircle,
  checkmarkOutline,
  ellipseOutline,
  banOutline,
} from 'ionicons/icons';

import './style.css';
import { set } from 'firebase/database';

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

  const nodeRef = useRef(null);
  // const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--ion-safe-area-top').trim();

  // useEffect(() => {
  //   const header = nodeRef.current;
  //   const handleScroll = () => {
  //     if (header.getBoundingClientRect().top <= parseInt(safeAreaTop) + 10) {
  //       if (!header.classList.contains('scrolled')) {
  //         header.classList.add('scrolled');
  //       }
  //     } else {
  //       if (header.classList.contains('scrolled')) {
  //         header.classList.remove('scrolled');
  //       }
  //     }
  //   }

  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  return (
    <div className={`main-header`} ref={nodeRef}>
      {children}
    </div>
  )
}

// MainHeader title
MainHeader.Title = function MainHeaderTitle({ text }) {
  return (
    <div className="main-header-title">
      <span>{text || 'Loading...'}</span>
    </div>
  );
}

// MainHeader back button
MainHeader.BackButton = function MainHeaderBackButton({ onClick }) {

  return (
    <ButtonInline
      className="btn-back"
      icon="fa-solid fa-chevron-left"
      text="Back"
      onClick={onClick}
    />
  );
}

// MainHeader save button
MainHeader.SaveButton = function MainHeaderSaveButton({ onClick, disabled = false }) {

  const [status, setStatus] = useState('idle');

  const handleClick = () => {
    if (status !== 'idle') return;
    setStatus('pending');
    onClick()
      .then(() => {
        setStatus('done');
        setTimeout(() => setStatus('idle'), 1000);
      })
      .catch(error => {
        setStatus('idle');
        console.error('Error updating data:', error);
      });
  }

  const icon = status === 'pending' ? 'fa-solid fa-spinner fa-spin' : status === 'done' ? 'fa-solid fa-check' : null;
  const text = status !== 'idle' ? null : 'Save';
  const isDisabled = status === 'idle' ? disabled : false;

  return (
    <ButtonInline
      icon={icon}
      text={text}
      onClick={handleClick}
      disabled={isDisabled}
      className="btn-save"
    />
  );
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
        {loading
          ? <MenuItem main={<SpinnerBlock />} />
          : children}
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
      <div className="contents vstack justify-content-center">
        <div className="hstack">
          <div className="main hstack flex-grow-1 flex-shrink-1 overflow-hidden">{stdChild(main)}</div>
          <div className="info hstack">{stdChild(info)}</div>
          <div className="trail hstack flex-grow-0 flex-shrink-0">
            {stdChild(trail)}
            {nav && <div className="drill"><i className="fa-solid fa-chevron-right"></i></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */
// IconButton

// export function IconButton({ icon, bare = false, small = false, onClick, className = '', hide = false, disabled = false }) {
//   if (hide) return null;
//   let divClass = 'icon-button';
//   if (className) divClass += ` ${className}`;
//   if (bare) divClass += ' bare';
//   if (small) divClass += ' small';
//   if (disabled) divClass += ' disabled';
//   // const divClass = `icon-button ${className} ${bare ? 'bare' : ''} ${small ? 'small' : ''} ${disabled ? 'disabled' : ''}`;
//   return (
//     <div className={divClass} role="button" onClick={onClick}>
//       <i className={icon}></i>
//       {/* <ion-icon name="checkmark-circle-outline"></ion-icon> */}
//     </div>
//   );
// }

export function IconButton({ icon, color, raised = true, onClick, hide = false, className }) {

  if (hide) return null;

  let classNames = 'icon-button';
  if (raised) classNames += ' raised';
  if (className) classNames += ` ${className}`;

  // get --ios-{color} from css
  const style = {};
  if (color) style.color = getComputedStyle(document.documentElement).getPropertyValue(`--ios-${color}`).trim();

  return (
    <div className={classNames} onClick={onClick} role="button">
      <i className={icon} style={style}></i>
    </div>
  );
}

/* ---------------------------------- */
// CheckboxButton

export function CheckboxButton({ checked, disabled, size, color = 'blue', filled = true, xMark = false, className = '', onClick }) {

  const handleClick = () => {
    if (onClick && !disabled) onClick();
  }

  let classNames = 'checkbox';
  if (checked) classNames += ' checked';
  if (disabled) classNames += ' disabled';
  if (filled) classNames += ' filled';
  if (className) classNames += ` ${className}`;

  // get --ios-{color} from css
  const compColor = getComputedStyle(document.documentElement).getPropertyValue(`--ios-${color}`).trim();
  const style = {};
  if (checked) style.color = compColor;
  if (size) style.fontSize = size;

  return (
    <div className={classNames} {...(!disabled && { role: 'button' })} onClick={handleClick}>
      <IonIcon
        icon={checked && filled && !xMark
          ? checkmarkCircle
          : (checked && !filled && !xMark)
            ? checkmarkCircleOutline
            : (xMark)
              ? banOutline
              : ellipseOutline}
        style={style}
      />
    </div>
  );
}

/* ---------------------------------- */


/* ---------------------------------- */
// RadioMenuItem

export function RadioMenuItem({ title, selected = false, onClick }) {

  return (
    <MenuItem
      className={`radio-menu-item ${selected ? 'selected' : ''}`}
      main={title}
      onClick={onClick}
      trail={<CheckboxButton checked={selected} onClick={onClick} />}
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
// Loader

export function SpinnerBlock({ align = 'start', size = '1.5rem' }) {

  const divClass = `d-flex flex-column align-self-stretch justify-content-center align-items-${align}`;

  return (
    <div className={divClass}>
      <ClipLoader color={'#0a84ff'} size={size} />
    </div>
  );

}

/* ---------------------------------- */
// ButtonInline

export function ButtonInline({ icon, text, onClick, disabled = false, className = '' }) {

  const btnClass = `button-inline ${className} ${disabled ? 'disabled' : ''}`;

  return (
    <div className={btnClass} onClick={onClick} role="button">
      {icon && <i className={icon}></i>}
      <span>{text}</span>
    </div>
  );
}

/* ---------------------------------- */
// Stepper

export function Stepper({ initialValue, onChange, disabled = false }) {

  const [value, setValue] = useState(initialValue);
  const change = value - initialValue;

  // update state and provide new value to parent
  const handleClick = (diff) => {
    const newValue = value + diff;
    if (newValue < 0) return;
    setValue(newValue);
    onChange(newValue);
  }

  return (
    <div className={`stepper ${change != 0 ? 'changed' : ''}`}>
      {!disabled && <div className="stepper-value-initial">{initialValue}</div>}
      <div className={`stepper-value ${!change && value == 0 ? 'zero' : ''}`}>{value}</div>
      {!disabled && (
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
      )}
    </div>
  );
}

/* ---------------------------------- */
// TextInput

export const TextInput = React.forwardRef(({ type, placeholder, onChange }, ref) => {
  return (
    <input className="text-input" type={type} placeholder={placeholder} onChange={onChange} ref={ref} />
  );
});

/* ---------------------------------- */
// Table

export function Table({ children, ...props }) {

  let className = "table";
  if ('className' in props) className += ' ' + props.className;

  return (
    <div className="table-responsive">
      <table className={className}>
        {children}
      </table>
    </div>
  );
}