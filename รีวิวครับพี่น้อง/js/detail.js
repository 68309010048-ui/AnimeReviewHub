
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

    location.href = "../index.html";

}


// =====================================================
// Variable
// =====================================================

let currentAnime = null;

let currentUser = null;

let currentReviewId = null;

let selectedRating = 10;

let reviewData = [];


// =====================================================
// Element
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

const trailerBox =
document.getElementById("trailerBox");

const reviewList =
document.getElementById("reviewList");

const username =
document.getElementById("username");

const comment =
document.getElementById("comment");

const submitReview =
document.getElementById("submitReview");

const favoriteBtn =
document.getElementById("favoriteBtn");

const bookmarkBtn =
document.getElementById("bookmarkBtn");

const shareBtn =
document.getElementById("shareBtn");

const darkBtn =
document.getElementById("darkBtn");

const userScore =
document.getElementById("userScore");

const reviewCount =
document.getElementById("reviewCount");

const starBox =
document.getElementById("starRating");

const toast =
document.getElementById("toast");


// =====================================================
// Init
// =====================================================

async function init(){

    await loadAnime();

    await loadReviews();

    loadFavoriteBookmark();

    createStars();

}

window.addEventListener(

    "DOMContentLoaded",

    init

);
// ===========================
// Login
// ===========================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (!user) {

        submitReview.disabled = true;
        submitReview.textContent = "เข้าสู่ระบบก่อนรีวิว";

        if (username) {

            username.value = "";
            username.placeholder = "กรุณาเข้าสู่ระบบ";

        }

        return;

    }

    submitReview.disabled = false;
    submitReview.textContent = "ส่งรีวิว";

    await loadUser(user);

});


// ===========================
// Load User
// ===========================

async function loadUser(user){

    try{

        const snap = await getDoc(

            doc(db,"users",user.uid)

        );

        if(snap.exists()){

            const data = snap.data();

            username.value = data.name || "User";

            username.readOnly = true;

        }

        // ตรวจสอบว่ารีวิวแล้วหรือยัง

        const q = query(

            collection(db,"reviews"),

            where("animeId","==",animeId),

            where("uid","==",user.uid)

        );

        const reviewSnap = await getDocs(q);

        if(!reviewSnap.empty){

            const reviewDoc = reviewSnap.docs[0];

            currentReviewId = reviewDoc.id;

            const review = reviewDoc.data();

            comment.value = review.comment;

            selectedRating = review.rating;

            updateStars();

            submitReview.textContent =

                "อัปเดตรีวิว";

        }

    }

    catch(error){

        console.error(error);

    }

}


// ===========================
// Load Anime
// ===========================

async function loadAnime(){

    try{

        const snap = await getDoc(

            doc(db,"anime",animeId)

        );

        if(!snap.exists()){

            alert("ไม่พบข้อมูลอนิเมะ");

            location.href="../index.html";

            return;

        }

        currentAnime = {

            id:snap.id,

            ...snap.data()

        };

        showAnime(currentAnime);

    }

    catch(error){

        console.error(error);

        showToast("โหลดข้อมูลไม่สำเร็จ");

    }

}
function showAnime(anime){

    // ===========================
    // Poster / Banner
    // ===========================

    poster.src = anime.image;

    poster.alt = anime.title;

    banner.style.backgroundImage =

    `linear-gradient(
        rgba(0,0,0,.45),
        rgba(0,0,0,.55)
    ),url(${anime.image})`;


    // ===========================
    // Text
    // ===========================

    title.textContent =
        anime.title;

    description.textContent =
        anime.description || "-";

    episodes.textContent =
        anime.episodes || "-";

    status.textContent =
        anime.status || "-";

    type.textContent =
        anime.type || "-";


    // ===========================
    // Category
    // รองรับหลายหมวด
    // ===========================

    category.innerHTML = "";

    if(Array.isArray(anime.category)){

        anime.category.forEach(cat=>{

            category.innerHTML +=

            `
            <span>

                ${cat}

            </span>
            `;

        });

    }

    else if(anime.category){

        category.innerHTML =

        `
        <span>

            ${anime.category}

        </span>
        `;

    }

    else{

        category.innerHTML =

        `
        <span>

            -

        </span>
        `;

    }


    // ===========================
    // Trailer
    // ===========================

    loadTrailer(anime.trailer);

}



