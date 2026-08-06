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


// ===============================
// Variable
// ===============================

const animeId = localStorage.getItem("animeId");

if (!animeId) {

    location.href = "../index.html";

}

let currentAnime = null;

let currentUser = null;

let currentReviewId = null;

let selectedRating = 10;

// ===============================
// Login
// ===============================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    const username = document.getElementById("username");
    const submitBtn = document.getElementById("submitReview");

    if (!user) {

        submitBtn.disabled = true;
        submitBtn.textContent = "เข้าสู่ระบบก่อนรีวิว";

        if (username) {
            username.value = "";
            username.placeholder = "กรุณาเข้าสู่ระบบ";
        }

        return;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "ส่งรีวิว";

    // ดึงชื่อจาก Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    let userName = "User";

    if (userDoc.exists()) {
        userName = userDoc.data().name || "User";
    }

    if (username) {
        username.value = userName;
        username.readOnly = true;
    }

    // ตรวจสอบว่าเคยรีวิวหรือยัง
    const q = query(
        collection(db, "reviews"),
        where("animeId", "==", animeId),
        where("uid", "==", user.uid)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {

        const review = snap.docs[0];

        currentReviewId = review.id;

        const data = review.data();

        document.getElementById("comment").value = data.comment;

        selectedRating = data.rating;

        updateStars();

        submitBtn.textContent = "อัปเดตรีวิว";
    }

});

// ===============================
// Load Anime
// ===============================

async function loadAnime() {

    if (!animeId) {

        location.href = "../index.html";

        return;

    }

    try {

        const snap = await getDoc(

            doc(db, "anime", animeId)

        );

        if (!snap.exists()) {

            alert("ไม่พบข้อมูลอนิเมะ");

            location.href = "../index.html";

            return;

        }

        currentAnime = snap.data();

        showAnime(currentAnime);

        loadReview();

    }

    catch (error) {

        console.error(error);

        showToast("โหลดข้อมูลไม่สำเร็จ");

    }

}

// ===============================
// Show Anime
// ===============================

function showAnime(anime) {

    document.getElementById("poster").src =
        anime.image;

    document.getElementById("banner").style.backgroundImage =

        `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(${anime.image})`;

    document.getElementById("title").textContent =
        anime.title;

    document.getElementById("description").textContent =
        anime.description || "-";

    document.getElementById("episodes").textContent =
        anime.episodes || "-";

    document.getElementById("status").textContent =
        anime.status || "-";

    document.getElementById("type").textContent =
        anime.type || "-";

    document.getElementById("category").innerHTML =

        `<span>${anime.category}</span>`;

    // Trailer

    const trailerBox =
        document.getElementById("trailerBox");

   if (anime.trailer) {

    let url = anime.trailer;

    if (url.includes("watch?v=")) {

        url = url.replace("watch?v=", "embed/");

    }

    if (url.includes("youtu.be/")) {

        const id = url.split("youtu.be/")[1];

        url = "https://www.youtube.com/embed/" + id;

    }

    trailerBox.innerHTML = `
        <iframe
            src="${url}"
            frameborder="0"
            allowfullscreen>
        </iframe>
    `;

} 
    
    else {

        trailerBox.innerHTML =

        `
        <div class="no-trailer">
            <i class="fa-solid fa-video-slash"></i>
            <p>ยังไม่มีตัวอย่างอนิเมะ</p>
        </div>
        `;

    }

}

// ===============================
// Favorite
// ===============================

const favoriteBtn = document.getElementById("favoriteBtn");

favoriteBtn.onclick = () => {

    let favorite = JSON.parse(
        localStorage.getItem("favorite")
    ) || [];

    if (!favorite.includes(animeId)) {

        favorite.push(animeId);

        localStorage.setItem(
            "favorite",
            JSON.stringify(favorite)
        );

        favoriteBtn.innerHTML =
            "❤️ โปรดแล้ว";

        favoriteBtn.style.background =
            "#dc2626";

        showToast("เพิ่มในรายการโปรดแล้ว");

    }

    else {

        showToast("มีในรายการโปรดแล้ว");

    }

};


