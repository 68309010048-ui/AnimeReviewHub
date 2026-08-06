import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ===========================
// Element
// ===========================

const animeList = document.getElementById("animeList");
const search = document.getElementById("search");

let anime = [];

// ===========================
// คำนวณคะแนนเฉลี่ยจาก Reviews
// ===========================

async function getAverageScore(animeId) {

    try {

        const q = query(
            collection(db, "reviews"),
            where("animeId", "==", animeId)
        );

        const snap = await getDocs(q);

        if (snap.empty) {

            return 0;

        }

        let total = 0;

        snap.forEach(doc => {

            total += Number(doc.data().rating || 0);

        });

        return total / snap.size;

    }

    catch (error) {

        console.error(error);

        return 0;

    }

}

// ===========================
// โหลดอนิเมะจาก Firestore
// ===========================

async function loadAnime() {

    animeList.innerHTML = "<h2>Loading...</h2>";

    anime = [];

    try {

        const querySnapshot = await getDocs(
            collection(db, "anime")
        );

        querySnapshot.forEach((docSnap) => {

            anime.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        await showAnime(anime);

    }

    catch (error) {

        console.error(error);

        animeList.innerHTML = "<h2>โหลดข้อมูลไม่สำเร็จ</h2>";

    }

}

// ===========================
// แสดงอนิเมะ
// ===========================

async function showAnime(list) {

    animeList.innerHTML = "";

    if (list.length === 0) {

        animeList.innerHTML = "<h2>ไม่พบข้อมูล</h2>";

        return;

    }

    for (const item of list) {

        const score = await getAverageScore(item.id);

        animeList.innerHTML += `

        <div class="card">

            <img
                src="${item.image}"
                alt="${item.title}">

            <div class="card-content">

                <h3>${item.title}</h3>

                <p class="genre">

                    ${item.category}

                </p>

                <p class="rating">

                    ⭐ ${score.toFixed(1)} / 10

                </p>

                <button
                    onclick="showDetail('${item.id}')">

                    ดูรายละเอียด

                </button>

            </div>

        </div>

        `;

    }

}

// ===========================
// Search
// ===========================

if (search) {

    search.addEventListener("keyup", async () => {

        const keyword = search.value
            .trim()
            .toLowerCase();

        if (keyword === "") {

            await showAnime(anime);

            return;

        }

        const result = anime.filter(item =>

            item.title
                .toLowerCase()
                .includes(keyword)

        );

        await showAnime(result);

    });

}

// ===========================
// Filter
// ===========================

window.filterAnime = async function (e, category) {

    document.querySelectorAll(".category button")
        .forEach(btn => {

            btn.classList.remove("active");

        });

    if (e) {

        e.target.classList.add("active");

    }

    if (category === "All") {

        await showAnime(anime);

        return;

    }

    const result = anime.filter(item =>

        (item.category || "")
            .toLowerCase()
            ===
        category.toLowerCase()

    );

    await showAnime(result);

};

// ===========================
// Detail
// ===========================

window.showDetail = function (id) {

    localStorage.setItem("animeId", id);

    location.href = "pages/detail.html";

};

// ===========================
// Reload คะแนนทุก 10 วินาที
// ===========================

setInterval(async () => {

    await showAnime(anime);

}, 10000);

// ===========================
// Start
// ===========================

loadAnime();