// =====================================================
// Trailer
// =====================================================

function loadTrailer(url){

    if(!url){

        trailerBox.innerHTML=

        `
        <div class="no-trailer">

            <i class="fa-solid fa-video-slash"></i>

            <p>

                ยังไม่มีตัวอย่างอนิเมะ

            </p>

        </div>
        `;

        return;

    }


    let embed=url;


    if(embed.includes("watch?v=")){

        embed=embed.replace(

            "watch?v=",

            "embed/"

        );

    }


    if(embed.includes("youtu.be/")){

        const id=

        embed.split("youtu.be/")[1];

        embed=

        `https://www.youtube.com/embed/${id}`;

    }


    trailerBox.innerHTML=

    `
    <iframe

        src="${embed}"

        allowfullscreen

        loading="lazy"

        frameborder="0">

    </iframe>
    `;

}
// ===========================
// Favorite
// ===========================

favoriteBtn.addEventListener("click", toggleFavorite);

function toggleFavorite() {

    let favorite = JSON.parse(

        localStorage.getItem("favorite")

    ) || [];

    const index = favorite.indexOf(animeId);

    if (index === -1) {

        favorite.push(animeId);

        showToast("❤️ เพิ่มรายการโปรดแล้ว");

    }

    else {

        favorite.splice(index, 1);

        showToast("💔 นำออกจากรายการโปรด");

    }

    localStorage.setItem(

        "favorite",

        JSON.stringify(favorite)

    );

    updateFavoriteButton();

}

function updateFavoriteButton() {

    const favorite = JSON.parse(

        localStorage.getItem("favorite")

    ) || [];

    if (favorite.includes(animeId)) {

        favoriteBtn.innerHTML =

            "❤️ โปรดแล้ว";

        favoriteBtn.classList.add("active");

    }

    else {

        favoriteBtn.innerHTML =

            "🤍 Favorite";

        favoriteBtn.classList.remove("active");

    }

}



// ===========================
// Bookmark
// ===========================

bookmarkBtn.addEventListener("click", toggleBookmark);

function toggleBookmark() {

    let bookmark = JSON.parse(

        localStorage.getItem("bookmark")

    ) || [];

    const index = bookmark.indexOf(animeId);

    if (index === -1) {

        bookmark.push(animeId);

        showToast("🔖 บันทึกแล้ว");

    }

    else {

        bookmark.splice(index, 1);

        showToast("🗑 ลบ Bookmark");

    }

    localStorage.setItem(

        "bookmark",

        JSON.stringify(bookmark)

    );

    updateBookmarkButton();

}

function updateBookmarkButton() {

    const bookmark = JSON.parse(

        localStorage.getItem("bookmark")

    ) || [];

    if (bookmark.includes(animeId)) {

        bookmarkBtn.innerHTML =

            "🔖 บันทึกแล้ว";

        bookmarkBtn.classList.add("active");

    }

    else {

        bookmarkBtn.innerHTML =

            "📑 Bookmark";

        bookmarkBtn.classList.remove("active");

    }

}



// ===========================
// Load Favorite / Bookmark
// ===========================

function loadFavoriteBookmark(){

    updateFavoriteButton();

    updateBookmarkButton();

}



// ===========================
// Share
// ===========================