// ===============================
// Bookmark
// ===============================

const bookmarkBtn =
document.getElementById("bookmarkBtn");

bookmarkBtn.onclick = () => {

    let bookmark = JSON.parse(
        localStorage.getItem("bookmark")
    ) || [];

    if (!bookmark.includes(animeId)) {

        bookmark.push(animeId);

        localStorage.setItem(
            "bookmark",
            JSON.stringify(bookmark)
        );

        bookmarkBtn.innerHTML =
            "🔖 บันทึกแล้ว";

        bookmarkBtn.style.background =
            "#2563eb";

        showToast("บันทึกเรียบร้อย");

    }

    else {

        showToast("บันทึกไว้แล้ว");

    }

};


// ===============================
// Load Favorite / Bookmark
// ===============================

function loadFavoriteBookmark() {

    const favorite = JSON.parse(
        localStorage.getItem("favorite")
    ) || [];

    if (favorite.includes(animeId)) {

        favoriteBtn.innerHTML =
            "❤️ โปรดแล้ว";

        favoriteBtn.style.background =
            "#dc2626";

    }

    const bookmark = JSON.parse(
        localStorage.getItem("bookmark")
    ) || [];

    if (bookmark.includes(animeId)) {

        bookmarkBtn.innerHTML =
            "🔖 บันทึกแล้ว";

        bookmarkBtn.style.background =
            "#2563eb";

    }

}


// ===============================
// Share
// ===============================

const shareBtn =
document.getElementById("shareBtn");

shareBtn.onclick = async () => {

    try {

        if (navigator.share) {

            await navigator.share({

                title:
                currentAnime.title,

                text:
                currentAnime.description,

                url:
                location.href

            });

        }

        else {

            await navigator.clipboard.writeText(
                location.href
            );

            showToast(
                "คัดลอกลิงก์แล้ว"
            );

        }

    }

    catch (error) {

        console.log(error);

    }

};


// ===============================
// Dark Mode
// ===============================

const darkBtn =
document.getElementById("darkBtn");

if (
    localStorage.getItem("dark")
    === "true"
) {

    document.body.classList.add(
        "dark"
    );

}

darkBtn.onclick = () => {

    document.body.classList.toggle(
        "dark"
    );

    localStorage.setItem(

        "dark",

        document.body.classList.contains(
            "dark"
        )

    );

};


// ===============================
// Star Rating
// ===============================

const starBox =
document.getElementById("starRating");

starBox.innerHTML = "";

for (

    let i = 1;

    i <= 10;

    i++

) {

    starBox.innerHTML += `

        <i
            class="fa-solid fa-star"
            data-rate="${i}">
        </i>

    `;

}

const stars =
document.querySelectorAll(
"#starRating i"
);

stars.forEach(star => {

    star.addEventListener(

        "click",

        () => {

            selectedRating = Number(
                star.dataset.rate
            );

            updateStars();

        }

    );

});

function updateStars() {

    stars.forEach(star => {

        const rate =
        Number(
            star.dataset.rate
        );

        if (
            rate <= selectedRating
        ) {

            star.classList.add(
                "active-star"
            );

        }

        else {

            star.classList.remove(
                "active-star"
            );

        }

    });

}

updateStars();

// ===============================
// Review (Firestore Final)
// ===============================

document
    .getElementById("submitReview")
    .addEventListener("click", addReview);

async function addReview() {

    if (!currentUser) {

        showToast("กรุณาเข้าสู่ระบบ");

        return;

    }

    const comment = document
        .getElementById("comment")
        .value
        .trim();

    if (comment === "") {

        showToast("กรุณาเขียนรีวิว");

        return;

    }

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));

let userData = {};

if (userSnap.exists()) {
    userData = userSnap.data();
}

