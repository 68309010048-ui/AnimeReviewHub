// =====================================================
// Anime Review Hub
// detail.js
// REAL-TIME DETAIL + REVIEW + FAVORITE + BOOKMARK
// =====================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// Anime ID
// =====================================================

const animeId = localStorage.getItem("animeId");

if (!animeId) {
    window.location.href = "../index.html";
}


// =====================================================
// Elements
// =====================================================

const poster =
    document.getElementById("poster");

const banner =
    document.getElementById("banner");

const title =
    document.getElementById("title");

const description =
    document.getElementById("description");

const episodes =
    document.getElementById("episodes");

const status =
    document.getElementById("status");

const type =
    document.getElementById("type");

const category =
    document.getElementById("category");

const genre =
    document.getElementById("genre");

const trailerBox =
    document.getElementById("trailerBox");

const reviewList =
    document.getElementById("reviewList");

const usernameInput =
    document.getElementById("username");

const commentInput =
    document.getElementById("comment");

const submitReview =
    document.getElementById("submitReview");

const starRating =
    document.getElementById("starRating");

const favoriteBtn =
    document.getElementById("favoriteBtn");

const bookmarkBtn =
    document.getElementById("bookmarkBtn");

const shareBtn =
    document.getElementById("shareBtn");

const userScore =
    document.getElementById("userScore");

const reviewCount =
    document.getElementById("reviewCount");

const toast =
    document.getElementById("toast");

// Profile ที่อยู่บน Header / Navbar
const userAvatar =
    document.getElementById("userAvatar");

const usernameText =
    document.getElementById("usernameText");


// =====================================================
// Variables
// =====================================================

let currentAnime = null;

let currentUser = null;

let currentUserData = {};

let reviewData = [];

// =====================================================
// คะแนนเดิม 10 คะแนน ห้ามเปลี่ยน
// =====================================================

let selectedRating = 10;

let currentReviewId = null;

let favoriteDocId = null;

let bookmarkDocId = null;

let unsubscribeAnime = null;

let unsubscribeReviews = null;

let unsubscribeUser = null;

let unsubscribeFavorite = null;

let unsubscribeBookmark = null;

let reviewInputDirty = false;


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        cleanupUserListeners();

        currentUser = user;

        if (!user) {

            setupLoggedOutState();

            return;
        }

        setupLoggedInState(user);
    }
);


// =====================================================
// LOGIN STATE
// =====================================================

function setupLoggedInState(user) {

    // ===============================================
    // User Profile REALTIME
    // ===============================================

    const userRef = doc(
        db,
        "users",
        user.uid
    );

    unsubscribeUser = onSnapshot(
        userRef,
        (snap) => {

            currentUserData =
                snap.exists()
                    ? snap.data()
                    : {};

            updateUsername();

            // อัปเดตรูป Profile บนหน้า Detail
            updateDetailProfile();
        },
        (error) => {

            console.error(
                "User profile realtime error:",
                error
            );
        }
    );


    // ===============================================
    // Favorite
    // ===============================================

    if (favoriteBtn) {

        const q = query(
            collection(
                db,
                "favorites"
            ),
            where(
                "uid",
                "==",
                user.uid
            ),
            where(
                "animeId",
                "==",
                animeId
            )
        );

        unsubscribeFavorite =
            onSnapshot(
                q,
                (snap) => {

                    favoriteDocId =
                        snap.empty
                            ? null
                            : snap.docs[0].id;

                    updateFavoriteButton(
                        !snap.empty
                    );
                },
                (error) => {

                    console.error(
                        "Favorite realtime error:",
                        error
                    );
                }
            );
    }


    // ===============================================
    // Bookmark
    // ===============================================

    if (bookmarkBtn) {

        const q = query(
            collection(
                db,
                "bookmarks"
            ),
            where(
                "uid",
                "==",
                user.uid
            ),
            where(
                "animeId",
                "==",
                animeId
            )
        );

        unsubscribeBookmark =
            onSnapshot(
                q,
                (snap) => {

                    bookmarkDocId =
                        snap.empty
                            ? null
                            : snap.docs[0].id;

                    updateBookmarkButton(
                        !snap.empty
                    );
                },
                (error) => {

                    console.error(
                        "Bookmark realtime error:",
                        error
                    );
                }
            );
    }


    updateUsername();

    updateDetailProfile();

    setupReviewForm();
}


