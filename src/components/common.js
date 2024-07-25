import React, { useState, useEffect, useMemo, useRef } from 'react';
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

import { Collapse } from 'react-bootstrap';

import { useOptions, useLeague } from '../contexts/SessionContext';
import { useFirebase, useStats } from '../firebase/useFirebase';

/* ---------------------------------- */
// stdChild

function stdChild(arg) {
  return arg ? (typeof arg === 'string' ? <span>{arg}</span> : arg) : null;
}

function themeColor(color) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--ios-${color}`).trim();
}

/* ---------------------------------- */
// MainHeader

export function MainHeader({ children }) {

  return (
    <div className={`main-header`}>
      {children && <div className="main-header-content">{children}</div>}
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

export function ContCard({ children, title, footer, loading, ...props }) {

  return (
    <div className={getClassName('cont-card', props)}>
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

// export function MenuItem({ className = '', icon, main, trail, nav = false, onClick }) {

//   return (
//     <div className={`menu-item ${className}`} {...(onClick && { role: 'button' })} onClick={onClick}>
//       <div className="label">
//         {icon}
//       </div>
//       <div className="contents vstack justify-content-center">
//         <div className="hstack">
//           <div className="main hstack flex-grow-1 flex-shrink-1 overflow-hidden">{stdChild(main)}</div>
//           <div className="trail hstack flex-grow-0 flex-shrink-0">
//             {stdChild(trail)}
//             {nav && <div className="drill"><i className="fa-solid fa-chevron-right"></i></div>}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

function getClassName(base, props) {
  let classNames = base;
  if ('className' in props) classNames += ` ${props.className}`;
  return classNames;
}

// added classes to props (if props has className, append classes to it)
// return new props object
function getPropsWith(props, classUpdate) {
  return { ...props, className: ('className' in props) ? [classUpdate, props.className].join(' ') : classUpdate };
}

/* ---------------------------------- */


export function Menu({ children, ...props }) {
  return (
    <div {...getPropsWith(props, 'menu')}>
      {children}
    </div>
  );
}

// menu with one menu item that, when clicked, expands to show a sub-menu with additional items
export function MenuCollapsible({ children, title, expanded, inactive, onClick }) {

  const open = expanded ? true : false;

  return (
    <div className="menu menu-collapsible">
      <MenuItem
        main={title}
        trail={<i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`}></i>}
        onClick={() => onClick(!expanded)}
        role="button"
        inactive={inactive}
      />
      <Collapse in={open}>
        <div>
          <Menu>{children}</Menu>
        </div>
      </Collapse>
    </div>
  );
}


export function MenuItem({ main, trail, nav, ...props }) {

  const classUpdates = ['menu-item'];
  if (props.inactive) classUpdates.push('inactive');

  return (
    <div {...getPropsWith(props, classUpdates.join(' '))}>
      <div className="contents vstack justify-content-center">
        <div className="hstack">
          <div className="main hstack flex-grow-1 flex-shrink-1 overflow-hidden">{stdChild(main)}</div>
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
// RadioMenuItem

export function RadioMenuItem({ title, selected, ...props }) {

  const classUpdates = ['radio-menu-item'];
  if (selected) classUpdates.push('selected');

  return (
    <MenuItem
      {...getPropsWith(props, classUpdates.join(' '))}
      main={title}
      trail={<CheckboxButton checked={selected} />}
      role="button"
    />
  );
}

/* ---------------------------------- */
// IconButton

export function IconButton({ icon, color, raised = true, onClick, hide = false, className }) {

  if (hide) return null;
  let classNames = 'icon-button';
  if (raised) classNames += ' raised';
  if (className) classNames += ` ${className}`;

  const style = {};
  if (color) style.color = themeColor(color);

  return (
    <div className={classNames} onClick={onClick} role="button">
      <i className={icon} style={style}></i>
    </div>
  );
}

/* ---------------------------------- */
// CheckboxButton

export function CheckboxButton({ checked, disabled, ...props }) {

  const classUpdates = ['checkbox'];
  if (checked) classUpdates.push('checked');
  if (disabled) classUpdates.push('disabled');

  return (
    <div {...getPropsWith(props, classUpdates.join(' '))} role="button">
      <IonIcon icon={checked ? checkmarkCircle : ellipseOutline} />
    </div>
  );
}



/* ---------------------------------- */
// TeamLabel

export function TeamLabel({ team, withRecord = false }) {
  const { favTeam } = useOptions();
  const s = useStats('games', 'ALL');
  const stats = (!s.loading) ? s.data : null;
  const record = (stats && stats[team.id] && withRecord) ? stats[team.id].record : null;

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

  let classNames = 'button-inline';
  if (className) classNames += ` ${className}`;
  if (disabled) classNames += ' disabled';

  return (
    <div className={classNames} onClick={onClick} role="button">
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

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

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

  let classNames = "table";
  if ('className' in props) classNames += ' ' + props.className;

  return (
    <div className="table-responsive">
      <table className={classNames}>
        {children}
      </table>
    </div>
  );
}