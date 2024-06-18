import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/SessionContext';

import {
  ContCard,
  MenuItem,
  Switch,
  Spinner,
  ButtonInline,
  TextInput,
} from '../common';

/* ---------------------------------- */
// admin access

export default function AdminAccess() {

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
          <>
            <MenuItem
              className="logged-in-form"
              main="Enable Controls"
              trail={<Switch checked={controls} onChange={() => setControls(!controls)} />}
            />
            <MenuItem
              className="logout-form"
              main={<ButtonInline text="Logout" onClick={logout} />}
            />
          </>
        )}
      </ContCard>
    </div>
  );
}