// ======================================================
// Anime Review Hub
// profile.js
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
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

const saveBtn =
    document.getElementById("saveProfile");

const logoutBtn =
    document.getElementById("logoutBtn");

const favoriteCount =
    document.getElementById("favoriteCount");

const bookmarkCount =
    document.getElementById("bookmarkCount");

const reviewCount =
    document.getElementById("reviewCount");

const toast =
    document.getElementById("toast");


// ======================================================
// Current User
// ======================================================

let currentUser = null;


// ======================================================
// Authentication
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "../login.html";

        return;

    }

    currentUser = user;

    await loadProfile();

    await loadStatistics();

});


// ======================================================
// Load Profile
// ======================================================

async function loadProfile() {

    try {

        const userRef =
            doc(db, "users", currentUser.uid);

        const snap =
            await getDoc(userRef);

        let data = {};

        if (snap.exists()) {

            data = snap.data();

        }

        const name =
            data.name ||
            currentUser.displayName ||
            "User";

        const email =
            data.email ||
            currentUser.email ||
            "";

        const photo =
            data.photo ||
            data.photoURL ||
            currentUser.photoURL ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

        const role =
            data.role ||
            "user";


        displayName.textContent = name;

        displayEmail.textContent = email;

        displayRole.textContent = role;

        profileImage.src = photo;

        nameInput.value = name;

        photoInput.value =
            data.photo ||
            data.photoURL ||
            currentUser.photoURL ||
            "";

    }

    catch (error) {

        console.error(
            "Profile Error:",
            error
        );

        showToast(
            "โหลดโปรไฟล์ไม่สำเร็จ"
        );

    }

}


// ======================================================
// Statistics
// ======================================================

async function loadStatistics() {

    try {

        const [
            favoriteSnap,
            bookmarkSnap,
            reviewSnap
        ] = await Promise.all([

            getDocs(

                query(
                    collection(db, "favorites"),
                    where(
                        "uid",
                        "==",
                        currentUser.uid
                    )
                )

            ),

            getDocs(

                query(
                    collection(db, "bookmarks"),
                    where(
                        "uid",
                        "==",
                        currentUser.uid
                    )
                )

            ),

            getDocs(

                query(
                    collection(db, "reviews"),
                    where(
                        "uid",
                        "==",
                        currentUser.uid
                    )
                )

            )

        ]);


        favoriteCount.textContent =
            favoriteSnap.size;

        bookmarkCount.textContent =
            bookmarkSnap.size;

        reviewCount.textContent =
            reviewSnap.size;

    }

    catch (error) {

        console.error(
            "Statistics Error:",
            error
        );

    }

}


// ======================================================
// Save Profile
// ======================================================

saveBtn.addEventListener("click", async () => {

    if (!currentUser) return;

    const name =
        nameInput.value.trim();

    const photo =
        photoInput.value.trim();


    if (!name) {

        showToast(
            "กรุณากรอกชื่อผู้ใช้"
        );

        return;

    }


    saveBtn.disabled = true;

    saveBtn.textContent =
        "กำลังบันทึก...";


    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        await updateDoc(
            userRef,
            {
                name,
                photo
            }
        );


        const image =
            photo ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;


        displayName.textContent =
            name;

        profileImage.src =
            image;


        showToast(
            "บันทึกข้อมูลสำเร็จ"
        );

    }

    catch (error) {

        console.error(
            "Save Profile Error:",
            error
        );

        showToast(
            "บันทึกข้อมูลไม่สำเร็จ"
        );

    }

    finally {

        saveBtn.disabled = false;

        saveBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูล';

    }

});


// ======================================================
// Logout
// ======================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            location.href =
                "../login.html";

        }

        catch (error) {

            console.error(error);

            showToast(
                "ออกจากระบบไม่สำเร็จ"
            );

        }

    }
);


// ======================================================
// Toast
// ======================================================

function showToast(message) {

    if (!toast) return;

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        window.profileToastTimer
    );

    window.profileToastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

}