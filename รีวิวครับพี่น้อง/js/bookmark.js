// =====================================================
// Anime Review Hub
// bookmark.js
// =====================================================

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


// =====================================================
// Elements
// =====================================================

const bookmarkList =
    document.getElementById("bookmarkList");

const bookmarkCount =
    document.getElementById("bookmarkCount");

const emptyBox =
    document.getElementById("emptyBox");

const searchInput =
    document.getElementById("searchBookmark");


// =====================================================
// Variables
// =====================================================

let bookmarkAnime = [];

let reviewData = [];

let currentUser = null;


// =====================================================
// Authentication
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        currentUser = user;

        await loadData();

    }
);


// =====================================================
// Load Bookmark + Reviews
// =====================================================

async function loadData() {

    try {

        bookmarkAnime = [];
        reviewData = [];


        bookmarkList.innerHTML = `
            <div class="loading">

                <div class="loader"></div>

                <p>
                    กำลังโหลด Bookmark...
                </p>

            </div>
        `;


        // ==============================================
        // Load Bookmark
        // ==============================================

        const bookmarkQuery =
            query(
                collection(db, "bookmarks"),
                where(
                    "uid",
                    "==",
                    currentUser.uid
                )
            );


        const bookmarkSnap =
            await getDocs(
                bookmarkQuery
            );


        bookmarkSnap.forEach(
            (docSnap) => {

                bookmarkAnime.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        // ==============================================
        // Load Reviews
        // ==============================================

        const reviewSnap =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        reviewSnap.forEach(
            (docSnap) => {

                reviewData.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        showBookmark(
            bookmarkAnime
        );

    }
    catch (error) {

        console.error(
            "Load Bookmark Error:",
            error
        );


        bookmarkList.innerHTML = `
            <div class="loading">

                <p>
                    โหลดข้อมูลไม่สำเร็จ
                </p>

            </div>
        `;

    }

}


// =====================================================
// Get Average Review
// =====================================================

function getAverageReview(animeId) {

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


    if (reviews.length === 0) {

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
            total / reviews.length,

        count:
            reviews.length

    };

}


// =====================================================
// Category
// =====================================================

function getCategoryText(category) {

    if (Array.isArray(category)) {

        return category.join(", ");

    }


    return category ||
        "ไม่ระบุหมวดหมู่";

}


// =====================================================
// Show Bookmark
// =====================================================

function showBookmark(list) {

    bookmarkList.innerHTML = "";


    if (bookmarkCount) {

        bookmarkCount.textContent =
            list.length;

    }


    // ==============================================
    // Empty
    // ==============================================

    if (list.length === 0) {

        bookmarkList.style.display =
            "none";


        if (emptyBox) {

            emptyBox.style.display =
                "block";

        }

        return;
    }


    bookmarkList.style.display =
        "grid";


    if (emptyBox) {

        emptyBox.style.display =
            "none";

    }


    // ==============================================
    // Cards
    // ==============================================

    list.forEach(
        (item) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            const title =
                item.title ||
                "ไม่มีชื่อ";


            const image =
                item.image ||
                "https://via.placeholder.com/400x550?text=No+Image";


            const category =
                getCategoryText(
                    item.category
                );


            // ==========================================
            // Review Average
            // ==========================================

            const review =
                getAverageReview(
                    item.animeId
                );


            const score =
                review.score > 0

                    ? review.score.toFixed(1)

                    : "0.0";


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

                        <span>
                            ${escapeHTML(category)}
                        </span>

                    </div>


                    <div class="rating">

                        <div class="score">

                            <i class="fa-solid fa-star"></i>

                            ${score}

                        </div>


                        <div class="review-count">

                            ${review.count} รีวิว

                        </div>

                    </div>


                    <button
                        type="button"
                        class="detail-btn">

                        ดูรายละเอียด

                    </button>


                    <button
                        type="button"
                        class="remove-btn">

                        🔖 ลบออก

                    </button>

                </div>

            `;


            // ==========================================
            // Image Error
            // ==========================================

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


            // ==========================================
            // Detail
            // ==========================================

            const detailButton =
                card.querySelector(
                    ".detail-btn"
                );


            detailButton.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        "animeId",
                        item.animeId
                    );


                    window.location.href =
                        "detail.html";

                }
            );


            // ==========================================
            // Remove
            // ==========================================

            const removeButton =
                card.querySelector(
                    ".remove-btn"
                );


            removeButton.addEventListener(
                "click",
                () => {

                    removeBookmark(
                        item.id
                    );

                }
            );


            bookmarkList.appendChild(
                card
            );

        }
    );

}


// =====================================================
// Search
// =====================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const keyword =
                searchInput.value
                    .trim()
                    .toLowerCase();


            const result =
                bookmarkAnime.filter(
                    (item) => {

                        const title =
                            String(
                                item.title || ""
                            )
                                .toLowerCase();


                        const category =
                            getCategoryText(
                                item.category
                            )
                                .toLowerCase();


                        return (
                            title.includes(keyword) ||
                            category.includes(keyword)
                        );

                    }
                );


            showBookmark(
                result
            );

        }
    );

}


// =====================================================
// Remove Bookmark
// =====================================================

async function removeBookmark(id) {

    if (!id) return;


    const confirmDelete =
        confirm(
            "ต้องการลบอนิเมะนี้ออกจาก Bookmark หรือไม่?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "bookmarks",
                id
            )
        );


        bookmarkAnime =
            bookmarkAnime.filter(
                (item) =>
                    item.id !== id
            );


        showBookmark(
            bookmarkAnime
        );

    }
    catch (error) {

        console.error(
            "Remove Bookmark Error:",
            error
        );


        alert(
            "ลบ Bookmark ไม่สำเร็จ"
        );

    }

}


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