// =====================================================
// LOGGED OUT
// =====================================================

function setupLoggedOutState() {

    if (usernameInput) {

        usernameInput.value = "";

        usernameInput.placeholder =
            "กรุณาเข้าสู่ระบบ";

        usernameInput.readOnly = true;
    }


    if (submitReview) {

        submitReview.disabled = true;

        submitReview.textContent =
            "เข้าสู่ระบบก่อนรีวิว";
    }


    updateFavoriteButton(false);

    updateBookmarkButton(false);


    // ล้าง Profile บน Detail
    if (usernameText) {

        usernameText.textContent =
            "Guest";
    }
}


// =====================================================
// USERNAME REALTIME
// =====================================================

function updateUsername() {

    if (!usernameInput) {
        return;
    }


    const name =
        currentUserData.name ||
        currentUser?.displayName ||
        currentUser?.email ||
        "User";


    usernameInput.value =
        name;

    usernameInput.readOnly =
        true;
}


// =====================================================
// UPDATE DETAIL PROFILE
// =====================================================

function updateDetailProfile() {

    if (!currentUser) {
        return;
    }


    const name =
        currentUserData.name ||
        currentUser.displayName ||
        currentUser.email ||
        "User";


    const photo =
        currentUserData.photo ||
        currentUserData.photoURL ||
        currentUser.photoURL ||
        "";


    // ===============================================
    // Username บน Header
    // ===============================================

    if (usernameText) {

        usernameText.textContent =
            name;
    }


    // ===============================================
    // Avatar บน Header
    // ===============================================

    if (userAvatar) {

        setProfileImage(
            userAvatar,
            name,
            photo
        );
    }
}


// =====================================================
// PROFILE IMAGE
// =====================================================

function setProfileImage(
    element,
    name,
    photo
) {

    if (!element) {
        return;
    }


    if (photo) {

        element.src =
            photo;

        element.onerror =
            () => {

                element.src =
                    createInitialAvatar(
                        name
                    );
            };

    }
    else {

        element.src =
            createInitialAvatar(
                name
            );
    }


    element.alt =
        name;
}


// =====================================================
// INITIAL AVATAR
// =====================================================

