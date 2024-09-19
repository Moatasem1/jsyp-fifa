import { auth } from "./firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Login successful, redirect to admin page
                window.location.href = './admin.html';
            })
            .catch((error) => {
                console.error("Error signing in: ", error);
            });
    });
});