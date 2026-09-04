// =====================================================
// Anime Review Hub
// script.js
// HOME
// =====================================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs
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


// =====================================================
// Variables
// =====================================================

let animeData = [];

let reviewData = [];

let currentCategory = "All";


// =====================================================
// Load Data
// =====================================================

async function loadData() {

    console.log("เริ่มโหลดข้อมูล Anime...");


    if (!animeList) {

        console.error(
            "ไม่พบ #animeList"
        );

        return;
    }


    // Loading
    animeList.innerHTML = `
        <div class="loading">

            <div class="loader"></div>

            <p>
                กำลังโหลดข้อมูล Anime...
            </p>

        </div>
    `;


    try {

        // =================================================
        // Load Anime
        // =================================================

        const animeSnap =
            await getDocs(
                collection(
                    db,
                    "anime"
                )
            );


        // =================================================
        // Load Reviews
        // =================================================

        const reviewSnap =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        // =================================================
        // Anime Data
        // =================================================

        animeData =
            animeSnap.docs.map(
                (docSnap) => ({

                    id: docSnap.id,

                    ...docSnap.data()

                })
            );


        // =================================================
        // Review Data
        // =================================================

        reviewData =
            reviewSnap.docs.map(
                (docSnap) => ({

                    id: docSnap.id,

                    ...docSnap.data()

                })
            );


        console.log(
            "Anime จำนวน =",
            animeData.length
        );


        console.log(
            "Review จำนวน =",
            reviewData.length
        );


        // =================================================
        // Render
        // =================================================

        renderAnime(
            animeData
        );

    }
    catch (error) {

        console.error(
            "Firestore Error:",
            error
        );


        animeList.innerHTML = `

            <div class="empty">

                <i class="fa-solid fa-circle-xmark"></i>

                <h2>
                    โหลดข้อมูลไม่สำเร็จ
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;
    }

}


// =====================================================
// Average Score
// =====================================================

function getAverageScore(animeId) {

    const reviews =
        reviewData.filter(
            (review) => {

                return String(
                    review.animeId
                ) === String(
                    animeId
                );

            }
        );


    // ไม่มีรีวิว
    if (reviews.length === 0) {

        return {

            score: 0,

            count: 0

        };

    }


    // =================================================
    // รวมคะแนน
    // =================================================

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
// Normalize Categories
// =====================================================

function getCategories(item) {

    if (
        Array.isArray(
            item.category
        )
    ) {

        return item.category;

    }


    if (item.category) {

        return [
            item.category
        ];

    }


    return [];

}


// =====================================================
// Render Anime
// =====================================================

function renderAnime(list) {

    if (!animeList) {
        return;
    }


    animeList.innerHTML = "";


    // =================================================
    // No Result
    // =================================================

    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        animeList.innerHTML = `

            <div class="empty">

                <i class="fa-solid fa-film"></i>

                <h2>
                    ไม่พบอนิเมะ
                </h2>

                <p>
                    ลองค้นหาหรือเลือกหมวดหมู่อื่น
                </p>

            </div>

        `;

        return;

    }


    // =================================================
    // Render Each Anime
    // =================================================

    list.forEach(
        (item) => {

            // -----------------------------------------
            // Rating
            // -----------------------------------------

            const result =
                getAverageScore(
                    item.id
                );


            // -----------------------------------------
            // Categories
            // -----------------------------------------

            const categories =
                getCategories(item);


            let categoryHTML = "";


            categories.forEach(
                (cat) => {

                    categoryHTML += `

                        <span>
                            ${escapeHTML(cat)}
                        </span>

                    `;

                }
            );


            if (!categoryHTML) {

                categoryHTML = `

                    <span>
                        -
                    </span>

                `;

            }


            // -----------------------------------------
            // Image
            // -----------------------------------------

            const image =
                item.image ||
                "https://via.placeholder.com/400x550?text=No+Image";


            // -----------------------------------------
            // Title
            // -----------------------------------------

            const title =
                item.title ||
                "ไม่มีชื่อ";


            // -----------------------------------------
            // Create Card
            // -----------------------------------------

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            card.innerHTML = `

                <!-- Poster -->

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(title)}"
                    class="anime-image"
                    loading="lazy"
                >


                <!-- Content -->

                <div class="card-content">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>


                    <!-- Categories -->

                    <div class="genre">

                        ${categoryHTML}

                    </div>


                    <!-- Rating -->

                    <div class="rating">

                        <div class="score">

                            <i class="fa-solid fa-star"></i>

                            ${
                                result.score > 0
                                    ? result.score.toFixed(1)
                                    : "0.0"
                            }

                        </div>


                        <div class="review-count">

                            ${result.count} รีวิว

                        </div>

                    </div>


                    <!-- Detail Button -->

                    <button
                        type="button"
                        class="detail-btn">

                        ดูรายละเอียด

                    </button>

                </div>

            `;


            // =================================================
            // Image Error
            // =================================================

            const imageElement =
                card.querySelector(
                    ".anime-image"
                );


            if (imageElement) {

                imageElement.addEventListener(
                    "error",
                    () => {

                        imageElement.src =
                            "https://via.placeholder.com/400x550?text=No+Image";

                    }
                );

            }


            // =================================================
            // Detail Button
            // =================================================

            const detailButton =
                card.querySelector(
                    ".detail-btn"
                );


            if (detailButton) {

                detailButton.addEventListener(
                    "click",
                    () => {

                        showDetail(
                            item.id
                        );

                    }
                );

            }


            // =================================================
            // Add Card
            // =================================================

            animeList.appendChild(
                card
            );

        }
    );

}


// =====================================================
// Category Filter
// =====================================================

function filterAnime(
    event,
    category
) {

    currentCategory =
        category || "All";


    // =================================================
    // Remove Active
    // =================================================

    document
        .querySelectorAll(
            ".category button"
        )
        .forEach(
            (button) => {

                button.classList.remove(
                    "active"
                );

            }
        );


    // =================================================
    // Add Active
    // =================================================

    if (
        event &&
        event.currentTarget
    ) {

        event.currentTarget.classList.add(
            "active"
        );

    }


    applyFilter();

}


// =====================================================
// Apply Filter
// =====================================================

function applyFilter() {

    const keyword =
        searchBox
            ? searchBox.value
                .trim()
                .toLowerCase()
            : "";


    const result =
        animeData.filter(
            (item) => {

                // =====================================
                // Search
                // =====================================

                const title =
                    String(
                        item.title || ""
                    )
                        .trim()
                        .toLowerCase();


                const matchKeyword =
                    title.includes(
                        keyword
                    );


                // =====================================
                // Category
                // =====================================

                let matchCategory =
                    true;


                if (
                    currentCategory !==
                    "All"
                ) {

                    const categories =
                        getCategories(item);


                    matchCategory =
                        categories.some(
                            (cat) => {

                                return (

                                    String(cat)
                                        .trim()
                                        .toLowerCase()

                                    ===

                                    String(
                                        currentCategory
                                    )
                                        .trim()
                                        .toLowerCase()

                                );

                            }
                        );

                }


                return (
                    matchKeyword &&
                    matchCategory
                );

            }
        );


    renderAnime(
        result
    );

}


// =====================================================
// Search
// =====================================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        () => {

            applyFilter();

        }
    );

}


// =====================================================
// Category Open / Close
// =====================================================

if (
    categoryToggle &&
    categorySection
) {

    categoryToggle.addEventListener(
        "click",
        () => {

            categorySection.classList.toggle(
                "open"
            );

        }
    );

}


// =====================================================
// Make Filter Available to HTML
// =====================================================

window.filterAnime =
    filterAnime;


// =====================================================
// Clear Search
// =====================================================

window.clearSearch =
    function () {

        if (searchBox) {

            searchBox.value = "";

        }


        currentCategory =
            "All";


        document
            .querySelectorAll(
                ".category button"
            )
            .forEach(
                (button) => {

                    button.classList.remove(
                        "active"
                    );

                }
            );


        const firstButton =
            document.querySelector(
                ".category button"
            );


        if (firstButton) {

            firstButton.classList.add(
                "active"
            );

        }


        renderAnime(
            animeData
        );

    };


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


window.showDetail =
    showDetail;


// =====================================================
// Reload Anime
// =====================================================

window.reloadAnime =
    async function () {

        await loadData();

    };


// =====================================================
// Escape HTML
// =====================================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// Escape Attribute
// =====================================================

function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


// =====================================================
// Start
// =====================================================

loadData();