function createInitialAvatar(name) {

    const cleanName =
        String(
            name || "User"
        ).trim();


    const parts =
        cleanName
            .split(/\s+/)
            .filter(Boolean);


    let initials = "";


    if (parts.length >= 2) {

        initials =
            parts[0].charAt(0) +
            parts[1].charAt(0);

    }
    else {

        initials =
            cleanName.substring(
                0,
                2
            );
    }


    initials =
        initials.toUpperCase();


    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            viewBox="0 0 200 200"
        >

            <rect
                width="200"
                height="200"
                rx="100"
                fill="#6d28d9"
            />

            <text
                x="100"
                y="100"
                dominant-baseline="middle"
                text-anchor="middle"
                fill="white"
                font-size="70"
                font-family="Arial"
                font-weight="bold"
            >
                ${escapeXML(initials)}
            </text>

        </svg>
    `;


    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );
}


// =====================================================
// LOAD ANIME REALTIME
// =====================================================

function startAnimeRealtime() {

    unsubscribeAnime =
        onSnapshot(
            doc(
                db,
                "anime",
                animeId
            ),
            (snap) => {

                if (!snap.exists()) {

                    alert(
                        "Anime นี้ถูกลบแล้ว"
                    );

                    window.location.href =
                        "../index.html";

                    return;
                }


                currentAnime = {

                    id:
                        snap.id,

                    ...snap.data()
                };


                showAnime(
                    currentAnime
                );
            },
            (error) => {

                console.error(
                    "Anime realtime error:",
                    error
                );
            }
        );
}


// =====================================================
// SHOW ANIME
// =====================================================

function showAnime(anime) {

    const image =
        anime.image ||
        anime.imageURL ||
        "";


    if (poster) {

        poster.src =
            image;

        poster.onerror =
            () => {

                poster.src =
                    "https://placehold.co/600x800?text=No+Image";
            };
    }


    if (banner) {

        banner.style.backgroundImage = `
            linear-gradient(
                rgba(0,0,0,.45),
                rgba(0,0,0,.45)
            ),
            url("${image}")
        `;
    }


    if (title) {

        title.textContent =
            anime.title ||
            "ไม่มีชื่อ";
    }


    if (description) {

        description.textContent =
            anime.description ||
            "-";
    }


    if (episodes) {

        episodes.textContent =
            anime.episodes ??
            "-";
    }


    if (status) {

        status.textContent =
            anime.status ||
            "-";
    }


    if (type) {

        type.textContent =
            anime.type ||
            "-";
    }


    renderCategories(
        anime.category
    );


    // ==============================================
    // Trailer
    // ==============================================

    if (trailerBox) {

        if (anime.trailer) {

            trailerBox.innerHTML = `
                <iframe
                    src="${escapeAttribute(
                        anime.trailer
                    )}"
                    allowfullscreen
                ></iframe>
            `;

        }
        else {

            trailerBox.innerHTML = `
                <div class="no-trailer">

                    <i class="fa-solid fa-video-slash"></i>

                    <p>
                        ยังไม่มีตัวอย่างอนิเมะ
                    </p>

                </div>
            `;
        }
    }
}


// =====================================================
// CATEGORIES
// =====================================================

function renderCategories(value) {

    const categories =
        normalizeCategories(
            value
        );


    const target =
        category ||
        genre;


    if (!target) {
        return;
    }


    target.innerHTML =
        categories.length
            ? categories
                .map(
                    item => `
                        <span>
                            ${escapeHTML(
                                item
                            )}
                        </span>
                    `
                )
                .join("")
            : "<span>Anime</span>";
}


// =====================================================
// NORMALIZE CATEGORIES
// =====================================================

function normalizeCategories(value) {

    if (Array.isArray(value)) {

        return value
            .map(
                item =>
                    String(item).trim()
            )
            .filter(Boolean);
    }


    if (typeof value === "string") {

        return value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);
    }


    return [];
}


// =====================================================
// REVIEWS REALTIME
// =====================================================

function startReviewsRealtime() {

    const q =
        query(
            collection(
                db,
                "reviews"
            ),
            where(
                "animeId",
                "==",
                animeId
            )
        );


    unsubscribeReviews =
        onSnapshot(
            q,
            (snapshot) => {

                reviewData =
                    snapshot.docs.map(
                        docSnap => ({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        })
                    );


                renderReviews();

                updateAverageReview();

                loadCurrentUserReview();
            },

            (error) => {

                console.error(
                    "Review realtime error:",
                    error
                );
            }
        );
}


// =====================================================
// LOAD CURRENT USER REVIEW
// =====================================================

function loadCurrentUserReview() {

    if (!currentUser) {
        return;
    }


    const myReview =
        reviewData.find(
            review =>
                review.uid ===
                currentUser.uid
        );


    if (!myReview) {

        currentReviewId =
            null;


        if (!reviewInputDirty) {

            if (commentInput) {

                commentInput.value =
                    "";
            }


            selectedRating =
                10;


            updateStars();
        }


        if (submitReview) {

            submitReview.disabled =
                false;

            submitReview.textContent =
                "ส่งรีวิว";
        }


        return;
    }


    currentReviewId =
        myReview.id;


    if (!reviewInputDirty) {

        if (commentInput) {

            commentInput.value =
                myReview.comment ||
                "";
        }


        selectedRating =
            Number(
                myReview.rating ||
                10
            );


        updateStars();
    }


    if (submitReview) {

        submitReview.disabled =
            false;

        submitReview.textContent =
            "อัปเดตรีวิว";
    }
}


// =====================================================
// RENDER REVIEWS
// =====================================================

function renderReviews() {

    if (!reviewList) {
        return;
    }


    reviewList.innerHTML =
        "";


    if (
        reviewData.length ===
        0
    ) {

        reviewList.innerHTML = `
            <div class="review-card empty-review">

                <p>
                    ยังไม่มีรีวิว
                </p>

            </div>
        `;

        return;
    }


    reviewData
        .sort(
            (a, b) => {

                const aTime =
                    a.createdAt?.seconds ||
                    0;


                const bTime =
                    b.createdAt?.seconds ||
                    0;


                return bTime - aTime;
            }
        )
        .forEach(
            review => {

                // ===================================
                // Avatar
                // ===================================

                const avatar =
                    review.photoURL ||
                    review.photo ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                        review.username ||
                        "User"
                    )}`;


                // ===================================
                // Delete Permission
                // ===================================

                const canDelete =
                    currentUser &&
                    review.uid ===
                        currentUser.uid;


                // ===================================
                // Rating
                // ยังคง 10 ดาวเหมือนเดิม
                // ===================================

                const rating =
                    Number(
                        review.rating ||
                        0
                    );


                const stars =
                    createStars(
                        rating
                    );


                // ===================================
                // Date
                // ===================================

                const dateText =
                    formatDate(
                        review.createdAt
                    );


                // ===================================
                // Render
                // ===================================

                reviewList.innerHTML += `
                    <div class="review-card">

                        <div class="review-top">

                            <div class="review-user">

                                <img
                                    class="avatar"
                                    src="${escapeAttribute(
                                        avatar
                                    )}"
                                    alt="${escapeAttribute(
                                        review.username ||
                                        "User"
                                    )}"
                                >

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            review.username ||
                                            "User"
                                        )}
                                    </strong>

                                    <div class="review-stars">

                                        ${stars}

                                        <span>
                                            (${rating}/10)
                                        </span>

                                    </div>

                                </div>

                            </div>


                            <div class="review-date">

                                ${escapeHTML(
                                    dateText
                                )}

                            </div>

                        </div>


                        <p class="review-comment">

                            ${escapeHTML(
                                review.comment ||
                                ""
                            )}

                        </p>


                        ${
                            canDelete
                                ? `
                                    <button
                                        class="delete-btn"
                                        data-review-id="${escapeAttribute(
                                            review.id
                                        )}"
                                    >
                                        🗑 ลบรีวิว
                                    </button>
                                `
                                : ""
                        }

                    </div>
                `;
            }
        );


    // ==============================================
    // Delete buttons
    // ==============================================

    reviewList
        .querySelectorAll(
            ".delete-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteReview(
                            button.dataset.reviewId
                        );
                    }
                );
            }
        );
}


