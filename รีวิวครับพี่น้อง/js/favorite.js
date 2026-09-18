// =====================================================
// Anime Review Hub
// favorite.js
// REAL-TIME FAVORITE
// =====================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// Elements
// =====================================================

const list =
    document.getElementById(
        "favoriteList"
    );

const count =
    document.getElementById(
        "favoriteCount"
    );

const search =
    document.getElementById(
        "searchFavorite"
    );

const emptyBox =
    document.getElementById(
        "emptyBox"
    );


// =====================================================
// Variables
// =====================================================

let currentUser = null;

let favorites = [];

let animeCache = new Map();

let animeListeners = new Map();

let unsubscribeFavorites = null;

let searchText = "";


// =====================================================
// AUTH
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        cleanup();

        currentUser =
            user;


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        startFavoriteRealtime();

    }
);


// =====================================================
// FAVORITE REALTIME
// =====================================================

function startFavoriteRealtime() {

    const q =
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
        );


    unsubscribeFavorites =
        onSnapshot(
            q,
            async (snapshot) => {

                favorites =
                    snapshot.docs.map(
                        docSnap => ({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        })
                    );


                updateCount();


                await syncAnimeListeners();


                render();

            },

            (error) => {

                console.error(
                    "Favorite realtime error:",
                    error
                );

            }
        );

}


// =====================================================
// ANIME LISTENERS
// =====================================================

async function syncAnimeListeners() {

    const animeIds =
        new Set(
            favorites
                .map(
                    item =>
                        String(
                            item.animeId
                        )
                )
                .filter(Boolean)
        );


    // ================================================
    // Remove old listeners
    // ================================================

    for (
        const [animeId, unsubscribe]
        of animeListeners
    ) {

        if (!animeIds.has(animeId)) {

            unsubscribe();

            animeListeners.delete(
                animeId
            );

            animeCache.delete(
                animeId
            );

        }

    }


    // ================================================
    // Add new listeners
    // ================================================

    for (
        const animeId
        of animeIds
    ) {

        if (
            animeListeners.has(
                animeId
            )
        ) {

            continue;

        }


        const unsubscribe =
            onSnapshot(
                doc(
                    db,
                    "anime",
                    animeId
                ),
                (snap) => {

                    if (!snap.exists()) {

                        animeCache.delete(
                            animeId
                        );

                    }
                    else {

                        animeCache.set(
                            animeId,
                            {
                                id:
                                    snap.id,

                                ...snap.data()
                            }
                        );

                    }


                    render();

                }
            );


        animeListeners.set(
            animeId,
            unsubscribe
        );

    }

}


// =====================================================
// RENDER
// =====================================================

function render() {

    if (!list) {
        return;
    }


    list.innerHTML =
        "";


    const keyword =
        searchText
            .trim()
            .toLowerCase();


    const visible =
        favorites.filter(
            favorite => {

                const anime =
                    animeCache.get(
                        String(
                            favorite.animeId
                        )
                    );


                if (!anime) {
                    return false;
                }


                if (!keyword) {
                    return true;
                }


                return String(
                    anime.title ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        keyword
                    );

            }
        );


    if (visible.length === 0) {

        if (emptyBox) {

            emptyBox.style.display =
                "";

            emptyBox.innerHTML = `
                <i class="fa-solid fa-heart"></i>

                <h2>
                    ${
                        favorites.length
                            ? "ไม่พบ Anime"
                            : "ยังไม่มีรายการโปรด"
                    }
                </h2>

                <p>
                    ${
                        favorites.length
                            ? "ลองค้นหาชื่อ Anime อื่น"
                            : "Anime ที่กด Favorite จะแสดงที่นี่"
                    }
                </p>
            `;

        }

        return;

    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    visible.forEach(
        favorite => {

            const anime =
                animeCache.get(
                    String(
                        favorite.animeId
                    )
                );


            const image =
                anime.image ||
                anime.imageURL ||
                "";


            const categories =
                normalizeCategories(
                    anime.category
                );


            list.innerHTML += `
                <div class="card">

                    <img
                        src="${escapeAttribute(
                            image
                        )}"
                        alt="${escapeAttribute(
                            anime.title ||
                            "Anime"
                        )}"
                        onerror="this.src='https://placehold.co/600x800?text=No+Image';"
                    >

                    <div class="card-content">

                        <h3>
                            ${escapeHTML(
                                anime.title ||
                                "ไม่มีชื่อ"
                            )}
                        </h3>


                        <div class="genre">

                            ${
                                categories
                                    .slice(0, 3)
                                    .map(
                                        item =>
                                            `
                                            <span>
                                                ${escapeHTML(
                                                    item
                                                )}
                                            </span>
                                            `
                                    )
                                    .join("")
                            }

                        </div>


                        <button
                            type="button"
                            data-id="${escapeAttribute(
                                favorite.animeId
                            )}"
                            class="detail-btn"
                        >
                            ดูรายละเอียด
                        </button>

                    </div>

                </div>
            `;

        }
    );


    list
        .querySelectorAll(
            ".detail-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        localStorage.setItem(
                            "animeId",
                            button.dataset.id
                        );


                        window.location.href =
                            "detail.html";

                    }
                );

            }
        );

}


// =====================================================
// SEARCH
// =====================================================

if (search) {

    search.addEventListener(
        "input",
        () => {

            searchText =
                search.value;

            render();

        }
    );

}


// =====================================================
// COUNT
// =====================================================

function updateCount() {

    if (count) {

        count.textContent =
            favorites.length;

    }

}


// =====================================================
// CLEANUP
// =====================================================

function cleanup() {

    if (unsubscribeFavorites) {

        unsubscribeFavorites();
        unsubscribeFavorites = null;

    }


    animeListeners
        .forEach(
            unsubscribe =>
                unsubscribe()
        );


    animeListeners.clear();

    animeCache.clear();

}


// =====================================================
// HELPERS
// =====================================================

function normalizeCategories(
    value
) {

    if (Array.isArray(value)) {

        return value
            .filter(Boolean)
            .map(String);

    }


    if (!value) {

        return [];

    }


    return String(value)
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


function escapeHTML(
    value
) {

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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}