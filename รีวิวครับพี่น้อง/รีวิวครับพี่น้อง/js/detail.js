// =====================================================
// Anime Review Hub
// detail.js V2.1
// =====================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
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
// Variables
// =====================================================

let currentAnime = null;
let currentUser = null;
let currentReviewId = null;
let selectedRating = 10;
let reviewData = [];


// =====================================================
// Elements
// =====================================================

const poster = document.getElementById("poster");
const banner = document.getElementById("banner");
const title = document.getElementById("title");
const description = document.getElementById("description");
const episodes = document.getElementById("episodes");
const status = document.getElementById("status");
const type = document.getElementById("type");
const category = document.getElementById("category");
const trailerBox = document.getElementById("trailerBox");

const reviewList = document.getElementById("reviewList");
const username = document.getElementById("username");
const comment = document.getElementById("comment");
const submitReview = document.getElementById("submitReview");
const starBox = document.getElementById("starRating");

const favoriteBtn = document.getElementById("favoriteBtn");
const bookmarkBtn = document.getElementById("bookmarkBtn");
const shareBtn = document.getElementById("shareBtn");
const darkBtn = document.getElementById("darkBtn");

const userScore = document.getElementById("userScore");
const reviewCount = document.getElementById("reviewCount");
const toast = document.getElementById("toast");


// =====================================================
// Authentication
// =====================================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (!user) {

        if (submitReview) {
            submitReview.disabled = true;
            submitReview.textContent = "เข้าสู่ระบบก่อนรีวิว";
        }

        if (username) {
            username.value = "";
            username.placeholder = "กรุณาเข้าสู่ระบบ";
            username.readOnly = false;
        }

        updateFavoriteButton(false);
        updateBookmarkButton(false);

        return;
    }

    if (submitReview) {
        submitReview.disabled = false;
        submitReview.textContent = "ส่งรีวิว";
    }

    await loadUser(user);
    await loadFavoriteBookmark();
});


// =====================================================
// Load User
// =====================================================

async function loadUser(user) {

    try {

        const userSnap = await getDoc(
            doc(db, "users", user.uid)
        );

        if (userSnap.exists()) {

            const data = userSnap.data();

            if (username) {
                username.value = data.name || "User";
                username.readOnly = true;
            }

        }
        else {

            if (username) {
                username.value = user.displayName || "User";
                username.readOnly = true;
            }

        }

        // ตรวจสอบรีวิวของผู้ใช้คนนี้
        const reviewQuery = query(
            collection(db, "reviews"),
            where("animeId", "==", animeId),
            where("uid", "==", user.uid)
        );

        const reviewSnap = await getDocs(reviewQuery);

        if (!reviewSnap.empty) {

            const reviewDoc = reviewSnap.docs[0];

            currentReviewId = reviewDoc.id;

            const data = reviewDoc.data();

            if (comment) {
                comment.value = data.comment || "";
            }

            setRating(data.rating);

            if (submitReview) {
                submitReview.textContent = "อัปเดตรีวิว";
            }

        }

    }
    catch (error) {

        console.error("Load User Error:", error);

    }

}


// =====================================================
// Load Anime
// =====================================================

async function loadAnime() {

    try {

        const animeSnap = await getDoc(
            doc(db, "anime", animeId)
        );

        if (!animeSnap.exists()) {

            alert("ไม่พบข้อมูลอนิเมะ");

            window.location.href = "../index.html";

            return;

        }

        currentAnime = {
            id: animeSnap.id,
            ...animeSnap.data()
        };

        showAnime(currentAnime);

    }
    catch (error) {

        console.error("Load Anime Error:", error);

        showToast("โหลดข้อมูลอนิเมะไม่สำเร็จ");

    }

}


// =====================================================
// Show Anime
// =====================================================

