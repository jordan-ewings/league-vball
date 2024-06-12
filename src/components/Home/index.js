/* ---------------------------------- */
// Home

import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { useAuth, useLeague, useOptions } from '../../contexts/SessionContext';

import {
  MainHeader,
  ContCard,
  MenuItem,
  RadioMenuItem,
  TeamLabel,
  Switch,
  Spinner,
  ButtonInline,
  TextInput,
} from '../common';

/* ---------------------------------- */

export default function Home() {

  return (
    <div className="section">
      <MainHeader />
      <div className="main-body">
        <LeagueSelect />
        <AdminAccess />
        <TeamSelect />
      </div>
    </div>
  );
}

/* ---------------------------------- */
// league select

function LeagueSelect() {

  const [didMount, setDidMount] = useState(false);
  const { loading, leagues, leagueId, setLeagueId } = useLeague();

  const options = useMemo(() => {
    return Object.values(leagues).sort((a, b) => {
      if (a.season != b.season) return a.season - b.season;
      if (a.session != b.session) return a.session - b.session;
      if (a.league == b.league) return 0;
      let days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      return days.indexOf(a.league) - days.indexOf(b.league);
    });
  }, [leagues]);

  const createTitle = (title) => {
    const main1 = title.split(' ')[0] + ' Night';
    const main2 = title.split(' ').slice(2).join(' ');
    return (
      <div className="d-flex justify-content-start align-items-center column-gap-2">
        <span>{main1}</span>
        <span className="sub-main">{main2}</span>
      </div>
    );
  }

  useEffect(() => { if (!loading) setDidMount(true); }, [loading]);

  return (
    <div id="league-select-container">
      <ContCard title="SELECT LEAGUE" loading={!didMount}>
        <div className="radio-menu">
          {options.map(o => (
            <RadioMenuItem
              key={o.id}
              title={createTitle(o.title)}
              selected={o.id == leagueId}
              onClick={() => setLeagueId(o.id)}
            />
          ))}
        </div>
      </ContCard>
    </div>
  );
}

/* ---------------------------------- */
// admin access

function AdminAccess() {

  // const [didMount, setDidMount] = useState(false);
  const { admin, controls, setControls, login, logout } = useAuth();
  const passwordRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSignIn = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    login(passwordRef.current.value)
      .then(() => setLoading(false))
      .catch(e => {
        console.log('Sign in failed:', e);
        setErrorMsg('Incorrect password');
        setLoading(false);
        passwordRef.current.value = '';
      });
  }

  const renderFooter = () => {
    return errorMsg && <span className="invalid-msg">{errorMsg}</span>;
  }

  return (
    <div id="admin-container">
      <ContCard title="ADMIN ACCESS" footer={renderFooter()}>
        {!admin && (
          <form onSubmit={handleSignIn}>
            <MenuItem
              className="login-form"
              main={<TextInput type="password" placeholder="Enter password..." ref={passwordRef} />}
              trail={loading ? <Spinner /> : <ButtonInline icon="fa-regular fa-circle-right" onClick={handleSignIn} />}
            />
          </form>
        )}
        {admin && (
          <MenuItem
            className="logged-in-form"
            main="Enable Controls"
            trail={<Switch checked={controls} onChange={() => setControls(!controls)} />}
          />
        )}
        {admin && (
          <MenuItem
            className="logout-form"
            main={<ButtonInline text="Logout" onClick={logout} />}
          />
        )}
      </ContCard>
    </div>
  );
}

/* ---------------------------------- */
// TeamSelect

function TeamSelect() {

  const [didMount, setDidMount] = useState(false);
  const { favTeam, setFavTeam } = useOptions();
  const { loading, teams } = useLeague();
  const [sortedTeams, setSortedTeams] = useState([]);

  useEffect(() => {
    const options = Object.values(teams);
    const sorted = [...options].sort((a, b) => (a.name === favTeam ? -1 : b.name === favTeam ? 1 : 0));
    setSortedTeams(sorted);
  }, [favTeam, teams]);

  useEffect(() => { if (!loading) setDidMount(true); }, [loading]);

  return (
    <div id="team-select-container">
      <ContCard title="MY TEAM" loading={!didMount}>
        <div className="radio-menu">
          {sortedTeams.map(team => {
            const isFav = team.name == favTeam;
            return (
              <RadioMenuItem
                key={team.id}
                title={<TeamLabel team={team} />}
                selected={isFav}
                onClick={() => setFavTeam(isFav ? null : team.name)}
              />
            );
          })}
        </div>
      </ContCard>
    </div>
  );
}

/* ---------------------------------- */