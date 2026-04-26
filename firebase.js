import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBx_q-gVuPwNTMUslYbXg-mcuX7exNo1zI",
  authDomain: "inventory-system-55b9f.firebaseapp.com",
  databaseURL: "https://inventory-system-55b9f-default-rtdb.firebaseio.com",
  projectId: "inventory-system-55b9f",
  storageBucket: "inventory-system-55b9f.firebasestorage.app",
  messagingSenderId: "737020080957",
  appId: "1:737020080957:web:94c41080c8d95341e0cb54"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);