shareBtn.addEventListener("click", async()=>{

    try{

        if(navigator.share){

            await navigator.share({

                title:currentAnime.title,

                text:currentAnime.description,

                url:location.href

            });

        }

        else{

            await navigator.clipboard.writeText(

                location.href

            );

            showToast(

                "📋 คัดลอกลิงก์แล้ว"

            );

        }

    }

    catch(error){

        console.log(error);

    }

});



// ===========================
// Dark Mode
// ===========================

if(

    localStorage.getItem("dark")==="true"

){

    document.body.classList.add("dark");

}

darkBtn.addEventListener("click",()=>{

    document.body.classList.toggle("dark");

    localStorage.setItem(

        "dark",

        document.body.classList.contains("dark")

    );

});
// ===========================
// Create Stars
// ===========================

function createStars() {

    starBox.innerHTML = "";

    for (let i = 1; i <= 10; i++) {

        const star = document.createElement("i");

        star.className = "fa-solid fa-star";

        star.dataset.rate = i;

        star.addEventListener("click", () => {

            selectedRating = i;

            updateStars();

        });

        starBox.appendChild(star);

    }

    updateStars();

}



// ===========================
// Update Stars
// ===========================

function updateStars() {

    const stars = starBox.querySelectorAll("i");

    stars.forEach(star => {

        const rate = Number(star.dataset.rate);

        if (rate <= selectedRating) {

            star.classList.add("active-star");

        }

        else {

            star.classList.remove("active-star");

        }

    });

}



// ===========================
// Set Rating
// (ใช้ตอนโหลดรีวิวเดิม)
// ===========================

function setRating(score) {

    selectedRating = Number(score) || 10;

    updateStars();

}



// ===========================
// Reset Rating
// ===========================

function resetRating() {

    selectedRating = 10;

    updateStars();

}
submitReview.addEventListener("click", saveReview);


// ===========================
// Save Review
// ===========================

async function saveReview() {

    if (!currentUser) {

        showToast("กรุณาเข้าสู่ระบบ");

        return;

    }

    const text = comment.value.trim();

    if (text === "") {

        showToast("กรุณาเขียนรีวิว");

        return;

    }

    try {

        // โหลดข้อมูลผู้ใช้
        const userSnap = await getDoc(
            doc(db, "users", currentUser.uid)
        );

        const userData = userSnap.exists()
            ? userSnap.data()
            : {};

        const reviewData = {

            animeId,

            uid: currentUser.uid,

            username:
                userData.name || "User",

            email:
                userData.email || currentUser.email,

            photoURL:
                userData.photo || "",

            rating:
                selectedRating,

            comment:
                text,

            createdAt:
                serverTimestamp()

        };


        // =====================
        // Update
        // =====================

        if (currentReviewId) {

            await updateDoc(

                doc(
                    db,
                    "reviews",
                    currentReviewId
                ),

                reviewData

            );

            showToast("อัปเดตรีวิวสำเร็จ");

        }

        // =====================
        // Add
        // =====================

        else {

            const ref = await addDoc(

                collection(
                    db,
                    "reviews"
                ),

                reviewData

            );

            currentReviewId = ref.id;

            showToast("ส่งรีวิวสำเร็จ");

        }


        // รีเซ็ต

        comment.value = "";

        resetRating();

        submitReview.textContent =
            "อัปเดตรีวิว";


        // โหลดใหม่

        await loadReviews();

        await averageReview();

    }

    catch (error) {

        console.error(error);

        showToast("บันทึกรีวิวไม่สำเร็จ");

    }

}
// ===========================
// Load Reviews
// ===========================

async function loadReviews() {

    reviewList.innerHTML = "";

    const q = query(
        collection(db, "reviews"),
        where("animeId", "==", animeId)
    );

    const snap = await getDocs(q);

    reviewData = [];

    if (snap.empty) {

        reviewList.innerHTML = `

        <div class="review-card empty-review">

            <i class="fa-solid fa-comments"></i>

            <p>ยังไม่มีรีวิว</p>

        </div>

        `;

        averageReview();

        return;

    }

    snap.forEach(docSnap => {

        reviewData.push({

            id: docSnap.id,

            ...docSnap.data()

        });

    });

    renderReviews();

    averageReview();

}



