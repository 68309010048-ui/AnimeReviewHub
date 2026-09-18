// =====================================================
// Anime Review Hub
// script.js
// HOME REAL-TIME
// =====================================================

import { db } from "./firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// Elements
// =====================================================

const animeList =
    document.getElementById("animeList");

const searchBox =
    document.getElementById("searchAnime");


// =====================================================
// Variables
// =====================================================

let animeData = [];

let reviewData = [];

let currentCategory = "All";

let searchText = "";

let unsubscribeAnime = null;

let unsubscribeReviews = null;


// =====================================================
// REAL-TIME START
// =====================================================

function startRealtime() {

    // ================================================
    // Anime
    // ================================================

    unsubscribeAnime =
        onSnapshot(
            collection(
                db,
                "anime"
            ),
            (snapshot) => {

                animeData =
                    snapshot.docs.map(
                        docSnap => ({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        })
                    );


                renderCurrent();

            },

            (error) => {

                console.error(
                    "Anime realtime error:",
                    error
                );

                showError(
                    "โหลด Anime ไม่สำเร็จ"
                );

            }
        );


    // ================================================
    // Reviews
    // ================================================

    unsubscribeReviews =
        onSnapshot(
            collection(
                db,
                "reviews"
            ),
            (snapshot) => {

                reviewData =
                    snapshot.docs.map(
                        docSnap => ({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        })
                    );


                renderCurrent();

            },

            (error) => {

                console.error(
                    "Review realtime error:",
                    error
                );

                renderCurrent();

            }
        );

}


// =====================================================
// Filter
// =====================================================

function getFilteredAnime() {

    let list =
        [...animeData];


    // ================================================
    // Category
    // ================================================

    if (
        currentCategory &&
        currentCategory !== "All"
    ) {

        list =
            list.filter(
                anime => {

                    const categories =
                        normalizeCategories(
                            anime.category
                        );


                    return categories.some(
                        category =>
                            String(category)
                                .toLowerCase() ===
                            String(
                                currentCategory
                            ).toLowerCase()
                    );

                }
            );

    }


    // ================================================
    // Search
    // ================================================

    const keyword =
        searchText
            .trim()
            .toLowerCase();


    if (keyword) {

        list =
            list.filter(
                anime => {

                    const title =
                        String(
                            anime.title || ""
                        ).toLowerCase();


                    const categories =
                        normalizeCategories(
                            anime.category
                        )
                        .join(" ")
                        .toLowerCase();


                    return (
                        title.includes(keyword) ||
                        categories.includes(keyword)
                    );

                }
            );

    }


    return list;

}


// =====================================================
// Apply Current
// =====================================================

function renderCurrent() {

    const list =
        getFilteredAnime();


    renderAnime(list);

}


// =====================================================
// Render Anime
// =====================================================

function renderAnime(list) {

    if (!animeList) {
        return;
    }


    animeList.innerHTML =
        "";


    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        animeList.innerHTML = `
            <div class="empty">
                <i class="fa-solid fa-film"></i>

                <h2>
                    ไม่พบ Anime
                </h2>

                <p>
                    ลองเปลี่ยนคำค้นหาหรือหมวดหมู่
                </p>
            </div>
        `;

        return;

    }


    list.forEach(
        anime => {

            const rating =
                getAverageScore(
                    anime.id
                );


            const categories =
                normalizeCategories(
                    anime.category
                );


            const categoryHTML =
                categories
                    .slice(0, 3)
                    .map(
                        category => `
                            <span>
                                ${escapeHTML(
                                    category
                                )}
                            </span>
                        `
                    )
                    .join("");


            const image =
                anime.image ||
                anime.imageURL ||
                anime.photo ||
                "";


            const title =
                anime.title ||
                "ไม่มีชื่อ";


            animeList.innerHTML += `
                <div class="card">

                    <img
                        src="${escapeAttribute(image)}"
                        alt="${escapeAttribute(title)}"
                        onerror="this.src='https://placehold.co/600x800?text=No+Image';"
                    >

                    <div class="card-content">

                        <h3>
                            ${escapeHTML(title)}
                        </h3>


                        <div class="genre">

                            ${
                                categoryHTML ||
                                "<span>Anime</span>"
                            }

                        </div>


                        <div class="rating">

                            <div class="score">

                                <i class="fa-solid fa-star"></i>

                                ${rating.score.toFixed(1)}

                            </div>


                            <div class="review-count">

                                ${rating.count}
                                รีวิว

                            </div>

                        </div>


                        <button
                            type="button"
                            data-id="${escapeAttribute(
                                anime.id
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


    // ================================================
    // Detail Buttons
    // ================================================

    animeList
        .querySelectorAll(
            ".detail-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        showDetail(id);

                    }
                );

            }
        );

}


// =====================================================
// Average Score
// =====================================================

function getAverageScore(
    animeId
) {

    const reviews =
        reviewData.filter(
            review =>
                String(
                    review.animeId
                ) ===
                String(animeId)
        );


    if (
        reviews.length === 0
    ) {

        return {
            score: 0,
            count: 0
        };

    }


    const total =
        reviews.reduce(
            (
                sum,
                review
            ) => {

                return (
                    sum +
                    Number(
                        review.rating || 0
                    )
                );

            },
            0
        );


    return {

        score:
            total /
            reviews.length,

        count:
            reviews.length

    };

}


// =====================================================
// Category
// Support:
// filterAnime("Action")
// filterAnime(event, "Action")
// =====================================================

window.filterAnime =
    function (
        eventOrCategory,
        categoryValue
    ) {

        let category;


        if (
            typeof eventOrCategory ===
            "string"
        ) {

            category =
                eventOrCategory;

        }
        else {

            category =
                categoryValue;

        }


        currentCategory =
            category || "All";


        // ============================================
        // Update Active Button
        // ============================================

        let event =
            eventOrCategory;


        if (
            event &&
            event.currentTarget
        ) {

            document
                .querySelectorAll(
                    ".category button"
                )
                .forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


            event.currentTarget.classList.add(
                "active"
            );

        }
        else {

            document
                .querySelectorAll(
                    ".category button"
                )
                .forEach(
                    button => {

                        const text =
                            button.textContent
                                .trim()
                                .toLowerCase();


                        button.classList.toggle(
                            "active",
                            text ===
                                String(
                                    currentCategory
                                ).toLowerCase()
                        );

                    }
                );

        }


        renderCurrent();

    };


// =====================================================
// Search
// =====================================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        () => {

            searchText =
                searchBox.value;

            renderCurrent();

        }
    );

}


// =====================================================
// Show Detail
// =====================================================

function showDetail(id) {

    if (!id) {
        return;
    }


    localStorage.setItem(
        "animeId",
        id
    );


    window.location.href =
        "pages/detail.html";

}


// =====================================================
// Categories
// =====================================================

function normalizeCategories(
    category
) {

    if (Array.isArray(category)) {

        return category
            .filter(Boolean)
            .map(
                item =>
                    String(item)
            );

    }


    if (
        category === null ||
        category === undefined
    ) {

        return [];

    }


    return String(category)
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


// =====================================================
// Escape
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


function escapeAttribute(value) {

    return escapeHTML(
        value
    )
        .replace(
            /`/g,
            "&#096;"
        );

}


// =====================================================
// Error
// =====================================================

function showError(message) {

    if (!animeList) {
        return;
    }


    animeList.innerHTML = `
        <div class="empty">

            <i class="fa-solid fa-circle-xmark"></i>

            <h2>
                ${escapeHTML(message)}
            </h2>

        </div>
    `;

}


// =====================================================
// Start
// =====================================================

startRealtime();