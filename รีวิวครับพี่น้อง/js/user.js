import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "pages/login.html";
        return;

    }

    const username = document.getElementById("username");
    const adminMenu = document.getElementById("adminMenu");

    try {

        const snap = await getDoc(
            doc(db, "users", user.uid)
        );

        if (snap.exists()) {

            const data = snap.data();

            username.textContent =
                "👋 " + (data.name || user.email);

            // ซ่อนปุ่ม Admin ก่อน
            adminMenu.style.display = "none";

            // ถ้าเป็น Admin ค่อยแสดง
            if (data.role === "admin") {

                adminMenu.style.display = "inline-block";

            }

        } else {

            username.textContent = "👋 " + user.email;

        }

    } catch (error) {

        console.log(error);

        username.textContent = "👋 " + user.email;

    }

});


// Logout

document.getElementById("logoutBtn").addEventListener("click", async () => {

    await signOut(auth);

    location.href = "pages/login.html";

});