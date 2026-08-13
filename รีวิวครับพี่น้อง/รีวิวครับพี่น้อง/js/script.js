

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// =====================================================
// Element
// =====================================================

const animeList = document.getElementById("animeList");
const searchBox = document.getElementById("search");

// =====================================================
// Variable
// =====================================================

let animeData = [];

let reviewData = [];

let currentCategory = "All";

// =====================================================
// Load Firestore
// =====================================================

async function loadData() {

    animeList.innerHTML = `
        <div class="loading">
            <div class="loader"></div>
        </div>
    `;

    try {

        const [animeSnap, reviewSnap] = await Promise.all([

            getDocs(collection(db, "anime")),

            getDocs(collection(db, "reviews"))

        ]);

        animeData = [];

        reviewData = [];

        animeSnap.forEach(doc => {

            animeData.push({

                id: doc.id,

                ...doc.data()

            });

        });

        reviewSnap.forEach(doc => {

            reviewData.push({

                id: doc.id,

                ...doc.data()

            });

        });

        renderAnime(animeData);

    }

    catch (error) {

        console.error(error);

        animeList.innerHTML = `
            <div class="empty">
                <i class="fa-solid fa-circle-xmark"></i>
                <h2>โหลดข้อมูลไม่สำเร็จ</h2>
                <p>กรุณาลองใหม่อีกครั้ง</p>
            </div>
        `;

    }

}

// =====================================================
// Part 3.2
// Average Score + Render Anime
// =====================================================

function getAverageScore(animeId){

    const reviews = reviewData.filter(

        item => item.animeId === animeId

    );

    if(reviews.length === 0){

        return{

            score:0,

            count:0

        };

    }

    const total = reviews.reduce(

        (sum,item)=>sum + Number(item.rating || 0),

        0

    );

    return{

        score: total / reviews.length,

        count: reviews.length

    };

}


// =====================================================
// Render Anime
// =====================================================

function renderAnime(list){

    animeList.innerHTML = "";

    if(list.length===0){

        animeList.innerHTML = `

        <div class="empty">

            <i class="fa-solid fa-film"></i>

            <h2>ไม่พบอนิเมะ</h2>

            <p>ลองค้นหาหรือเลือกหมวดหมู่ใหม่</p>

        </div>

        `;

        return;

    }

    list.forEach(item=>{

        const result = getAverageScore(item.id);

        const categoryHTML =

        Array.isArray(item.category)

        ? item.category.map(cat=>`

            <span>${cat}</span>

        `).join("")

        : `<span>${item.category || "-"}</span>`;

        animeList.innerHTML += `

        <div class="card">

            <img

                src="${item.image}"

                alt="${item.title}"

                loading="lazy"

            >

            <div class="card-content">

                <h3>

                    ${item.title}

                </h3>

                <div class="genre">

                    ${categoryHTML}

                </div>

                <div class="rating">

                    <div class="score">

                        ⭐ ${result.score.toFixed(1)}

                    </div>

                    <div class="review-count">

                        ${result.count} รีวิว

                    </div>

                </div>

                <button

                    onclick="showDetail('${item.id}')"

                >

                    ดูรายละเอียด

                </button>

            </div>

        </div>

        `;

    });

}

// =====================================================
// Part 3.3
// Search + Category + Detail
// =====================================================

// ===========================
// Search
// ===========================

if (searchBox) {

    searchBox.addEventListener("keyup", () => {

        filterAnime();

    });

}


// ===========================
// Filter
// ===========================

window.filterAnime = function (event, category) {

    if (event) {

        document
            .querySelectorAll(".category button")
            .forEach(btn => btn.classList.remove("active"));

        event.target.classList.add("active");

    }

    currentCategory = category;

    filterAnime();

};


// ===========================
// Filter Function
// ===========================

function filterAnime() {

    const keyword = searchBox
        ? searchBox.value.trim().toLowerCase()
        : "";

    const result = animeData.filter(item => {

        // Search
        const matchKeyword =
            item.title
                .toLowerCase()
                .includes(keyword);

        // Category
        let matchCategory = true;

        if (currentCategory !== "All") {

            if (Array.isArray(item.category)) {

                matchCategory =
                    item.category.some(cat =>

                        cat.toLowerCase() ===
                        currentCategory.toLowerCase()

                    );

            }

            else {

                matchCategory =
                    (item.category || "")
                    .toLowerCase() ===
                    currentCategory.toLowerCase();

            }

        }

        return matchKeyword && matchCategory;

    });

    renderAnime(result);

}


// ===========================
// Detail
// ===========================

window.showDetail = function(id){

    localStorage.setItem(

        "animeId",

        id

    );

    location.href =
        "pages/detail.html";

};

// =====================================================
// Part 3.4
// Start App
// =====================================================

// Refresh หน้าเมื่อกลับมาจากหน้าอื่น
window.addEventListener("focus", () => {

    loadData();

});


// โหลดครั้งแรก
window.addEventListener("DOMContentLoaded", () => {

    loadData();

});


// =====================================================
// Utility
// =====================================================

// Reload ข้อมูล (เรียกใช้จากไฟล์อื่นได้)
window.reloadAnime = async function(){

    await loadData();

};


// ล้างช่องค้นหา
window.clearSearch = function(){

    if(searchBox){

        searchBox.value="";

    }

    currentCategory="All";

    document
    .querySelectorAll(".category button")
    .forEach(btn=>{

        btn.classList.remove("active");

    });

    const firstBtn=document.querySelector(".category button");

    if(firstBtn){

        firstBtn.classList.add("active");

    }

    renderAnime(animeData);

};


// =====================================================
// Export
// =====================================================

window.showDetail=showDetail;

window.filterAnime=window.filterAnime;

window.renderAnime=renderAnime;

window.loadData=loadData;