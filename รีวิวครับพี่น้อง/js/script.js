// =====================================================
// Anime Review Hub
// script.js
// HOME REAL-TIME + CATEGORY
// =====================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// ELEMENTS
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
// VARIABLES
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
// START REAL-TIME
// =====================================================

function startRealtime() {

    console.log(
        "เริ่มระบบ Home Real-time..."
    );


    // =================================================
    // STOP OLD LISTENERS
    // =================================================

    stopRealtime();


    // =================================================
    // ANIME REAL-TIME
    // =================================================

    unsubscribeAnime =
        onSnapshot(
            collection(
                db,
                "anime"
            ),

            (snapshot) => {

                console.log(
                    "Anime realtime update:",
                    snapshot.size
                );


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
    // REVIEWS REAL-TIME
    // =================================================

    unsubscribeReviews =
        onSnapshot(
            collection(
                db,
                "reviews"
            ),

            (snapshot) => {

                console.log(
                    "Review realtime update:",
                    snapshot.size
                );


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

            }
        );

}


// =====================================================
// STOP REAL-TIME
// =====================================================

function stopRealtime() {

    if (
        typeof unsubscribeAnime ===
        "function"
    ) {

        unsubscribeAnime();

        unsubscribeAnime =
            null;

    }


    if (
        typeof unsubscribeReviews ===
        "function"
    ) {

        unsubscribeReviews();

        unsubscribeReviews =
            null;

    }

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        console.log(
            "Home Auth:",
            user
                ? user.uid
                : "ไม่ได้ Login"
        );


        // =================================================
        // NOT LOGIN
        // =================================================

        if (!user) {

            stopRealtime();

            animeData = [];

            reviewData = [];

            if (animeList) {

                animeList.innerHTML = `

                    <div class="empty">

                        <i class="fa-solid fa-lock"></i>

                        <h2>
                            กรุณาเข้าสู่ระบบ
                        </h2>

                        <p>
                            ต้องเข้าสู่ระบบก่อนจึงจะดู Anime ได้
                        </p>

                    </div>

                `;

            }

            return;

        }


        // =================================================
        // LOGIN SUCCESS
        // =================================================

        startRealtime();

    }
);


// =====================================================
// GET FILTERED ANIME
// =====================================================

function getFilteredAnime() {

    let list =
        [...animeData];


    // =================================================
    // CATEGORY FILTER
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
    // SEARCH FILTER
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
// RENDER CURRENT
// =====================================================

function renderCurrent() {

    const list =
        getFilteredAnime();


    renderAnime(
        list
    );

}


// =====================================================
// RENDER ANIME
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
    // EMPTY
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
    // CARDS
    // =================================================

    list.forEach(
        anime => {


            // =========================================
            // SCORE
            // =========================================

            const rating =
                getAverageScore(
                    anime.id
                );


            // =========================================
            // CATEGORY
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
            // IMAGE
            // =========================================

            const image =
                anime.image ||
                anime.imageURL ||
                anime.photo ||
                "https://placehold.co/600x800?text=No+Image";


            // =========================================
            // TITLE
            // =========================================

            const title =
                anime.title ||
                "ไม่มีชื่อ";


            // =========================================
            // CARD
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
            // IMAGE ERROR
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
            // DETAIL
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
// AVERAGE SCORE
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
        // filterAnime("Action")
        // =================================================

        if (
            typeof eventOrCategory ===
            "string"
        ) {

            category =
                eventOrCategory;

        }


        // =================================================
        // filterAnime(event, "Action")
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
        // SAVE CATEGORY
        // =================================================

        currentCategory =
            category ||
            "All";


        // =================================================
        // ACTIVE BUTTON
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
        // RENDER
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
// NORMALIZE CATEGORY
// =====================================================

function normalizeCategories(
    category
) {


    // =================================================
    // ARRAY
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
    // EMPTY
    // =================================================

    if (
        category === null ||
        category === undefined
    ) {

        return [];

    }


    // =================================================
    // STRING
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
// ESCAPE HTML
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
// ESCAPE ATTRIBUTE
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

            <p>
                เปิด F12 → Console เพื่อตรวจสอบข้อผิดพลาด
            </p>

        </div>

    `;

}