// =====================================================
// ADD / UPDATE REVIEW
// =====================================================

function setupReviewForm() {

    if (!submitReview) {
        return;
    }


    submitReview.disabled =
        false;


    submitReview.textContent =
        currentReviewId
            ? "อัปเดตรีวิว"
            : "ส่งรีวิว";


    submitReview.onclick =
        saveReview;


    if (
        commentInput &&
        !commentInput.dataset.listenerAdded
    ) {

        commentInput.addEventListener(
            "input",
            () => {

                reviewInputDirty =
                    true;
            }
        );


        commentInput.dataset.listenerAdded =
            "true";
    }
}


// =====================================================
// SAVE REVIEW
// =====================================================

async function saveReview() {

    if (!currentUser) {

        showToast(
            "กรุณาเข้าสู่ระบบก่อนรีวิว"
        );

        return;
    }


    const text =
        commentInput
            ? commentInput.value.trim()
            : "";


    if (!text) {

        showToast(
            "กรุณาเขียนรีวิว"
        );

        return;
    }


    try {

        if (submitReview) {

            submitReview.disabled =
                true;

            submitReview.textContent =
                "กำลังบันทึก...";
        }


        const userData =
            currentUserData || {};


        const data = {

            animeId,

            uid:
                currentUser.uid,

            username:
                userData.name ||
                currentUser.displayName ||
                currentUser.email ||
                "User",

            email:
                userData.email ||
                currentUser.email ||
                "",

            photoURL:
                userData.photo ||
                userData.photoURL ||
                currentUser.photoURL ||
                "",

            // ======================================
            // คะแนนเดิม 1-10
            // ======================================

            rating:
                Number(
                    selectedRating
                ),

            comment:
                text,

            createdAt:
                serverTimestamp()
        };


        if (currentReviewId) {

            await updateDoc(
                doc(
                    db,
                    "reviews",
                    currentReviewId
                ),
                data
            );


            showToast(
                "อัปเดตรีวิวสำเร็จ"
            );

        }
        else {

            await addDoc(
                collection(
                    db,
                    "reviews"
                ),
                data
            );


            showToast(
                "ส่งรีวิวสำเร็จ"
            );
        }


        reviewInputDirty =
            false;


        if (commentInput) {

            commentInput.value =
                "";
        }


        selectedRating =
            10;


        updateStars();
    }
    catch (error) {

        console.error(
            "Save Review Error:",
            error
        );


        showToast(
            "บันทึกรีวิวไม่สำเร็จ"
        );
    }
    finally {

        if (submitReview) {

            submitReview.disabled =
                false;

            submitReview.textContent =
                currentReviewId
                    ? "อัปเดตรีวิว"
                    : "ส่งรีวิว";
        }
    }
}


