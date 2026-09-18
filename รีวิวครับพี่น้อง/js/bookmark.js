// =====================================================
// Anime Review Hub
// bookmark.js
// REAL-TIME BOOKMARK
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
    doc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// Elements
// =====================================================

const list =
    document.getElementById(
        "bookmarkList"
    );

const count =
    document.getElementById(
        "bookmarkCount"
    );

const search =
    document.getElementById(
        "searchBookmark"
    );

const emptyBox =
    document.getElementById(
        "emptyBox"
    );


// =====================================================
// Variables
// =====================================================

let currentUser = null;

let bookmarks = [];

let animeCache = new Map();

let animeListeners = new Map();

let unsubscribeBookmarks = null;

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


        startBookmarkRealtime();

    }
);


// =====================================================
// BOOKMARK REALTIME
// =====================================================

function startBookmarkRealtime() {

    const q =
        query(
            collection(
                db,
                "bookmarks"
            ),
            where(
                "uid",
                "==",
                currentUser.uid
            )
        );


    unsubscribeBookmarks =
        onSnapshot(
            q,
            async (snapshot) => {

                bookmarks =
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
                    "Bookmark realtime error:",
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
            bookmarks
                .map(
                    item =>
                        String(
                            item.animeId
                        )
                )
                .filter(Boolean)
        );


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
        bookmarks.filter(
            bookmark => {

                const anime =
                    animeCache.get(
                        String(
                            bookmark.animeId
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
                <i class="fa-solid fa-bookmark"></i>

                <h2>
                    ${
                        bookmarks.length
                            ? "ไม่พบ Anime"
                            : "ยังไม่มี Bookmark"
                    }
                </h2>

                <p>
                    ${
                        bookmarks.length
                            ? "ลองค้นหาชื่อ Anime อื่น"
                            : "Anime ที่บันทึกไว้จะแสดงที่นี่"
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
        bookmark => {

            const anime =
                animeCache.get(
                    String(
                        bookmark.animeId
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
                                bookmark.animeId
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
            bookmarks.length;

    }

}


// =====================================================
// CLEANUP
// =====================================================

function cleanup() {

    if (unsubscribeBookmarks) {

        unsubscribeBookmarks();
        unsubscribeBookmarks = null;

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