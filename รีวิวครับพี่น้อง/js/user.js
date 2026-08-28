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

const userAvatar =
    document.getElementById("userAvatar");

const adminMenu =
    document.getElementById("adminMenu");

const superAdminMenu =
    document.getElementById("superAdminMenu");

const logoutBtn =
    document.getElementById("logoutBtn");

const darkBtn =
    document.getElementById("darkBtn");


// ======================================================
// Theme
// ======================================================

function loadTheme() {

    const theme =
        localStorage.getItem("theme") || "dark";

    if (theme === "light") {

        document.body.classList.add("light");

    } else {

        document.body.classList.remove("light");

    }

    updateDarkButton();

}


function updateDarkButton() {

    if (!darkBtn) return;

    const isLight =
        document.body.classList.contains("light");

    darkBtn.textContent =
        isLight ? "☀️" : "🌙";

}


if (darkBtn) {

    darkBtn.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light"
            );

            localStorage.setItem(
                "theme",
                document.body.classList.contains("light")
                    ? "light"
                    : "dark"
            );

            updateDarkButton();

        }
    );

}


loadTheme();


// ======================================================
// Authentication
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "Current Firebase User:",
            user
        );


        // ==================================================
        // ไม่ได้ Login
        // ==================================================

        if (!user) {

            if (username) {

                username.textContent =
                    "กรุณาเข้าสู่ระบบ";

            }

            if (userAvatar) {

                userAvatar.src =
                    "https://api.dicebear.com/9.x/initials/svg?seed=User";

            }

            if (adminMenu) {

                adminMenu.style.display =
                    "none";

            }

            if (superAdminMenu) {

                superAdminMenu.style.display =
                    "none";

            }

            return;

        }


        try {

            // ==================================================
            // Default Firebase data
            // ==================================================

            let userName =
                user.displayName ||
                user.email ||
                "User";


            let photo =
                user.photoURL ||
                "";


            let role =
                "user";


            // ==================================================
            // Firestore users/{uid}
            // ==================================================

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const snap =
                await getDoc(
                    userRef
                );


            console.log(
                "Firestore User:",
                snap.exists()
                    ? snap.data()
                    : "NOT FOUND"
            );


            if (snap.exists()) {

                const data =
                    snap.data();


                userName =
                    data.name ||
                    userName;


                photo =
                    data.photo ||
                    data.photoURL ||
                    photo;


                role =
                    data.role ||
                    "user";

            }


            // ==================================================
            // Avatar fallback
            // ==================================================

            if (!photo) {

                photo =
                    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                        userName
                    )}`;

            }


            // ==================================================
            // Show Username
            // ==================================================

            if (username) {

                username.textContent =
                    "👋 " + userName;

            }


            // ==================================================
            // Show Profile Image
            // ==================================================

            if (userAvatar) {

                userAvatar.src =
                    photo;

                userAvatar.alt =
                    userName;

            }


            // ==================================================
            // Admin
            // ==================================================

            if (adminMenu) {

                adminMenu.style.display =
                    (
                        role === "admin" ||
                        role === "superadmin"
                    )
                        ? "inline-flex"
                        : "none";

            }


            // ==================================================
            // Super Admin
            // ==================================================

            if (superAdminMenu) {

                superAdminMenu.style.display =
                    role === "superadmin"
                        ? "flex"
                        : "none";

            }


            // ==================================================
            // Debug
            // ==================================================

            console.log(
                "Name:",
                userName
            );

            console.log(
                "Role:",
                role
            );

            console.log(
                "Photo:",
                photo
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

    }
);


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

