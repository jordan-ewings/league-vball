import React, { useState, useEffect, useMemo, useCallback, memo, useRef, createRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useLeague, useOptions, useNavHidden } from '../../contexts/SessionContext';
import { useFirebase, useFirebaseCache } from '../../firebase/useFirebase';
import { get, child, ref, onValue, off, set, update, increment } from "firebase/database";

import {
  MainHeader,
  ContCard,
  MenuItem,
  TeamLabel,
  ButtonInline,
  Stepper,
} from '../common';
import { db } from '../../firebase/firebase';

import { IonButton, IonButtons, IonBackButton, IonHeader, IonContent, IonNavLink, IonToolbar, IonTitle } from '@ionic/react';


/* ---------------------------------- */
// WeekStats

export default function WeekStats() {

  const { weekId } = useParams();
  const { leagueId } = useLeague();
  const { controls } = useAuth();
  const weeks = useFirebaseCache('weeks');
  const teams = useFirebaseCache('teams');
  const [updates, setUpdates] = useState({});
  const { setNavHidden } = useNavHidden();
  const navigate = useNavigate();

  // toggle nav
  useEffect(() => {
    setNavHidden(true);
    return () => setNavHidden(false);
  }, []);

  /* ---------------------------------- */
  // handleSave

  useEffect(() => {
    console.log('updates:', updates);
  }, [updates]);

  const handleSave = () => {
    return update(ref(db), updates);
  }

  const handleBack = () => {
    navigate('/standings');
  }

  /* ---------------------------------- */
  // render

  //   return (
  //     <div id="week-stats-container">
  //       <IonHeader>
  //         <IonToolbar>
  //           <IonButtons slot="start">
  //             <IonBackButton defaultHref="/standings"></IonBackButton>
  //           </IonButtons>
  //           <IonTitle>{weeks && weeks[weekId] ? weeks[weekId].label : 'Week'}</IonTitle>
  //           {controls && (
  //             <IonButtons slot="end">
  //               <IonButton onClick={handleSave} disabled={Object.keys(updates).length == 0}>Save</IonButton>
  //             </IonButtons>
  //           )}
  //         </IonToolbar>
  //       </IonHeader>
  //       <div className="main-body">
  //         <ContCard title="TEAM DRINKS" loading={!teams}>
  //           {teams && Object.values(teams).map(team => (
  //             <TeamDrinksItem
  //               key={team.id}
  //               team={team}
  //               refWeekStat={`stats/${leagueId}/${weekId}/${team.id}/drinks/count`}
  //               refTeamStat={`teams/${leagueId}/${team.id}/stats/drinks/count`}
  //               setUpdates={setUpdates}
  //               readOnly={!controls}
  //             />
  //           ))}
  //         </ContCard>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div id="week-stats-container">
      <MainHeader>
        <MainHeader.BackButton onClick={handleBack} />
        <IonBackButton></IonBackButton>
        <MainHeader.Title text={weeks && weeks[weekId] ? weeks[weekId].label : 'Week'} />
        {controls && <MainHeader.SaveButton onClick={handleSave} disabled={Object.keys(updates).length == 0} />}
      </MainHeader>
      <div className="main-body">
        <ContCard title="TEAM DRINKS" loading={!teams}>
          {teams && Object.values(teams).map(team => (
            <TeamDrinksItem
              key={team.id}
              team={team}
              refWeekStat={`stats/${leagueId}/${weekId}/${team.id}/drinks/count`}
              refTeamStat={`teams/${leagueId}/${team.id}/stats/drinks/count`}
              setUpdates={setUpdates}
              readOnly={!controls}
            />
          ))}
        </ContCard>
      </div>
    </div>
  );
}

/* ---------------------------------- */

// function TeamDrinksItem({ team, dataPath, setUpdates }) {
const TeamDrinksItem = memo(function TeamDrinksItem({ team, refWeekStat, refTeamStat, setUpdates, readOnly }) {

  const drinks = useFirebase(refWeekStat);

  const handleStepperChange = (newValue) => {
    const change = newValue - drinks;
    setUpdates((prev) => {
      const updates = { ...prev };
      if (change !== 0) {
        updates[refWeekStat] = increment(change);
        updates[refTeamStat] = increment(change);
      } else {
        delete updates[refWeekStat];
        delete updates[refTeamStat];
      }
      return updates;
    });
  }

  useEffect(() => {
    if (drinks !== null) {
      handleStepperChange(drinks);
    }
  }, [drinks]);

  return (
    <MenuItem
      className="team-drinks-item"
      main={<TeamLabel team={team} />}
      trail={drinks !== null && <Stepper initialValue={drinks} onChange={handleStepperChange} disabled={readOnly} />}
    />
  );
});
// }
