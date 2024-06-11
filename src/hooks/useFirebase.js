import React, { useSyncExternalStore } from "react";
import { get, child, ref, onValue, set } from "firebase/database";
import { db } from "../firebase";

/* ---------------------------------- */
// firebase store

const store = new Map();
const subscribers = new Map();

export function useFirebase(reference) {

  initReference(reference);
  return useSyncExternalStore(
    (callback) => subscribe(reference, callback),
    () => getSnapshot(reference)
  );
}

function initReference(reference) {
  if (!reference) return;
  if (store.has(reference)) return;

  store.set(reference, null);
  console.log('New reference:', reference);
  const dbRef = ref(db, reference);
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    store.set(reference, data);
    if (subscribers.has(reference)) {
      subscribers.get(reference).forEach((cb) => cb(data));
    }
  });
}

function subscribe(reference, callback) {
  if (!reference) return;
  if (!subscribers.has(reference)) {
    subscribers.set(reference, new Set());
  }
  subscribers.get(reference).add(callback);

  if (store.has(reference)) {
    callback(store.get(reference));
  }

  return () => {
    const callbackSet = subscribers.get(reference);
    if (callbackSet) {
      callbackSet.delete(callback);
      if (callbackSet.size === 0) {
        subscribers.delete(reference);
      }
    }
  };
}

function getSnapshot(reference) {
  return store.get(reference);
}

/* ---------------------------------- */