const data = {

    animeId,

    uid: currentUser.uid,

    username: userData.name || "User",

    email: userData.email || currentUser.email,

    photoURL: userData.photo || "",

    comment,

    rating: selectedRating,

    createdAt: serverTimestamp()

};

    try {

        if (currentReviewId) {

            await updateDoc(

                doc(db, "reviews", currentReviewId),

                data

            );

            showToast("อัปเดตรีวิวแล้ว");

            loadReview();
             averageReview();
       
            }

        else {

            const ref = await addDoc(

                collection(db, "reviews"),

                data

            );

            currentReviewId = ref.id;

            showToast("ส่งรีวิวสำเร็จ");

            document.getElementById("comment").value = "";

selectedRating = 10;

updateStars();
       
}

        await loadReview();
        await averageReview();

    }

    catch (error) {

        console.error(error);

        showToast("ไม่สามารถบันทึกรีวิว");

    }

}

// ===============================
// Load Review
// ===============================

async function loadReview() {

    const reviewList =

        document.getElementById("reviewList");

    reviewList.innerHTML = "";

    const q = query(

        collection(db, "reviews"),

        where("animeId", "==", animeId)

    );

    const snap = await getDocs(q);

    if (snap.empty) {

        reviewList.innerHTML =

        `
        <div class="review-card">

            <p style="text-align:center">

                ยังไม่มีรีวิว

            </p>

        </div>
        `;

        averageReview();

        return;

    }

    snap.forEach(docSnap => {

        const review = docSnap.data();

        const canDelete =

            currentUser &&

            review.uid === currentUser.uid;

        reviewList.innerHTML +=

        `
        <div class="review-card">

            <div class="review-top">

                <div class="review-user">

                    <img
                        class="avatar"
                        src="${review.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(review.username)}` }">

                    <div>

                        <strong>

                            ${review.username}

                        </strong>

                        <div class="review-stars">

                            ${"⭐".repeat(review.rating)}

                            (${review.rating}/10)

                        </div>

                    </div>

                </div>

            </div>

            <p class="review-comment">

                ${review.comment}

            </p>

            ${canDelete ? `
                <button
                    class="delete-btn"
                    onclick="deleteReview('${docSnap.id}')">

                    🗑 ลบรีวิว

                </button>
            ` : ""}

        </div>

        `;

    });

    averageReview();

}

// ===============================
// Delete Review
// ===============================

window.deleteReview = async function(id){

    if(!confirm("ลบรีวิวใช่หรือไม่?")){

        return;

    }

    try{

        await deleteDoc(

            doc(db,"reviews",id)

        );

        if(id === currentReviewId){

            currentReviewId = null;

            document.getElementById("comment").value = "";

            selectedRating = 10;

            updateStars();

            document.getElementById("submitReview").textContent =

                "ส่งรีวิว";

        }

        showToast("ลบรีวิวเรียบร้อย");

        await loadReview();

        await averageReview();

    }

    catch(error){

        console.error(error);

        showToast("ลบรีวิวไม่สำเร็จ");

    }

};

// ===============================
// Average Review
// ===============================

async function averageReview() {

    const q = query(
        collection(db, "reviews"),
        where("animeId", "==", animeId)
    );

    const snap = await getDocs(q);

    const userScore =
        document.getElementById("userScore");

    const reviewCount =
        document.getElementById("reviewCount");

    if (snap.empty) {

        userScore.textContent = "0.0";
        reviewCount.textContent = "0 รีวิว";

        return;

    }

    let total = 0;

    snap.forEach(doc => {

        total += Number(doc.data().rating);

    });

    const avg = total / snap.size;

    userScore.textContent = avg.toFixed(1);

    reviewCount.textContent = `${snap.size} รีวิว`;

}

// ===============================
// Toast
// ===============================

function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

// ===============================
// Start
// ===============================

window.addEventListener("DOMContentLoaded", async () => {

    loadFavoriteBookmark();

    updateStars();

    await loadAnime();

    await averageReview();

});

// ===============================
// Export (optional)
// ===============================

window.showToast = showToast;
window.loadReview = loadReview;
window.averageReview = averageReview;