function showAnime(anime) {

    // Poster
    if (poster) {

        poster.src = anime.image || "";
        poster.alt = anime.title || "Anime";

    }

    // Banner
    if (banner) {

        banner.style.backgroundImage =
            `linear-gradient(
                rgba(0,0,0,.45),
                rgba(0,0,0,.55)
            ),
            url("${anime.image || ""}")`;

    }

    // Text
    if (title) {
        title.textContent = anime.title || "-";
    }

    if (description) {
        description.textContent = anime.description || "-";
    }

    if (episodes) {
        episodes.textContent = anime.episodes || "-";
    }

    if (status) {
        status.textContent = anime.status || "-";
    }

    if (type) {
        type.textContent = anime.type || "-";
    }


    // Category
    renderCategories(anime.category);

    // Trailer
    loadTrailer(anime.trailer);

}


// =====================================================
// Category
// =====================================================

function renderCategories(data) {

    if (!category) return;

    category.innerHTML = "";

    const categories = Array.isArray(data)
        ? data
        : data
            ? [data]
            : [];

    if (categories.length === 0) {

        category.innerHTML = `
            <span>-</span>
        `;

        return;
    }

    categories.forEach(item => {

        const span = document.createElement("span");

        span.textContent = item;

        category.appendChild(span);

    });

}


// =====================================================
// Trailer
// =====================================================

function loadTrailer(url) {

    if (!trailerBox) return;

    if (!url) {

        trailerBox.innerHTML = `
            <div class="no-trailer">

                <i class="fa-solid fa-video-slash"></i>

                <p>ยังไม่มีตัวอย่างอนิเมะ</p>

            </div>
        `;

        return;
    }

    let embedUrl = url.trim();

    if (embedUrl.includes("watch?v=")) {

        const id = embedUrl
            .split("watch?v=")[1]
            .split("&")[0];

        embedUrl =
            `https://www.youtube.com/embed/${id}`;

    }
    else if (embedUrl.includes("youtu.be/")) {

        const id = embedUrl
            .split("youtu.be/")[1]
            .split("?")[0];

        embedUrl =
            `https://www.youtube.com/embed/${id}`;

    }

    trailerBox.innerHTML = `
        <iframe
            src="${embedUrl}"
            title="Anime Trailer"
            loading="lazy"
            frameborder="0"
            allowfullscreen>
        </iframe>
    `;

}


// =====================================================
// FAVORITE - FIRESTORE
// =====================================================

if (favoriteBtn) {

    favoriteBtn.addEventListener(
        "click",
        toggleFavorite
    );

}


async function toggleFavorite() {

    if (!currentUser) {

        showToast("กรุณาเข้าสู่ระบบก่อน");

        return;

    }

    if (!currentAnime) {

        showToast("ข้อมูลอนิเมะยังโหลดไม่เสร็จ");

        return;

    }

    try {

        const q = query(

            collection(db, "favorites"),

            where("uid", "==", currentUser.uid),

            where("animeId", "==", animeId)

        );

        const snap = await getDocs(q);


        // มีอยู่แล้ว → ลบ
        if (!snap.empty) {

            for (const item of snap.docs) {

                await deleteDoc(
                    doc(db, "favorites", item.id)
                );

            }

            updateFavoriteButton(false);

            showToast(
                "💔 นำออกจาก Favorite แล้ว"
            );

        }

        // ยังไม่มี → เพิ่ม
        else {

            await addDoc(

                collection(db, "favorites"),

                {
                    uid: currentUser.uid,

                    animeId: animeId,

                    title:
                        currentAnime.title || "",

                    image:
                        currentAnime.image || "",

                    category:
                        Array.isArray(currentAnime.category)
                            ? currentAnime.category
                            : currentAnime.category
                                ? [currentAnime.category]
                                : [],

                    score: 0,

                    createdAt:
                        serverTimestamp()
                }

            );

            updateFavoriteButton(true);

            showToast(
                "❤️ เพิ่ม Favorite แล้ว"
            );

        }

    }
    catch (error) {

        console.error(
            "Favorite Error:",
            error
        );

        showToast(
            "ไม่สามารถบันทึก Favorite ได้"
        );

    }

}