// =====================================================
// DELETE REVIEW
// =====================================================

async function deleteReview(id) {

    if (!currentUser) {
        return;
    }


    const target =
        reviewData.find(
            review =>
                review.id === id
        );


    if (
        !target ||
        target.uid !==
            currentUser.uid
    ) {

        showToast(
            "ไม่สามารถลบรีวิวนี้ได้"
        );

        return;
    }


    if (
        !confirm(
            "ต้องการลบรีวิวนี้ใช่หรือไม่?"
        )
    ) {

        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "reviews",
                id
            )
        );


        if (
            currentReviewId ===
            id
        ) {

            currentReviewId =
                null;

            reviewInputDirty =
                false;


            if (commentInput) {

                commentInput.value =
                    "";
            }


            selectedRating =
                10;


            updateStars();
        }


        showToast(
            "ลบรีวิวเรียบร้อย"
        );
    }
    catch (error) {

        console.error(
            "Delete Review Error:",
            error
        );


        showToast(
            "ลบรีวิวไม่สำเร็จ"
        );
    }
}


// =====================================================
// AVERAGE
// =====================================================

function updateAverageReview() {

    if (
        !userScore &&
        !reviewCount
    ) {

        return;
    }


    if (
        reviewData.length ===
        0
    ) {

        if (userScore) {

            userScore.textContent =
                "0.0";
        }


        if (reviewCount) {

            reviewCount.textContent =
                "0 รีวิว";
        }


        return;
    }


    const total =
        reviewData.reduce(
            (
                sum,
                review
            ) => {

                return (
                    sum +
                    Number(
                        review.rating ||
                        0
                    )
                );
            },
            0
        );


    const avg =
        total /
        reviewData.length;


    if (userScore) {

        userScore.textContent =
            avg.toFixed(1);
    }


    if (reviewCount) {

        reviewCount.textContent =
            `${reviewData.length} รีวิว`;
    }
}


// =====================================================
// STARS
// คะแนนเดิม 10 ดาว
// =====================================================

function createStarUI() {

    if (!starRating) {
        return;
    }


    starRating.innerHTML =
        "";


    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        const star =
            document.createElement(
                "i"
            );


        star.className =
            "fa-solid fa-star";


        star.dataset.rate =
            String(i);


        star.addEventListener(
            "click",
            () => {

                selectedRating =
                    Number(
                        star.dataset.rate
                    );


                reviewInputDirty =
                    true;


                updateStars();
            }
        );


        starRating.appendChild(
            star
        );
    }


    updateStars();
}


// =====================================================
// UPDATE STARS
// =====================================================

function updateStars() {

    if (!starRating) {
        return;
    }


    starRating
        .querySelectorAll("i")
        .forEach(
            star => {

                const rate =
                    Number(
                        star.dataset.rate
                    );


                star.classList.toggle(
                    "active-star",
                    rate <=
                        selectedRating
                );
            }
        );
}


