import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =========================
// Register
// =========================

const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {

    registerBtn.addEventListener("click", async () => {

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!name || !email || !password) {

            alert("กรุณากรอกข้อมูลให้ครบ");
            return;

        }

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            await setDoc(
                doc(db, "users", userCredential.user.uid),
                {
                    name: name,
                    email: email,
                    role: "user",
                    photo: "",
                    createdAt: serverTimestamp()
                }
            );

            alert("สมัครสมาชิกสำเร็จ");

            window.location.href = "login.html";

        } catch (error) {

            alert(error.message);

        }

    });

}


// =========================
// Login
// =========================

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {

    loginBtn.addEventListener("click", async () => {

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {

            alert("กรุณากรอก Email และ Password");
            return;

        }

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            window.location.href = "../index.html";

        } catch (error) {

            alert(error.message);

        }

    });

}