// =====================================================
// Update Favorite Button
// =====================================================

function updateFavoriteButton(active) {

    if (!favoriteBtn) return;

    if (active) {

        favoriteBtn.innerHTML =
            "❤️ Favorited";

        favoriteBtn.classList.add("active");

    }
    else {

        favoriteBtn.innerHTML =
            "🤍 Favorite";

        favoriteBtn.classList.remove("active");

    }

}


// =====================================================
// BOOKMARK - FIRESTORE
// =====================================================

if (bookmarkBtn) {

    bookmarkBtn.addEventListener(
        "click",
        toggleBookmark
    );

}


async function toggleBookmark() {

    if (!currentUser) {

        showToast("กรุณาเข้าสู่ระบบก่อน");

        return;

    }

    if (!currentAnime) {

        showToast("ข้อมูลอนิเมะยังโหลดไม่เสร็จ");

        return;

    }

    try {

        const q = query(

            collection(db, "bookmarks"),

            where("uid", "==", currentUser.uid),

            where("animeId", "==", animeId)

        );

        const snap = await getDocs(q);


        // มีอยู่แล้ว → ลบ
        if (!snap.empty) {

            for (const item of snap.docs) {

                await deleteDoc(
                    doc(db, "bookmarks", item.id)
                );

            }

            updateBookmarkButton(false);

            showToast(
                "🗑 ยกเลิก Bookmark แล้ว"
            );

        }

        // ยังไม่มี → เพิ่ม
        else {

            await addDoc(

                collection(db, "bookmarks"),

                {
                    uid: currentUser.uid,

                    animeId: animeId,

                    title:
                        currentAnime.title || "",

                    image:
                        currentAnime.image || "",

                    category:
                        Array.isArray(currentAnime.category)
                            ? currentAnime.category
                            : currentAnime.category
                                ? [currentAnime.category]
                                : [],

                    score: 0,

                    createdAt:
                        serverTimestamp()
                }

            );

            updateBookmarkButton(true);

            showToast(
                "🔖 เพิ่ม Bookmark แล้ว"
            );

        }

    }
    catch (error) {

        console.error(
            "Bookmark Error:",
            error
        );

        showToast(
            "ไม่สามารถบันทึก Bookmark ได้"
        );

    }

}


// =====================================================
// Update Bookmark Button
// =====================================================

function updateBookmarkButton(active) {

    if (!bookmarkBtn) return;

    if (active) {

        bookmarkBtn.innerHTML =
            "🔖 Bookmarked";

        bookmarkBtn.classList.add("active");

    }
    else {

        bookmarkBtn.innerHTML =
            "📑 Bookmark";

        bookmarkBtn.classList.remove("active");

    }

}


// =====================================================
// Load Favorite / Bookmark
// =====================================================

async function loadFavoriteBookmark() {

    if (!currentUser) {

        updateFavoriteButton(false);
        updateBookmarkButton(false);

        return;

    }

    try {

        const [favoriteSnap, bookmarkSnap] =
            await Promise.all([

                getDocs(
                    query(
                        collection(db, "favorites"),
                        where(
                            "uid",
                            "==",
                            currentUser.uid
                        ),
                        where(
                            "animeId",
                            "==",
                            animeId
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
                        ),
                        where(
                            "animeId",
                            "==",
                            animeId
                        )
                    )
                )

            ]);

        updateFavoriteButton(
            !favoriteSnap.empty
        );

        updateBookmarkButton(
            !bookmarkSnap.empty
        );

    }
    catch (error) {

        console.error(
            "Load Favorite/Bookmark Error:",
            error
        );

    }

}


// =====================================================
// SHARE
// =====================================================

