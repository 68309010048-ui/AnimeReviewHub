// ======================================================
// Anime Review Hub
// user.js
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// ======================================================
// Elements
// ======================================================

const username =
    document.getElementById("username");

const adminMenu =
    document.getElementById("adminMenu");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// Authentication
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "pages/login.html";

        return;

    }

    try {

        const userSnap = await getDoc(
            doc(db, "users", user.uid)
        );


        // ==========================================
        // Default
        // ==========================================

        let userName =
            user.displayName ||
            user.email ||
            "User";

        let role = "user";


        // ==========================================
        // Firestore User
        // ==========================================

        if (userSnap.exists()) {

            const data = userSnap.data();

            userName =
                data.name ||
                user.displayName ||
                user.email ||
                "User";

            role =
                data.role ||
                "user";

        }


        // ==========================================
        // แสดงชื่อ
        // ==========================================

        if (username) {

            username.textContent =
                "👋 " + userName;

        }


        // ==========================================
        // Admin Menu
        // admin + superadmin
        // ==========================================

        if (adminMenu) {

            if (
                role === "admin" ||
                role === "superadmin"
            ) {

                adminMenu.style.display =
                    "inline-flex";

            }
            else {

                adminMenu.style.display =
                    "none";

            }

        }


        // ==========================================
        // Super Admin Menu
        // ==========================================

        const superAdminMenu =
            document.getElementById(
                "superAdminMenu"
            );

        if (superAdminMenu) {

            if (
                role === "superadmin"
            ) {

                superAdminMenu.style.display =
                    "flex";

            }
            else {

                superAdminMenu.style.display =
                    "none";

            }

        }


        // ==========================================
        // Debug
        // ==========================================

        console.log(
            "Login:",
            user.email
        );

        console.log(
            "Role:",
            role
        );

    }
    catch (error) {

        console.error(
            "User Load Error:",
            error
        );

        if (username) {

            username.textContent =
                "👋 " +
                (
                    user.displayName ||
                    user.email ||
                    "User"
                );

        }

    }

});


// ======================================================
// Logout
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "pages/login.html";

            }
            catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

            }

        }
    );

}