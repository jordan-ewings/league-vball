/* ---------------------------------- */
// firebase real-time database and authentication

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDIQtjpMrCnKYnm1ylGYevAT6uNsWytuFI",
  authDomain: "kellys-vball.firebaseapp.com",
  databaseURL: "https://kellys-vball-default-rtdb.firebaseio.com",
  projectId: "kellys-vball",
  storageBucket: "kellys-vball.appspot.com",
  messagingSenderId: "845238453911",
  appId: "1:845238453911:web:35d0b5c35fd25b3fac4bd2",
  measurementId: "G-09J76PZ3EG"
};

initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getDatabase();
