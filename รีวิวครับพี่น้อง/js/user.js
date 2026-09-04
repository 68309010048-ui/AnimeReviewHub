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

                userAvatar.alt =
                    "User";

            }


            if (adminMenu) {

                adminMenu.style.display =
                    "none";

            }


            if (superAdminMenu) {

                superAdminMenu.style.display =
                    "none";

            }


            // ==================================================
            // เปลี่ยน Logout → เข้าสู่ระบบ
            // ==================================================

            if (logoutBtn) {

                logoutBtn.innerHTML =
                    '<i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ';

                logoutBtn.title =
                    "เข้าสู่ระบบ";


                logoutBtn.onclick = () => {

                    window.location.href =
                        "pages/login.html";

                };

            }


            return;

        }


        // ==================================================
        // Login แล้ว
        // ==================================================

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


                // ใช้ชื่อที่บันทึกใน Firestore
                userName =
                    data.name ||
                    userName;


                // ใช้รูปจาก Firestore ก่อน Google
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
            // Admin / Reviewer
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
            // เปลี่ยน เข้าสู่ระบบ → Logout
            // ==================================================

            if (logoutBtn) {

                logoutBtn.innerHTML =
                    '<i class="fa-solid fa-right-from-bracket"></i> Logout';

                logoutBtn.title =
                    "ออกจากระบบ";


                logoutBtn.onclick =
                    async () => {

                        try {

                            logoutBtn.disabled =
                                true;


                            logoutBtn.innerHTML =
                                '<i class="fa-solid fa-spinner fa-spin"></i> กำลังออกจากระบบ...';


                            await signOut(auth);


                            // Home อยู่โฟลเดอร์หลัก
                            window.location.href =
                                "pages/login.html";

                        }
                        catch (error) {

                            console.error(
                                "Logout Error:",
                                error
                            );


                            logoutBtn.disabled =
                                false;


                            logoutBtn.innerHTML =
                                '<i class="fa-solid fa-right-from-bracket"></i> Logout';

                        }

                    };

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


            // ==================================================
            // ถ้าโหลด Firestore ไม่ได้
            // ยังให้ Logout ทำงานได้
            // ==================================================

            if (logoutBtn) {

                logoutBtn.innerHTML =
                    '<i class="fa-solid fa-right-from-bracket"></i> Logout';


                logoutBtn.onclick =
                    async () => {

                        try {

                            await signOut(auth);

                            window.location.href =
                                "pages/login.html";

                        }
                        catch (logoutError) {

                            console.error(
                                "Logout Error:",
                                logoutError
                            );

                        }

                    };

            }

        }

    }
);