if (shareBtn) {

    shareBtn.addEventListener(
        "click",
        shareAnime
    );

}


async function shareAnime() {

    if (!currentAnime) return;

    try {

        if (navigator.share) {

            await navigator.share({

                title:
                    currentAnime.title,

                text:
                    currentAnime.description || "",

                url:
                    window.location.href

            });

        }
        else {

            await navigator.clipboard.writeText(
                window.location.href
            );

            showToast(
                "📋 คัดลอกลิงก์แล้ว"
            );

        }

    }
    catch (error) {

        console.log("Share cancelled:", error);

    }

}


// =====================================================
// DARK MODE
// =====================================================

if (
    localStorage.getItem("dark") === "true"
) {

    document.body.classList.add("dark");

}


if (darkBtn) {

    darkBtn.addEventListener(
        "click",
        toggleDarkMode
    );

}


function toggleDarkMode() {

    document.body.classList.toggle("dark");

    localStorage.setItem(

        "dark",

        document.body.classList.contains("dark")

    );

}


// =====================================================
// STAR RATING
// =====================================================

function createStars() {

    if (!starBox) return;

    starBox.innerHTML = "";

    for (let i = 1; i <= 10; i++) {

        const star =
            document.createElement("i");

        star.className =
            "fa-solid fa-star";

        star.dataset.rate = i;

        star.addEventListener(
            "click",
            () => {

                selectedRating = i;

                updateStars();

            }
        );

        starBox.appendChild(star);

    }

    updateStars();

}


function updateStars() {

    if (!starBox) return;

    const stars =
        starBox.querySelectorAll("i");

    stars.forEach(star => {

        const rate =
            Number(star.dataset.rate);

        star.classList.toggle(
            "active-star",
            rate <= selectedRating
        );

    });

}


function setRating(score) {

    selectedRating =
        Number(score) || 10;

    updateStars();

}


function resetRating() {

    selectedRating = 10;

    updateStars();

}


// =====================================================
// SAVE REVIEW
// =====================================================

if (submitReview) {

    submitReview.addEventListener(
        "click",
        saveReview
    );

}


async function saveReview() {

    if (!currentUser) {

        showToast(
            "กรุณาเข้าสู่ระบบ"
        );

        return;

    }

    const text =
        comment.value.trim();

    if (!text) {

        showToast(
            "กรุณาเขียนรีวิว"
        );

        return;

    }

    try {

        const userSnap =
            await getDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                )
            );

        const userData =
            userSnap.exists()
                ? userSnap.data()
                : {};


        const reviewDataNew = {

            animeId,

            uid:
                currentUser.uid,

            username:
                userData.name ||
                currentUser.displayName ||
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

            rating:
                selectedRating,

            comment:
                text,

            createdAt:
                serverTimestamp()

        };


        // Update
        if (currentReviewId) {

            await updateDoc(

                doc(
                    db,
                    "reviews",
                    currentReviewId
                ),

                reviewDataNew

            );

            showToast(
                "อัปเดตรีวิวสำเร็จ"
            );

        }

        // Add
        else {

            const ref =
                await addDoc(

                    collection(
                        db,
                        "reviews"
                    ),

                    reviewDataNew

                );

            currentReviewId = ref.id;

            showToast(
                "ส่งรีวิวสำเร็จ"
            );

        }

        comment.value = "";

        resetRating();

        if (submitReview) {
            submitReview.textContent =
                "อัปเดตรีวิว";
        }

        await loadReviews();

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

}


// =====================================================
// LOAD REVIEWS
// =====================================================