// =====================================================
// CREATE STARS
// คะแนนเดิม 10 ดาว
// =====================================================

function createStars(rating) {

    let html =
        "";


    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        html +=
            i <= rating
                ? '<i class="fa-solid fa-star active"></i>'
                : '<i class="fa-regular fa-star"></i>';
    }


    return html;
}


// =====================================================
// FAVORITE
// =====================================================

if (favoriteBtn) {

    favoriteBtn.addEventListener(
        "click",
        toggleFavorite
    );
}


async function toggleFavorite() {

    if (!currentUser) {

        showToast(
            "กรุณาเข้าสู่ระบบ"
        );

        return;
    }


    try {

        if (favoriteDocId) {

            await deleteDoc(
                doc(
                    db,
                    "favorites",
                    favoriteDocId
                )
            );

        }
        else {

            await addDoc(
                collection(
                    db,
                    "favorites"
                ),
                {

                    uid:
                        currentUser.uid,

                    animeId,

                    createdAt:
                        serverTimestamp()
                }
            );
        }

    }
    catch (error) {

        console.error(
            "Favorite Error:",
            error
        );


        showToast(
            "ไม่สามารถแก้ไข Favorite ได้"
        );
    }
}


// =====================================================
// FAVORITE BUTTON
// =====================================================

function updateFavoriteButton(active) {

    if (!favoriteBtn) {
        return;
    }


    favoriteBtn.innerHTML =
        active
            ? "❤️ โปรดแล้ว"
            : "♡ Favorite";
}


// =====================================================
// BOOKMARK
// =====================================================

if (bookmarkBtn) {

    bookmarkBtn.addEventListener(
        "click",
        toggleBookmark
    );
}


async function toggleBookmark() {

    if (!currentUser) {

        showToast(
            "กรุณาเข้าสู่ระบบ"
        );

        return;
    }


    try {

        if (bookmarkDocId) {

            await deleteDoc(
                doc(
                    db,
                    "bookmarks",
                    bookmarkDocId
                )
            );

        }
        else {

            await addDoc(
                collection(
                    db,
                    "bookmarks"
                ),
                {

                    uid:
                        currentUser.uid,

                    animeId,

                    createdAt:
                        serverTimestamp()
                }
            );
        }

    }
    catch (error) {

        console.error(
            "Bookmark Error:",
            error
        );


        showToast(
            "ไม่สามารถแก้ไข Bookmark ได้"
        );
    }
}


// =====================================================
// BOOKMARK BUTTON
// =====================================================

function updateBookmarkButton(active) {

    if (!bookmarkBtn) {
        return;
    }


    bookmarkBtn.innerHTML =
        active
            ? "🔖 บันทึกแล้ว"
            : "🔖 Bookmark";
}


// =====================================================
// SHARE
// =====================================================

if (shareBtn) {

    shareBtn.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    window.location.href
                );


                showToast(
                    "คัดลอกลิงก์แล้ว"
                );

            }
            catch (error) {

                console.error(
                    error
                );


                showToast(
                    "ไม่สามารถคัดลอกลิงก์ได้"
                );
            }
        }
    );
}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

    if (!toast) {

        alert(message);

        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );
}


// =====================================================
// DATE
// =====================================================

function formatDate(timestamp) {

    if (
        !timestamp ||
        !timestamp.toDate
    ) {

        return "";
    }


    return timestamp
        .toDate()
        .toLocaleDateString(
            "th-TH",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(value) {

    return escapeHTML(
        value
    );
}


// =====================================================
// ESCAPE XML
// =====================================================

function escapeXML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&apos;"
        );
}


// =====================================================
// CLEANUP
// =====================================================

function cleanupUserListeners() {

    if (unsubscribeUser) {

        unsubscribeUser();

        unsubscribeUser = null;
    }


    if (unsubscribeFavorite) {

        unsubscribeFavorite();

        unsubscribeFavorite = null;
    }


    if (unsubscribeBookmark) {

        unsubscribeBookmark();

        unsubscribeBookmark = null;
    }
}


// =====================================================
// START
// =====================================================

startAnimeRealtime();

startReviewsRealtime();

createStarUI();