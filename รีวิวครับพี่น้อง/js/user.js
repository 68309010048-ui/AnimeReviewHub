// =====================================================
// Anime Review Hub
// user.js
// HOME USER REAL-TIME
// ชื่อ + รูป Profile Real-time
// =====================================================

import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const userAvatar =
    document.getElementById("userAvatar");

const username =
    document.getElementById("username");

const logoutBtn =
    document.getElementById("logoutBtn");

const adminMenu =
    document.getElementById("adminMenu");

const superAdminMenu =
    document.getElementById("superAdminMenu");


// =====================================================
// VARIABLES
// =====================================================

let unsubscribeUser =
    null;


// =====================================================
// DEFAULT AVATAR
// =====================================================

const DEFAULT_AVATAR =
    "https://api.dicebear.com/9.x/initials/svg?seed=User";


// =====================================================
// CREATE AVATAR FROM NAME
// =====================================================

function createAvatarFromName(name) {

    const finalName =
        String(name || "User")
            .trim() || "User";


    return (
        "https://api.dicebear.com/9.x/initials/svg" +
        "?seed=" +
        encodeURIComponent(finalName) +
        "&backgroundType=gradientLinear"
    );

}


// =====================================================
// GET AVATAR
// =====================================================

function getAvatar(
    name,
    photo
) {

    const image =
        String(photo || "")
            .trim();


    // มีรูปที่ผู้ใช้กำหนด
    if (image) {

        return image;

    }


    // ไม่มีรูป → ใช้ตัวอักษรจากชื่อ
    return createAvatarFromName(
        name
    );

}


// =====================================================
// UPDATE HOME USER
// =====================================================

function updateHomeUser(
    data
) {

    const name =
        data.name ||
        data.displayName ||
        "User";


    const photo =
        data.photo ||
        data.photoURL ||
        "";


    // =================================================
    // NAME
    // =================================================

    if (username) {

        username.textContent =
            name;

    }


    // =================================================
    // AVATAR
    // =================================================

    if (userAvatar) {

        userAvatar.onerror =
            null;


        userAvatar.src =
            getAvatar(
                name,
                photo
            );


        userAvatar.alt =
            name;


        userAvatar.onerror =
            () => {

                userAvatar.onerror =
                    null;

                userAvatar.src =
                    createAvatarFromName(
                        name
                    );

            };

    }

}


// =====================================================
// LOGGED OUT UI
// =====================================================

function setLoggedOutUI() {

    if (username) {

        username.textContent =
            "Guest";

    }


    if (userAvatar) {

        userAvatar.src =
            DEFAULT_AVATAR;

        userAvatar.alt =
            "Guest";

    }


    if (adminMenu) {

        adminMenu.style.display =
            "none";

    }


    if (superAdminMenu) {

        superAdminMenu.style.display =
            "none";

    }


    if (logoutBtn) {

        logoutBtn.innerHTML = `

            <i class="fa-solid fa-right-to-bracket"></i>

            เข้าสู่ระบบ

        `;

    }

}


// =====================================================
// ROLE MENU
// =====================================================

function updateRoleMenu(
    role
) {

    const userRole =
        String(
            role || "user"
        )
            .trim()
            .toLowerCase();


    if (adminMenu) {

        adminMenu.style.display =
            "none";

    }


    if (superAdminMenu) {

        superAdminMenu.style.display =
            "none";

    }


    // =================================================
    // ADMIN
    // =================================================

    if (
        userRole ===
        "admin"
    ) {

        if (adminMenu) {

            adminMenu.style.display =
                "inline-flex";

        }

    }


    // =================================================
    // SUPER ADMIN
    // =================================================

    if (
        userRole ===
        "superadmin"
    ) {

        if (adminMenu) {

            adminMenu.style.display =
                "inline-flex";

        }


        if (superAdminMenu) {

            superAdminMenu.style.display =
                "block";

        }

    }

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    user => {

        // =================================================
        // STOP OLD LISTENER
        // =================================================

        if (
            typeof unsubscribeUser ===
            "function"
        ) {

            unsubscribeUser();

            unsubscribeUser =
                null;

        }


        // =================================================
        // LOGOUT
        // =================================================

        if (!user) {

            setLoggedOutUI();

            return;

        }


        // =================================================
        // LOGIN
        // =================================================

        if (logoutBtn) {

            logoutBtn.innerHTML = `

                <i class="fa-solid fa-right-from-bracket"></i>

                Logout

            `;

        }


        // =================================================
        // USERS/{UID}
        // =================================================

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        // =================================================
        // REAL-TIME
        // =================================================

        unsubscribeUser =
            onSnapshot(

                userRef,

                snapshot => {

                    if (
                        !snapshot.exists()
                    ) {

                        updateHomeUser({

                            name:
                                user.displayName ||
                                user.email ||
                                "User",

                            photo:
                                user.photoURL ||
                                ""

                        });


                        updateRoleMenu(
                            "user"
                        );


                        return;

                    }


                    const data =
                        snapshot.data();


                    console.log(
                        "HOME USER REALTIME:",
                        data
                    );


                    // =============================================
                    // NAME + PHOTO
                    // =============================================

                    updateHomeUser(
                        data
                    );


                    // =============================================
                    // ROLE
                    // =============================================

                    updateRoleMenu(
                        data.role
                    );

                },

                error => {

                    console.error(
                        "HOME USER REALTIME ERROR:",
                        error
                    );


                    updateHomeUser({

                        name:
                            user.displayName ||
                            user.email ||
                            "User",

                        photo:
                            user.photoURL ||
                            ""

                    });


                    updateRoleMenu(
                        "user"
                    );

                }

            );

    }
);


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "pages/login.html";

            }

            catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );


                alert(
                    "ออกจากระบบไม่สำเร็จ"
                );

            }

        }
    );

}


// =====================================================
// DEBUG
// =====================================================

window.refreshHomeUser =
    function () {

        console.log(

            typeof unsubscribeUser ===
            "function"

                ? "Home User Real-time: ON"

                : "Home User Real-time: OFF"

        );

    };