async function loadReviews() {

    if (!reviewList) return;

    reviewList.innerHTML = `
        <div class="review-card">
            <p style="text-align:center;">
                กำลังโหลดรีวิว...
            </p>
        </div>
    `;

    try {

        const q = query(

            collection(db, "reviews"),

            where(
                "animeId",
                "==",
                animeId
            )

        );

        const snap =
            await getDocs(q);

        reviewData = snap.docs.map(
            reviewDoc => ({

                id: reviewDoc.id,

                ...reviewDoc.data()

            })
        );

        renderReviews();

        averageReview();

    }
    catch (error) {

        console.error(
            "Load Reviews Error:",
            error
        );

        reviewList.innerHTML = `
            <div class="review-card">
                <p>
                    โหลดรีวิวไม่สำเร็จ
                </p>
            </div>
        `;

    }

}


// =====================================================
// Render Reviews
// =====================================================

function renderReviews() {

    if (!reviewList) return;

    reviewList.innerHTML = "";

    if (reviewData.length === 0) {

        reviewList.innerHTML = `
            <div class="review-card empty-review">

                <i class="fa-solid fa-comments"></i>

                <p>
                    ยังไม่มีรีวิว
                </p>

            </div>
        `;

        return;

    }

    reviewData.forEach(review => {

        const canDelete =
            currentUser &&
            review.uid === currentUser.uid;

        const avatar =
            review.photoURL ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                review.username || "User"
            )}`;


        const card =
            document.createElement("div");

        card.className =
            "review-card";


        const top =
            document.createElement("div");

        top.className =
            "review-top";


        const user =
            document.createElement("div");

        user.className =
            "review-user";


        const img =
            document.createElement("img");

        img.className =
            "avatar";

        img.src =
            avatar;

        img.alt =
            review.username || "User";


        const userInfo =
            document.createElement("div");


        const strong =
            document.createElement("strong");

        strong.textContent =
            review.username || "User";


        const stars =
            document.createElement("div");

        stars.className =
            "review-stars";

        stars.textContent =
            `⭐ ${review.rating || 0}/10`;


        userInfo.appendChild(strong);
        userInfo.appendChild(stars);

        user.appendChild(img);
        user.appendChild(userInfo);

        top.appendChild(user);

        card.appendChild(top);


        const text =
            document.createElement("p");

        text.className =
            "review-comment";

        text.textContent =
            review.comment || "";

        card.appendChild(text);


        if (canDelete) {

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "delete-btn";

            deleteButton.textContent =
                "🗑 ลบรีวิว";

            deleteButton.addEventListener(
                "click",
                () => deleteReview(review.id)
            );

            card.appendChild(
                deleteButton
            );

        }


        reviewList.appendChild(card);

    });

}


// =====================================================
// DELETE REVIEW
// =====================================================

async function deleteReview(id) {

    if (
        !confirm(
            "ลบรีวิวใช่หรือไม่?"
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

        reviewData =
            reviewData.filter(
                item => item.id !== id
            );


        if (id === currentReviewId) {

            currentReviewId = null;

            comment.value = "";

            resetRating();

            submitReview.textContent =
                "ส่งรีวิว";

        }


        renderReviews();

        averageReview();

        showToast(
            "ลบรีวิวแล้ว"
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
// AVERAGE REVIEW
// =====================================================

function averageReview() {

    if (!reviewData.length) {

        userScore.textContent =
            "0.0";

        reviewCount.textContent =
            "0 รีวิว";

        return;

    }

    const total =
        reviewData.reduce(
            (sum, item) =>
                sum + Number(item.rating || 0),
            0
        );

    const average =
        total / reviewData.length;

    userScore.textContent =
        average.toFixed(1);

    reviewCount.textContent =
        `${reviewData.length} รีวิว`;

}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

    if (!toast) return;

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        window.detailToastTimer
    );

    window.detailToastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

}


// =====================================================
// START APP
// =====================================================

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        createStars();

        await loadAnime();

        await loadReviews();

        // ถ้า Login แล้ว Authentication
        // จะเรียก loadFavoriteBookmark() เอง

    }
);


// =====================================================
// Export
// =====================================================

window.showToast = showToast;
window.averageReview = averageReview;
window.loadReviews = loadReviews;