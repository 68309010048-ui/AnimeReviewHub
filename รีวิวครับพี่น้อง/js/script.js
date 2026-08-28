// =====================================================
// Anime Review Hub
// script.js
// =====================================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// Elements
// =====================================================

const animeList = document.getElementById("animeList");

const searchBox = document.getElementById("searchAnime");


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


    animeList.innerHTML = `
        <div class="loading">
            <div class="loader"></div>
        </div>
    `;


    try {

        const animeSnap =
            await getDocs(
                collection(
                    db,
                    "anime"
                )
            );


        const reviewSnap =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        // =========================
        // Anime
        // =========================

        animeData =
            animeSnap.docs.map(
                docSnap => ({

                    id: docSnap.id,

                    ...docSnap.data()

                })
            );


        // =========================
        // Reviews
        // =========================

        reviewData =
            reviewSnap.docs.map(
                docSnap => ({

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
            review =>
                String(
                    review.animeId
                ) === String(
                    animeId
                )
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
// Render Anime
// =====================================================

function renderAnime(list) {

    if (!animeList) return;


    animeList.innerHTML = "";


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
                    ลองเลือกหมวดหมู่ใหม่
                </p>

            </div>
        `;

        return;
    }


    list.forEach(
        item => {

            const result =
                getAverageScore(
                    item.id
                );


            // =========================
            // Category
            // =========================

            let categories = [];


            if (
                Array.isArray(
                    item.category
                )
            ) {

                categories =
                    item.category;

            }
            else if (
                item.category
            ) {

                categories = [
                    item.category
                ];

            }


            let categoryHTML = "";


            categories.forEach(
                cat => {

                    categoryHTML += `
                        <span>
                            ${escapeHTML(cat)}
                        </span>
                    `;

                }
            );


            if (!categoryHTML) {

                categoryHTML = `
                    <span>-</span>
                `;

            }


            // =========================
            // Image
            // =========================

            const image =
                item.image ||
                "https://via.placeholder.com/400x550?text=No+Image";


            // =========================
            // Title
            // =========================

            const title =
                item.title ||
                "ไม่มีชื่อ";


            // =========================
            // Card
            // =========================

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            card.innerHTML = `

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(title)}"
                    class="anime-image"
                    loading="lazy"
                >


                <div class="card-content">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>


                    <div class="genre">

                        ${categoryHTML}

                    </div>


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


                    <button
                        type="button"
                        class="detail-btn">

                        ดูรายละเอียด

                    </button>


                </div>

            `;


            // =========================
            // Image Error
            // =========================

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


            // =========================
            // Detail
            // =========================

            const detailButton =
                card.querySelector(
                    ".detail-btn"
                );


            if (detailButton) {

                detailButton.addEventListener(
                    "click",
                    () => {

                        localStorage.setItem(
                            "animeId",
                            item.id
                        );


                        window.location.href =
                            "pages/detail.html";

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
// Category Filter
// =====================================================

function filterAnime(
    event,
    category
) {

    currentCategory =
        category || "All";


    // =========================
    // Active
    // =========================

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
            item => {


                // =========================
                // Search
                // =========================

                const title =
                    String(
                        item.title || ""
                    )
                        .toLowerCase();


                const matchKeyword =
                    title.includes(
                        keyword
                    );


                // =========================
                // Category
                // =========================

                let matchCategory =
                    true;


                if (
                    currentCategory !==
                    "All"
                ) {

                    const categories =
                        Array.isArray(
                            item.category
                        )
                            ? item.category
                            : item.category
                                ? [item.category]
                                : [];


                    matchCategory =
                        categories.some(
                            cat => {

                                return (
                                    String(
                                        cat
                                    )
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
// Make Filter Available To HTML
// =====================================================

window.filterAnime =
    filterAnime;


// =====================================================
// Clear Search
// =====================================================

window.clearSearch =
    function() {

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
                button => {

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

    if (!id) return;


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
// Reload
// =====================================================

window.reloadAnime =
    async function() {

        await loadData();

    };


// =====================================================
// Start
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadData();

    }
);


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


function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}