// ===========================
// Render Reviews
// ===========================

function renderReviews(){

    reviewList.innerHTML="";

    reviewData.forEach(review=>{

        const canDelete=

            currentUser &&

            review.uid===currentUser.uid;

        const avatar=

            review.photoURL ||

            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(review.username)}`;

        reviewList.innerHTML+=`

        <div class="review-card">

            <div class="review-top">

                <div class="review-user">

                    <img

                        class="avatar"

                        src="${avatar}"

                    >

                    <div>

                        <strong>

                            ${review.username}

                        </strong>

                        <div class="review-stars">

                            ⭐ ${review.rating}/10

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

                onclick="deleteReview('${review.id}')"

            >

                🗑 ลบรีวิว

            </button>

            ` : ""}

        </div>

        `;

    });

}



// ===========================
// Delete Review
// ===========================

window.deleteReview = async function(id){

    if(!confirm("ลบรีวิวใช่หรือไม่?")){

        return;

    }

    try{

        await deleteDoc(

            doc(db,"reviews",id)

        );

        reviewData = reviewData.filter(

            item=>item.id!==id

        );

        if(id===currentReviewId){

            currentReviewId=null;

            comment.value="";

            resetRating();

            submitReview.textContent=

                "ส่งรีวิว";

        }

        renderReviews();

        averageReview();

        showToast(

            "ลบรีวิวแล้ว"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "ลบรีวิวไม่สำเร็จ"

        );

    }

};



// ===========================
// Average Review
// ===========================

function averageReview(){

    if(reviewData.length===0){

        userScore.textContent="0.0";

        reviewCount.textContent="0 รีวิว";

        return;

    }

    const total=

        reviewData.reduce(

            (sum,item)=>

                sum+Number(item.rating),

            0

        );

    const avg=

        total/reviewData.length;

    userScore.textContent=

        avg.toFixed(1);

    reviewCount.textContent=

        `${reviewData.length} รีวิว`;

}

// ===========================
// Toast
// ===========================

function showToast(message){

    if(!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}



// ===========================
// Refresh Detail
// ===========================

async function refreshPage(){

    try{

        await Promise.all([

            loadAnime(),

            loadReviews()

        ]);

        loadFavoriteBookmark();

    }

    catch(error){

        console.error(error);

    }

}



// ===========================
// Reset Form
// ===========================

function resetReviewForm(){

    comment.value = "";

    resetRating();

    currentReviewId = null;

    submitReview.textContent =

        "ส่งรีวิว";

}



// ===========================
// Reload Current User Review
// ===========================

async function reloadUserReview(){

    if(!currentUser) return;

    const q = query(

        collection(db,"reviews"),

        where("animeId","==",animeId),

        where("uid","==",currentUser.uid)

    );

    const snap = await getDocs(q);

    if(snap.empty){

        resetReviewForm();

        return;

    }

    const review = snap.docs[0];

    currentReviewId = review.id;

    comment.value = review.data().comment;

    setRating(review.data().rating);

    submitReview.textContent =

        "อัปเดตรีวิว";

}



// ===========================
// Refresh เมื่อกลับมาหน้าเว็บ
// ===========================

window.addEventListener("focus",()=>{

    averageReview();

});



// ===========================
// Start
// ===========================

window.addEventListener(

    "DOMContentLoaded",

    async()=>{

        createStars();

        await refreshPage();

    }

);



// ===========================
// Export
// ===========================

window.showToast = showToast;

window.refreshPage = refreshPage;

window.reloadUserReview = reloadUserReview;

window.averageReview = averageReview;

window.renderReviews = renderReviews;

window.loadReviews = loadReviews;

window.resetReviewForm = resetReviewForm;