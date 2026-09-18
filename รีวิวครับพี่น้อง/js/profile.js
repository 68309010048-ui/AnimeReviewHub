// =====================================================
// Anime Review Hub
// profile.js
// PROFILE REAL-TIME
// ชื่อ + รูป Profile เปลี่ยนได้
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
    updateDoc,
    onSnapshot,
    collection,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

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


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let unsubscribeUser = null;

let unsubscribeFavorites = null;

let unsubscribeBookmarks = null;

let unsubscribeReviews = null;


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

function getAvatar(name, photo) {

    const image =
        String(photo || "").trim();


    // ถ้ามีรูปที่ผู้ใช้กำหนด
    if (image) {

        return image;

    }


    // ไม่มีรูป → ใช้ชื่อสร้าง Avatar
    return createAvatarFromName(
        name
    );

}


// =====================================================
// ROLE TEXT
// =====================================================

function getRoleText(role) {

    switch (
        String(role || "user")
            .toLowerCase()
    ) {

        case "admin":
            return "Reviewer";

        case "superadmin":
            return "Super Admin";

        default:
            return "User";

    }

}


// =====================================================
// SET PROFILE IMAGE
// =====================================================

function setProfileAvatar(
    name,
    photo
) {

    if (!profileImage) {
        return;
    }


    const avatar =
        getAvatar(
            name,
            photo
        );


    profileImage.onerror =
        null;


    profileImage.src =
        avatar;


    profileImage.alt =
        name || "User";


    profileImage.onerror =
        () => {

            profileImage.onerror =
                null;

            profileImage.src =
                DEFAULT_AVATAR;

        };

}


// =====================================================
// UPDATE PROFILE UI
// =====================================================

function updateProfileUI(data) {

    const name =
        data.name ||
        "User";


    const email =
        data.email ||
        currentUser?.email ||
        "-";


    const role =
        data.role ||
        "user";


    const photo =
        data.photo ||
        data.photoURL ||
        "";


    // =================================================
    // NAME
    // =================================================

    if (displayName) {

        displayName.textContent =
            name;

    }


    if (
        nameInput &&
        document.activeElement !== nameInput
    ) {

        nameInput.value =
            name;

    }


    // =================================================
    // EMAIL
    // =================================================

    if (displayEmail) {

        displayEmail.textContent =
            email;

    }


    // =================================================
    // ROLE
    // =================================================

    if (displayRole) {

        displayRole.textContent =
            getRoleText(
                role
            );

    }


    // =================================================
    // PHOTO
    // =================================================

    if (
        photoInput &&
        document.activeElement !== photoInput
    ) {

        photoInput.value =
            photo;

    }


    // =================================================
    // AVATAR
    // =================================================

    setProfileAvatar(
        name,
        photo
    );

}


// =====================================================
// START COUNT REAL-TIME
// =====================================================

function startCountRealtime() {

    if (!currentUser) {
        return;
    }


    // =================================================
    // FAVORITES
    // =================================================

    unsubscribeFavorites =
        onSnapshot(

            query(
                collection(
                    db,
                    "favorites"
                ),
                where(
                    "uid",
                    "==",
                    currentUser.uid
                )
            ),

            snapshot => {

                if (favoriteCount) {

                    favoriteCount.textContent =
                        snapshot.size;

                }

            },

            error => {

                console.error(
                    "Favorite Count Error:",
                    error
                );

            }

        );


    // =================================================
    // BOOKMARKS
    // =================================================

    unsubscribeBookmarks =
        onSnapshot(

            query(
                collection(
                    db,
                    "bookmarks"
                ),
                where(
                    "uid",
                    "==",
                    currentUser.uid
                )
            ),

            snapshot => {

                if (bookmarkCount) {

                    bookmarkCount.textContent =
                        snapshot.size;

                }

            },

            error => {

                console.error(
                    "Bookmark Count Error:",
                    error
                );

            }

        );


    // =================================================
    // REVIEWS
    // =================================================

    unsubscribeReviews =
        onSnapshot(

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
            ),

            snapshot => {

                if (reviewCount) {

                    reviewCount.textContent =
                        snapshot.size;

                }

            },

            error => {

                console.error(
                    "Review Count Error:",
                    error
                );

            }

        );

}


