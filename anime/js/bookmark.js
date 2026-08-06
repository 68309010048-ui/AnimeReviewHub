const bookmark=
JSON.parse(localStorage.getItem("bookmark")) || [];

import {
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const list = document.getElementById("favoriteList");

let favorite =
    JSON.parse(localStorage.getItem("favorite")) || [];

loadFavorite();

async function loadFavorite(){

    list.innerHTML = "";

    if(favorite.length===0){

        list.innerHTML="<h2>ยังไม่มีรายการโปรด</h2>";

        return;

    }

    for(const id of favorite){

        const snap = await getDoc(doc(db,"anime",id));

        if(!snap.exists()) continue;

        const anime=snap.data();

        list.innerHTML+=`

        <div class="anime-card">

            <img src="${anime.image}">

            <h3>${anime.title}</h3>

            <button onclick="openAnime('${id}')">

                ดูรายละเอียด

            </button>

        </div>

        `;

    }

}

window.openAnime=function(id){

    localStorage.setItem("animeId",id);

    location.href="detail.html";

}