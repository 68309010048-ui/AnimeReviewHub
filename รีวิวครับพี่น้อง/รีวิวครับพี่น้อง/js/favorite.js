import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// =====================================
// Element
// =====================================

const favoriteList = document.getElementById("favoriteList");
const favoriteCount = document.getElementById("favoriteCount");
const emptyBox = document.getElementById("emptyBox");
const searchInput = document.getElementById("searchFavorite");

let favoriteAnime = [];
let currentUser = null;

// =====================================
// Login
// =====================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "../login.html";
        return;

    }

    currentUser = user;

    await loadFavorite();

});

// =====================================
// Load Favorite
// =====================================

async function loadFavorite() {

    favoriteAnime = [];

    favoriteList.innerHTML = `
    <div class="loading">
        <div class="loader"></div>
    </div>
    `;

    const q = query(

        collection(db, "favorites"),

        where("uid", "==", currentUser.uid)

    );

    const snap = await getDocs(q);

    snap.forEach(docSnap => {

        favoriteAnime.push({

            id: docSnap.id,

            ...docSnap.data()

        });

    });

    showFavorite(favoriteAnime);

}

// =====================================
// Show Favorite
// =====================================

function showFavorite(list) {

    favoriteList.innerHTML = "";

    favoriteCount.textContent = list.length;

    if (list.length === 0) {

        favoriteList.style.display = "none";
        emptyBox.style.display = "block";

        return;

    }

    favoriteList.style.display = "grid";
    emptyBox.style.display = "none";

    list.forEach(item => {

        favoriteList.innerHTML += `

        <div class="card">

            <img src="${item.image}">

            <div class="card-content">

                <h3>${item.title}</h3>

                <p class="genre">
                    ${item.category}
                </p>

                <p class="rating">
                    ⭐ ${Number(item.score || 0).toFixed(1)}
                </p>

                <div class="card-buttons">

                    <button
                        class="detail-btn"
                        onclick="showDetail('${item.animeId}')">

                        ดูรายละเอียด

                    </button>

                    <button
                        class="remove-btn"
                        onclick="removeFavorite('${item.id}')">

                        ❤️ ลบออก

                    </button>

                </div>

            </div>

        </div>

        `;

    });

}

// =====================================
// Search
// =====================================

searchInput.addEventListener("keyup", () => {

    const keyword = searchInput.value
        .trim()
        .toLowerCase();

    if (keyword === "") {

        showFavorite(favoriteAnime);
        return;

    }

    const result = favoriteAnime.filter(item =>

        item.title
            .toLowerCase()
            .includes(keyword)

    );

    showFavorite(result);

});

// =====================================
// Detail
// =====================================

window.showDetail = function(id){

    localStorage.setItem("animeId", id);

    location.href = "detail.html";

};

// =====================================
// Remove Favorite
// =====================================

window.removeFavorite = async function(id){

    if(!confirm("ลบออกจาก Favorite ?")){

        return;

    }

    try{

        await deleteDoc(

            doc(db,"favorites",id)

        );

        favoriteAnime = favoriteAnime.filter(

            item => item.id !== id

        );

        showFavorite(favoriteAnime);

    }

    catch(error){

        console.error(error);

        alert("ลบไม่สำเร็จ");

    }

};