// =====================================================
// STOP REAL-TIME
// =====================================================

function stopRealtime() {

    if (
        typeof unsubscribeUser ===
        "function"
    ) {

        unsubscribeUser();

        unsubscribeUser =
            null;

    }


    if (
        typeof unsubscribeFavorites ===
        "function"
    ) {

        unsubscribeFavorites();

        unsubscribeFavorites =
            null;

    }


    if (
        typeof unsubscribeBookmarks ===
        "function"
    ) {

        unsubscribeBookmarks();

        unsubscribeBookmarks =
            null;

    }


    if (
        typeof unsubscribeReviews ===
        "function"
    ) {

        unsubscribeReviews();

        unsubscribeReviews =
            null;

    }

}


// =====================================================
// AUTH
// =====================================================

onAuthStateChanged(
    auth,
    user => {

        stopRealtime();


        // =================================================
        // NOT LOGIN
        // =================================================

        if (!user) {

            currentUser =
                null;


            window.location.href =
                "login.html";


            return;

        }


        // =================================================
        // LOGIN
        // =================================================

        currentUser =
            user;


        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        // =================================================
        // USER REAL-TIME
        // =================================================

        unsubscribeUser =
            onSnapshot(

                userRef,

                snapshot => {

                    if (
                        !snapshot.exists()
                    ) {

                        updateProfileUI({

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

                        });

                        return;

                    }


                    const data =
                        snapshot.data();


                    console.log(
                        "PROFILE REALTIME:",
                        data
                    );


                    updateProfileUI(
                        data
                    );

                },

                error => {

                    console.error(
                        "Profile Realtime Error:",
                        error
                    );

                }

            );


        startCountRealtime();

    }
);


// =====================================================
// NAME PREVIEW
// =====================================================

if (nameInput) {

    nameInput.addEventListener(
        "input",
        () => {

            const name =
                nameInput.value.trim() ||
                "User";


            if (displayName) {

                displayName.textContent =
                    name;

            }


            const photo =
                photoInput
                    ? photoInput.value.trim()
                    : "";


            setProfileAvatar(
                name,
                photo
            );

        }
    );

}


// =====================================================
// PHOTO PREVIEW
// =====================================================

if (photoInput) {

    photoInput.addEventListener(
        "input",
        () => {

            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "User";


            const photo =
                photoInput.value.trim();


            setProfileAvatar(
                name,
                photo
            );

        }
    );

}


// =====================================================
// SAVE PROFILE
// =====================================================

if (saveProfile) {

    saveProfile.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                alert(
                    "กรุณาเข้าสู่ระบบก่อน"
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

                if (nameInput) {

                    nameInput.focus();

                }

                return;

            }


            // =================================================
            // CHECK PHOTO URL
            // =================================================

            if (
                photo &&
                !/^https?:\/\//i.test(photo)
            ) {

                alert(
                    "URL รูปภาพต้องขึ้นต้นด้วย http:// หรือ https://"
                );

                if (photoInput) {

                    photoInput.focus();

                }

                return;

            }


            saveProfile.disabled =
                true;


            saveProfile.textContent =
                "กำลังบันทึก...";


            try {

                // =================================================
                // SAVE NAME + PHOTO
                // =================================================

                await updateDoc(

                    doc(
                        db,
                        "users",
                        currentUser.uid
                    ),

                    {
                        name:
                            name,

                        photo:
                            photo
                    }

                );


                // =================================================
                // UPDATE CURRENT UI
                // =================================================

                updateProfileUI({

                    name:
                        name,

                    email:
                        currentUser.email ||
                        "",

                    role:
                        displayRole?.textContent ||
                        "User",

                    photo:
                        photo

                });


                alert(
                    "บันทึกโปรไฟล์สำเร็จ"
                );

            }

            catch (error) {

                console.error(
                    "SAVE PROFILE ERROR:",
                    error
                );


                alert(
                    "บันทึกโปรไฟล์ไม่สำเร็จ\n\n" +
                    error.message
                );

            }

            finally {

                saveProfile.disabled =
                    false;

                saveProfile.textContent =
                    "บันทึกโปรไฟล์";

            }

        }
    );

}


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
                    "login.html";

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