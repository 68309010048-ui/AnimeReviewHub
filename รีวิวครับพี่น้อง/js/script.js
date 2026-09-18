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

const categoryToggle =
    document.getElementById("categoryToggle");

const categorySection =
    document.querySelector(".category-section");

const categoryArrow =
    document.getElementById("categoryArrow");


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
// CATEGORY TOGGLE
// =====================================================

if (
    categoryToggle &&
    categorySection
) {

    categoryToggle.addEventListener(
        "click",
        () => {

            const isOpen =
                categorySection.classList.toggle(
                    "open"
                );


            if (categoryArrow) {

                categoryArrow.style.transform =
                    isOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)";

            }

        }
    );

}


// =====================================================
// REAL-TIME START
// =====================================================

function startRealtime() {


    // =================================================
    // Anime
    // =================================================

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


    // =================================================
    // Reviews
    // =================================================

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
// Get Filtered Anime
// =====================================================

function getFilteredAnime() {

    let list =
        [...animeData];


    // =================================================
    // CATEGORY
    // =================================================

    if (
        currentCategory &&
        currentCategory !== "All"
    ) {

        const selectedCategory =
            String(
                currentCategory
            )
                .trim()
                .toLowerCase();


        list =
            list.filter(
                anime => {

                    const categories =
                        normalizeCategories(
                            anime.category
                        );


                    return categories.some(
                        category => {

                            return (
                                String(
                                    category
                                )
                                    .trim()
                                    .toLowerCase()
                                ===
                                selectedCategory
                            );

                        }
                    );

                }
            );

    }


    // =================================================
    // SEARCH
    // =================================================

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
                        )
                            .toLowerCase();


                    const categories =
                        normalizeCategories(
                            anime.category
                        )
                            .join(" ")
                            .toLowerCase();


                    return (
                        title.includes(
                            keyword
                        )
                        ||
                        categories.includes(
                            keyword
                        )
                    );

                }
            );

    }


    return list;

}


// =====================================================
// Render Current
// =====================================================

function renderCurrent() {

    const list =
        getFilteredAnime();


    renderAnime(
        list
    );

}


// =====================================================
// Render Anime
// =====================================================

function renderAnime(
    list
) {

    if (!animeList) {
        return;
    }


    animeList.innerHTML =
        "";


    // =================================================
    // Empty
    // =================================================

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


    // =================================================
    // Create Cards
    // =================================================

    list.forEach(
        anime => {


            // =========================================
            // Rating
            // =========================================

            const rating =
                getAverageScore(
                    anime.id
                );


            // =========================================
            // Category
            // =========================================

            const categories =
                normalizeCategories(
                    anime.category
                );


            const categoryHTML =
                categories
                    .slice(
                        0,
                        3
                    )
                    .map(
                        category => {

                            return `

                                <span>
                                    ${
                                        escapeHTML(
                                            category
                                        )
                                    }
                                </span>

                            `;

                        }
                    )
                    .join("");


            // =========================================
            // Image
            // =========================================

            const image =
                anime.image ||
                anime.imageURL ||
                anime.photo ||
                "https://placehold.co/600x800?text=No+Image";


            // =========================================
            // Title
            // =========================================

            const title =
                anime.title ||
                "ไม่มีชื่อ";


            // =========================================
            // Card
            // =========================================

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            card.innerHTML = `

                <img
                    class="anime-image"
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
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

                            ${
                                Number(
                                    rating.score
                                ).toFixed(1)
                            }

                        </div>


                        <div class="review-count">

                            ${
                                rating.count
                            }

                            รีวิว

                        </div>


                    </div>


                    <button
                        type="button"
                        class="detail-btn"
                        data-id="${escapeAttribute(
                            anime.id
                        )}"
                    >

                        ดูรายละเอียด

                    </button>


                </div>

            `;


            // =========================================
            // Image Error
            // =========================================

            const imageElement =
                card.querySelector(
                    ".anime-image"
                );


            if (imageElement) {

                imageElement.addEventListener(
                    "error",
                    () => {

                        imageElement.src =
                            "https://placehold.co/600x800?text=No+Image";

                    }
                );

            }


            // =========================================
            // Detail Button
            // =========================================

            const detailButton =
                card.querySelector(
                    ".detail-btn"
                );


            if (detailButton) {

                detailButton.addEventListener(
                    "click",
                    () => {

                        const id =
                            detailButton.dataset.id;


                        showDetail(
                            id
                        );

                    }
                );

            }


            animeList.appendChild(
                card
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
            review => {

                return (
                    String(
                        review.animeId
                    )
                    ===
                    String(
                        animeId
                    )
                );

            }
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
// CATEGORY FILTER
// =====================================================
// รองรับ:
//
// filterAnime("Action")
//
// และ:
//
// filterAnime(event, "Action")
// =====================================================

window.filterAnime =
    function (
        eventOrCategory,
        categoryValue
    ) {


        let category =
            "All";


        let clickedButton =
            null;


        // =================================================
        // กรณี filterAnime("Action")
        // =================================================

        if (
            typeof eventOrCategory ===
            "string"
        ) {

            category =
                eventOrCategory;

        }


        // =================================================
        // กรณี filterAnime(event, "Action")
        // =================================================

        else {

            clickedButton =
                eventOrCategory?.currentTarget ||
                null;


            category =
                categoryValue ||
                "All";

        }


        // =================================================
        // Save Category
        // =================================================

        currentCategory =
            category ||
            "All";


        // =================================================
        // Remove Active
        // =================================================

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


        // =================================================
        // Add Active
        // =================================================

        if (
            clickedButton
        ) {

            clickedButton.classList.add(
                "active"
            );

        }

        else {

            const selected =
                String(
                    currentCategory
                )
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    ".category button"
                )
                .forEach(
                    button => {

                        const dataCategory =
                            button.dataset.category;


                        if (
                            dataCategory &&
                            String(
                                dataCategory
                            )
                                .trim()
                                .toLowerCase()
                            ===
                            selected
                        ) {

                            button.classList.add(
                                "active"
                            );

                        }

                    }
                );

        }


        // =================================================
        // Filter
        // =================================================

        renderCurrent();

    };


// =====================================================
// SEARCH
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
// SHOW DETAIL
// =====================================================

function showDetail(
    id
) {

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
// Normalize Categories
// =====================================================

function normalizeCategories(
    category
) {


    // =================================================
    // Array
    // =================================================

    if (
        Array.isArray(
            category
        )
    ) {

        return category

            .filter(
                Boolean
            )

            .map(
                item =>
                    String(
                        item
                    ).trim()
            )

            .filter(
                Boolean
            );

    }


    // =================================================
    // Null / Undefined
    // =================================================

    if (
        category === null ||
        category === undefined
    ) {

        return [];

    }


    // =================================================
    // String
    // =================================================

    return String(
        category
    )
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(
            Boolean
        );

}


// =====================================================
// Escape HTML
// =====================================================

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


// =====================================================
// Escape Attribute
// =====================================================

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


// =====================================================
// ERROR
// =====================================================

function showError(
    message
) {

    if (!animeList) {
        return;
    }


    animeList.innerHTML = `

        <div class="empty">

            <i class="fa-solid fa-circle-xmark"></i>

            <h2>
                ${
                    escapeHTML(
                        message
                    )
                }
            </h2>

        </div>

    `;

}


// =====================================================
// START REAL-TIME
// =====================================================

startRealtime();