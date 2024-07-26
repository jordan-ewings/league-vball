import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/SessionContext';
import { IonToggle } from '@ionic/react';

import {
  ContCard,
  Menu,
  MenuItem,
  Spinner,
  ButtonInline,
  TextInput,
} from '../components/common';

/* ---------------------------------- */
// admin access

export default function AdminAccess() {

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
    <ContCard title="ADMIN ACCESS" footer={renderFooter()}>
      {!admin && (
        <form onSubmit={handleSignIn}>
          <Menu>
            <MenuItem
              className="login-form"
              main={<TextInput type="password" placeholder="Enter password..." ref={passwordRef} />}
              trail={loading ? <Spinner /> : <ButtonInline icon="fa-regular fa-circle-right" onClick={handleSignIn} />}
            />
          </Menu>
        </form>
      )}
      {admin && (
        <Menu>
          <MenuItem
            className="logged-in-form"
            main="Enable Controls"
            trail={<IonToggle checked={controls} onIonChange={() => setControls(!controls)} />}
          />
          <MenuItem
            className="logout-form"
            main={<ButtonInline text="Logout" onClick={logout} />}
          />
        </Menu>
      )}
    </ContCard>
  );
}