// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAAHq9D9p_w8wRxHcp512tjyrLPasOmAko",
    authDomain: "jsyp24-fifa.firebaseapp.com",
    databaseURL: "https://jsyp24-fifa-default-rtdb.firebaseio.com",
    projectId: "jsyp24-fifa",
    storageBucket: "jsyp24-fifa.appspot.com",
    messagingSenderId: "95497637800",
    appId: "1:95497637800:web:1f16f2fdc1a64776c0579d"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { database, auth };