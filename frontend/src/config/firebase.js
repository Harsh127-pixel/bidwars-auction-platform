import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASBLFO22bn6ORWBogY9g8FDib7CIPCcvE",
  authDomain: "bidwars-auction-platform.firebaseapp.com",
  projectId: "bidwars-auction-platform",
  storageBucket: "bidwars-auction-platform.firebasestorage.app",
  messagingSenderId: "1099002230057",
  appId: "1:1099002230057:web:887f367d5bce5ac7c3b338",
  measurementId: "G-QWBFYK7P8D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
