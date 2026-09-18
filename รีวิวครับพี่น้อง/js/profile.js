// ======================================================
// Anime Review Hub
// profile.js
// Real-time Profile
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    onSnapshot,
    updateDoc,
    collection,
    query,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// ======================================================
// Elements
// ======================================================

const profileImage =
    document.getElementById("profileImage");

const displayName =
    document.getElementById("displayName");

const displayEmail =
    document.getElementById("displayEmail");

const displayRole =
    document.getElementById("displayRole");

const nameInput =
    document.getElementById("name");

const photoInput =
    document.getElementById("photo");

const saveProfile =
    document.getElementById("saveProfile");

const favoriteCount =
    document.getElementById("favoriteCount");

const bookmarkCount =
    document.getElementById("bookmarkCount");

const reviewCount =
    document.getElementById("reviewCount");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// Variables
// ======================================================

let currentUser = null;

let unsubscribeUser = null;
let unsubscribeFavorites = null;
let unsubscribeBookmarks = null;
let unsubscribeReviews = null;

let currentUserData = {};


// ======================================================
// Authentication
// ======================================================

onAuthStateChanged(
    auth,
    (user) => {

        // ยกเลิก listener เก่า
        unsubscribeAll();


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        // ==============================================
        // User Realtime
        // ==============================================

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        unsubscribeUser =
            onSnapshot(
                userRef,
                (snap) => {

                    if (!snap.exists()) {

                        currentUserData = {

                            name:
                                user.displayName ||
                                user.email ||
                                "User",

                            email:
                                user.email ||
                                "",

                            role:
                                "user",

                            photo:
                                user.photoURL ||
                                ""

                        };

                    }
                    else {

                        currentUserData =
                            snap.data();

                    }


                    updateProfileUI();

                },

                (error) => {

                    console.error(
                        "Profile user realtime error:",
                        error
                    );

                }
            );


        // ==============================================
        // Favorite count
        // ==============================================

        const favoriteQuery =
            query(
                collection(
                    db,
                    "favorites"
                ),
                where(
                    "uid",
                    "==",
                    user.uid
                )
            );


        unsubscribeFavorites =
            onSnapshot(
                favoriteQuery,
                (snap) => {

                    if (favoriteCount) {

                        favoriteCount.textContent =
                            snap.size;

                    }

                }
            );


        // ==============================================
        // Bookmark count
        // ==============================================

        const bookmarkQuery =
            query(
                collection(
                    db,
                    "bookmarks"
                ),
                where(
                    "uid",
                    "==",
                    user.uid
                )
            );


        unsubscribeBookmarks =
            onSnapshot(
                bookmarkQuery,
                (snap) => {

                    if (bookmarkCount) {

                        bookmarkCount.textContent =
                            snap.size;

                    }

                }
            );


        // ==============================================
        // Review count
        // ==============================================

        const reviewQuery =
            query(
                collection(
                    db,
                    "reviews"
                ),
                where(
                    "uid",
                    "==",
                    user.uid
                )
            );


        unsubscribeReviews =
            onSnapshot(
                reviewQuery,
                (snap) => {

                    if (reviewCount) {

                        reviewCount.textContent =
                            snap.size;

                    }

                }
            );

    }
);


// ======================================================
// Update UI
// ======================================================

function updateProfileUI() {

    if (!currentUser) {
        return;
    }


    const name =
        currentUserData.name ||
        currentUser.displayName ||
        currentUser.email ||
        "User";


    const email =
        currentUserData.email ||
        currentUser.email ||
        "";


    const photo =
        currentUserData.photo ||
        currentUserData.photoURL ||
        currentUser.photoURL ||
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            name
        )}`;


    const role =
        currentUserData.role ||
        "user";


    // ==============================================
    // Display
    // ==============================================

    if (displayName) {

        displayName.textContent =
            name;

    }


    if (displayEmail) {

        displayEmail.textContent =
            email;

    }


    if (displayRole) {

        displayRole.textContent =
            role === "superadmin"
                ? "Super Admin"
                : role === "admin"
                    ? "Reviewer"
                    : "User";

    }


    if (profileImage) {

        profileImage.src =
            photo;

        profileImage.alt =
            name;

    }


    // ==============================================
    // Input
    // ==============================================

    if (
        nameInput &&
        document.activeElement !== nameInput
    ) {

        nameInput.value =
            name;

    }


    if (
        photoInput &&
        document.activeElement !== photoInput
    ) {

        photoInput.value =
            photo;

    }

}


// ======================================================
// Save Profile
// ======================================================

if (saveProfile) {

    saveProfile.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                alert(
                    "กรุณาเข้าสู่ระบบ"
                );

                return;

            }


            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";


            const photo =
                photoInput
                    ? photoInput.value.trim()
                    : "";


            if (!name) {

                alert(
                    "กรุณากรอกชื่อ"
                );

                return;

            }


            saveProfile.disabled =
                true;

            saveProfile.textContent =
                "กำลังบันทึก...";


            try {

                // ======================================
                // Update User
                // ======================================

                await updateDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    ),
                    {
                        name,
                        photo
                    }
                );


                // ======================================
                // Update Existing Reviews
                // ======================================

                const reviewQuery =
                    query(
                        collection(
                            db,
                            "reviews"
                        ),
                        where(
                            "uid",
                            "==",
                            currentUser.uid
                        )
                    );


                const reviewSnap =
                    await new Promise(
                        (resolve, reject) => {

                            const unsubscribe =
                                onSnapshot(
                                    reviewQuery,
                                    (snap) => {

                                        unsubscribe();

                                        resolve(snap);

                                    },
                                    reject
                                );

                        }
                    );


                if (!reviewSnap.empty) {

                    const batch =
                        writeBatch(db);


                    reviewSnap.forEach(
                        (reviewDoc) => {

                            batch.update(
                                reviewDoc.ref,
                                {
                                    username:
                                        name,

                                    photoURL:
                                        photo
                                }
                            );

                        }
                    );


                    await batch.commit();

                }


                // ======================================
                // Preview immediately
                // ======================================

                if (profileImage) {

                    profileImage.src =
                        photo ||
                        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                            name
                        )}`;

                }


                if (displayName) {

                    displayName.textContent =
                        name;

                }


                alert(
                    "บันทึกโปรไฟล์สำเร็จ"
                );

            }
            catch (error) {

                console.error(
                    "Save Profile Error:",
                    error
                );

                alert(
                    "บันทึกโปรไฟล์ไม่สำเร็จ"
                );

            }
            finally {

                saveProfile.disabled =
                    false;

                saveProfile.innerHTML =
                    '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูล';

            }

        }
    );

}


// ======================================================
// Logout
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                logoutBtn.disabled =
                    true;

                await signOut(auth);

                window.location.replace(
                    "login.html"
                );

            }
            catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

                logoutBtn.disabled =
                    false;

                alert(
                    "ออกจากระบบไม่สำเร็จ"
                );

            }

        }
    );

}


// ======================================================
// Cleanup
// ======================================================

function unsubscribeAll() {

    if (unsubscribeUser) {

        unsubscribeUser();
        unsubscribeUser = null;

    }

    if (unsubscribeFavorites) {

        unsubscribeFavorites();
        unsubscribeFavorites = null;

    }

    if (unsubscribeBookmarks) {

        unsubscribeBookmarks();
        unsubscribeBookmarks = null;

    }

    if (unsubscribeReviews) {

        unsubscribeReviews();
        unsubscribeReviews = null;

    }

}