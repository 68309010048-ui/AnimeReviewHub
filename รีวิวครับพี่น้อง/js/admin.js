// ======================================================
// Anime Review Hub
// admin.js
// Reviewer + Super Admin
// REAL-TIME ANIME + REVIEWS
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// ======================================================
// Elements
// ======================================================

const addBtn =
    document.getElementById(
        "addAnime"
    );

const cancelBtn =
    document.getElementById(
        "cancelEdit"
    );

const titleInput =
    document.getElementById(
        "title"
    );

const imageInput =
    document.getElementById(
        "image"
    );

const trailerInput =
    document.getElementById(
        "trailer"
    );

const descriptionInput =
    document.getElementById(
        "description"
    );

const episodesInput =
    document.getElementById(
        "episodes"
    );

const statusInput =
    document.getElementById(
        "status"
    );

const typeInput =
    document.getElementById(
        "type"
    );

const animeList =
    document.getElementById(
        "animeList"
    );

const searchBox =
    document.getElementById(
        "searchAnime"
    );

const animeCount =
    document.getElementById(
        "animeCount"
    );

const reviewerCount =
    document.getElementById(
        "reviewerCount"
    );

const reviewCount =
    document.getElementById(
        "reviewCount"
    );

const reviewedAnimeCount =
    document.getElementById(
        "reviewedAnimeCount"
    );

const roleInfo =
    document.getElementById(
        "roleInfo"
    );

const animeResultText =
    document.getElementById(
        "animeResultText"
    );

const animeToggle =
    document.getElementById(
        "animeToggle"
    );

const animeSection =
    document.querySelector(
        ".anime-section"
    );

const reviewSection =
    document.getElementById(
        "reviewSection"
    );

const selectedAnime =
    document.getElementById(
        "selectedAnime"
    );

const selectedAnimeText =
    document.getElementById(
        "selectedAnimeText"
    );

const selectedReviewList =
    document.getElementById(
        "selectedReviewList"
    );

const closeReview =
    document.getElementById(
        "closeReview"
    );

const formTitle =
    document.getElementById(
        "formTitle"
    );


// ======================================================
// Variables
// ======================================================

let currentUser = null;

let currentRole = "";

let editId = null;

let animeData = [];

let reviewData = [];

let searchText = "";

let unsubscribeAnime = null;

let unsubscribeReviews = null;


// ======================================================
// AUTHENTICATION
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        cleanupRealtime();


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        try {

            const userSnap =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (!userSnap.exists()) {

                alert(
                    "ไม่พบข้อมูลผู้ใช้"
                );

                window.location.href =
                    "../index.html";

                return;

            }


            const userData =
                userSnap.data();


            currentRole =
                userData.role ||
                "user";


            if (
                currentRole !== "admin" &&
                currentRole !== "superadmin"
            ) {

                alert(
                    "คุณไม่มีสิทธิ์เข้าหน้านี้"
                );

                window.location.href =
                    "../index.html";

                return;

            }


            updateRoleUI();

            startAnimeRealtime();

            startReviewRealtime();

        }
        catch (error) {

            console.error(
                "Auth Error:",
                error
            );

            alert(
                "ไม่สามารถตรวจสอบสิทธิ์ได้"
            );

        }

    }
);


// ======================================================
// ROLE UI
// ======================================================

function updateRoleUI() {

    if (!roleInfo) {
        return;
    }


    if (
        currentRole ===
        "superadmin"
    ) {

        roleInfo.innerHTML = `
            <i class="fa-solid fa-crown"></i>

            <span>
                Super Admin — จัดการ Anime และรีวิวได้ทั้งหมด
            </span>
        `;

    }
    else {

        roleInfo.innerHTML = `
            <i class="fa-solid fa-user-shield"></i>

            <span>
                Reviewer — จัดการเฉพาะ Anime ที่คุณเพิ่ม
            </span>
        `;

    }

}


// ======================================================
// ANIME REALTIME
// ======================================================

function startAnimeRealtime() {

    unsubscribeAnime =
        onSnapshot(
            collection(
                db,
                "anime"
            ),
            (snapshot) => {

                const allAnime =
                    snapshot.docs.map(
                        docSnap => ({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        })
                    );


                if (
                    currentRole ===
                    "admin"
                ) {

                    animeData =
                        allAnime.filter(
                            anime =>
                                anime.createdBy ===
                                currentUser.uid
                        );

                }
                else {

                    animeData =
                        allAnime;

                }


                updateDashboard();

                renderAnime();

            },

            (error) => {

                console.error(
                    "Anime realtime error:",
                    error
                );

            }
        );

}


// ======================================================
// REVIEW REALTIME
// ======================================================

function startReviewRealtime() {

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


                updateDashboard();

                renderAnime();


                // ถ้าเปิดรีวิวอยู่
                // ให้รีเฟรชเฉพาะ Anime ที่เลือก

                if (
                    reviewSection &&
                    reviewSection.style.display !==
                        "none"
                ) {

                    const selectedId =
                        selectedAnime
                            ?.dataset
                            ?.animeId;


                    if (selectedId) {

                        const anime =
                            animeData.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        selectedId
                                    )
                            );


                        if (anime) {

                            openReviewSection(
                                anime
                            );

                        }

                    }

                }

            },

            (error) => {

                console.error(
                    "Review realtime error:",
                    error
                );

            }
        );

}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    const shownAnimeIds =
        new Set(
            animeData.map(
                anime =>
                    String(
                        anime.id
                    )
            )
        );


    const shownReviews =
        reviewData.filter(
            review =>
                shownAnimeIds.has(
                    String(
                        review.animeId
                    )
                )
        );


    // Anime
    if (animeCount) {

        animeCount.textContent =
            animeData.length;

    }


    // Reviews
    if (reviewCount) {

        reviewCount.textContent =
            shownReviews.length;

    }


    // Unique reviewers
    const reviewerSet =
        new Set();


    shownReviews.forEach(
        review => {

            const key =
                review.uid ||
                review.email ||
                review.username;


            if (key) {

                reviewerSet.add(
                    String(key)
                );

            }

        }
    );


    if (reviewerCount) {

        reviewerCount.textContent =
            reviewerSet.size;

    }


    // Anime with reviews
    const reviewedSet =
        new Set();


    shownReviews.forEach(
        review => {

            if (
                review.animeId
            ) {

                reviewedSet.add(
                    String(
                        review.animeId
                    )
                );

            }

        }
    );


    if (reviewedAnimeCount) {

        reviewedAnimeCount.textContent =
            reviewedSet.size;

    }

}


// ======================================================
// RENDER ANIME
// ======================================================

function renderAnime() {

    if (!animeList) {
        return;
    }


    const keyword =
        searchText
            .trim()
            .toLowerCase();


    const filtered =
        animeData.filter(
            anime => {

                if (!keyword) {
                    return true;
                }


                const title =
                    String(
                        anime.title ||
                        ""
                    )
                    .toLowerCase();


                const category =
                    normalizeCategories(
                        anime.category
                    )
                    .join(" ")
                    .toLowerCase();


                return (
                    title.includes(
                        keyword
                    ) ||
                    category.includes(
                        keyword
                    )
                );

            }
        );


    if (animeResultText) {

        animeResultText.textContent =
            `${filtered.length} รายการ`;

    }


    animeList.innerHTML =
        "";


    if (
        filtered.length ===
        0
    ) {

        animeList.innerHTML = `
            <div class="empty-box">

                <i class="fa-solid fa-film"></i>

                <h3>
                    ไม่พบ Anime
                </h3>

                <p>
                    ลองเปลี่ยนคำค้นหา
                </p>

            </div>
        `;

        return;

    }


    filtered.forEach(
        anime => {

            animeList.innerHTML +=
                createAnimeCard(
                    anime
                );

        }
    );


    bindAnimeButtons();

}


// ======================================================
// CREATE CARD
// ======================================================

function createAnimeCard(
    anime
) {

    const reviews =
        getAnimeReviews(
            anime.id
        );


    const average =
        getAverageRating(
            reviews
        );


    const categories =
        normalizeCategories(
            anime.category
        );


    const image =
        anime.image ||
        anime.imageURL ||
        "";


    const canEdit =
        currentRole ===
            "superadmin" ||
        anime.createdBy ===
            currentUser.uid;


    return `
        <div
            class="anime-card"
            data-anime-id="${escapeAttribute(
                anime.id
            )}"
        >

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


            <div class="anime-info">

                <h3>
                    ${escapeHTML(
                        anime.title ||
                        "ไม่มีชื่อ"
                    )}
                </h3>


                <p class="anime-category">

                    <i class="fa-solid fa-tags"></i>

                    ${
                        categories.length
                            ? categories
                                .map(
                                    item =>
                                        escapeHTML(
                                            item
                                        )
                                )
                                .join(", ")
                            : "Anime"
                    }

                </p>


                <div class="anime-score-row">

                    <div class="anime-score">

                        <i class="fa-solid fa-star"></i>

                        ${average.toFixed(1)}

                    </div>


                    <span class="review-count">

                        ${reviews.length}
                        รีวิว

                    </span>

                </div>


                ${
                    anime.createdBy
                        ? `
                            <p class="owner-row">

                                <i class="fa-solid fa-user"></i>

                                ผู้เพิ่ม:
                                <strong>
                                    ${escapeHTML(
                                        anime.createdBy
                                    )}
                                </strong>

                            </p>
                        `
                        : ""
                }


                ${
                    anime.description
                        ? `
                            <p class="description">
                                ${escapeHTML(
                                    anime.description
                                )}
                            </p>
                        `
                        : ""
                }

            </div>


            <div class="action">

                <button
                    type="button"
                    class="reviewBtn"
                    data-action="review"
                    data-id="${escapeAttribute(
                        anime.id
                    )}"
                >

                    <i class="fa-solid fa-comments"></i>

                    ดูรีวิว

                </button>


                ${
                    canEdit
                        ? `
                            <button
                                type="button"
                                class="editBtn"
                                data-action="edit"
                                data-id="${escapeAttribute(
                                    anime.id
                                )}"
                            >

                                <i class="fa-solid fa-pen"></i>

                                แก้ไข

                            </button>


                            <button
                                type="button"
                                class="deleteBtn"
                                data-action="delete"
                                data-id="${escapeAttribute(
                                    anime.id
                                )}"
                            >

                                <i class="fa-solid fa-trash"></i>

                                ลบ

                            </button>
                        `
                        : `
                            <div class="no-permission">

                                <i class="fa-solid fa-lock"></i>

                                ไม่มีสิทธิ์แก้ไข

                            </div>
                        `
                }

            </div>

        </div>
    `;

}


// ======================================================
// BUTTON EVENTS
// ======================================================

function bindAnimeButtons() {

    animeList
        .querySelectorAll(
            "[data-action='review']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const anime =
                            animeData.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        button.dataset.id
                                    )
                            );


                        if (anime) {

                            openReviewSection(
                                anime
                            );

                        }

                    }
                );

            }
        );


    animeList
        .querySelectorAll(
            "[data-action='edit']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        startEdit(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    animeList
        .querySelectorAll(
            "[data-action='delete']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteAnime(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ======================================================
// REVIEW SECTION
// ======================================================

function openReviewSection(
    anime
) {

    if (!reviewSection) {
        return;
    }


    reviewSection.style.display =
        "block";


    if (selectedAnime) {

        selectedAnime.dataset.animeId =
            anime.id;

    }


    if (selectedAnimeText) {

        const reviews =
            getAnimeReviews(
                anime.id
            );


        selectedAnimeText.textContent =
            `${anime.title || "Anime"} — ${reviews.length} รีวิว`;

    }


    if (selectedAnime) {

        const reviews =
            getAnimeReviews(
                anime.id
            );


        const average =
            getAverageRating(
                reviews
            );


        const image =
            anime.image ||
            anime.imageURL ||
            "";


        selectedAnime.innerHTML = `
            <img
                class="selected-anime-image"
                src="${escapeAttribute(
                    image
                )}"
                alt="${escapeAttribute(
                    anime.title ||
                    "Anime"
                )}"
            >


            <div class="selected-anime-info">

                <h3>
                    ${escapeHTML(
                        anime.title ||
                        "ไม่มีชื่อ"
                    )}
                </h3>


                <div class="selected-anime-rating">

                    <span>
                        ⭐
                        ${average.toFixed(1)}
                    </span>

                    <small>
                        ${reviews.length}
                        รีวิว
                    </small>

                </div>

            </div>
        `;

    }


    renderSelectedReviews(
        anime.id
    );


    reviewSection.scrollIntoView(
        {
            behavior: "smooth",
            block: "start"
        }
    );

}


// ======================================================
// SELECTED REVIEWS
// ======================================================

function renderSelectedReviews(
    animeId
) {

    if (!selectedReviewList) {
        return;
    }


    const reviews =
        getAnimeReviews(
            animeId
        );


    selectedReviewList.innerHTML =
        "";


    if (
        reviews.length ===
        0
    ) {

        selectedReviewList.innerHTML = `
            <div class="review-empty">

                <div class="review-empty-icon">

                    <i class="fa-solid fa-comments"></i>

                </div>

                <h3>
                    ยังไม่มีรีวิว
                </h3>

                <p>
                    Anime นี้ยังไม่มีคนรีวิว
                </p>

            </div>
        `;

        return;

    }


    reviews.forEach(
        review => {

            const avatar =
                review.photoURL ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    review.username ||
                    "User"
                )}`;


            selectedReviewList.innerHTML += `
                <div class="selected-review-item">

                    <div class="selected-review-head">

                        <img
                            class="selected-review-avatar"
                            src="${escapeAttribute(
                                avatar
                            )}"
                            alt="${escapeAttribute(
                                review.username ||
                                "User"
                            )}"
                        >


                        <div class="selected-review-user">

                            <strong>
                                ${escapeHTML(
                                    review.username ||
                                    "User"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    review.email ||
                                    ""
                                )}
                            </small>

                        </div>


                        <div class="selected-review-stars">

                            ${createStars(
                                Number(
                                    review.rating ||
                                    0
                                )
                            )}

                        </div>

                    </div>


                    <div class="selected-review-comment">

                        ${escapeHTML(
                            review.comment ||
                            ""
                        )}

                    </div>

                </div>
            `;

        }
    );

}


// ======================================================
// CLOSE REVIEW
// ======================================================

if (closeReview) {

    closeReview.addEventListener(
        "click",
        () => {

            reviewSection.style.display =
                "none";

        }
    );

}


// ======================================================
// TOGGLE ANIME SECTION
// ======================================================

if (animeToggle) {

    animeToggle.addEventListener(
        "click",
        () => {

            if (!animeSection) {
                return;
            }


            animeSection.classList.toggle(
                "open"
            );


            const open =
                animeSection.classList.contains(
                    "open"
                );


            animeToggle.innerHTML =
                open
                    ? `
                        <span>
                            ซ่อนรายการ
                        </span>

                        <i class="fa-solid fa-chevron-up"></i>
                    `
                    : `
                        <span>
                            แสดงรายการ
                        </span>

                        <i class="fa-solid fa-chevron-down"></i>
                    `;

        }
    );

}


// ======================================================
// SEARCH
// ======================================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        () => {

            searchText =
                searchBox.value;

            renderAnime();

        }
    );

}


// ======================================================
// ADD / UPDATE ANIME
// ======================================================

if (addBtn) {

    addBtn.addEventListener(
        "click",
        saveAnime
    );

}


async function saveAnime() {

    if (!currentUser) {
        return;
    }


    const title =
        titleInput?.value.trim() ||
        "";

    const image =
        imageInput?.value.trim() ||
        "";

    const trailer =
        trailerInput?.value.trim() ||
        "";

    const description =
        descriptionInput?.value.trim() ||
        "";

    const episodes =
        parseInt(
            episodesInput?.value || "0",
            10
        ) || 0;

    const status =
        statusInput?.value.trim() ||
        "";

    const type =
        typeInput?.value.trim() ||
        "";


    const categories =
        [];


    document
        .querySelectorAll(
            ".category-group input:checked"
        )
        .forEach(
            input => {

                categories.push(
                    input.value
                );

            }
        );


    if (
        !title ||
        !image ||
        categories.length === 0 ||
        !description ||
        !status ||
        !type
    ) {

        alert(
            "กรุณากรอกข้อมูลให้ครบ"
        );

        return;

    }


    try {

        if (editId) {

            const oldAnime =
                animeData.find(
                    item =>
                        item.id ===
                        editId
                );


            if (
                !oldAnime ||
                (
                    currentRole !==
                        "superadmin" &&
                    oldAnime.createdBy !==
                        currentUser.uid
                )
            ) {

                alert(
                    "คุณไม่มีสิทธิ์แก้ไข Anime นี้"
                );

                return;

            }


            await updateDoc(
                doc(
                    db,
                    "anime",
                    editId
                ),
                {

                    title,

                    image,

                    category:
                        categories,

                    episodes,

                    status,

                    type,

                    trailer,

                    description

                }
            );


            alert(
                "แก้ไข Anime สำเร็จ"
            );

        }
        else {

            await addDoc(
                collection(
                    db,
                    "anime"
                ),
                {

                    title,

                    image,

                    category:
                        categories,

                    episodes,

                    status,

                    type,

                    trailer,

                    description,

                    score:
                        0,

                    createdBy:
                        currentUser.uid,

                    createdAt:
                        serverTimestamp()

                }
            );


            alert(
                "เพิ่ม Anime สำเร็จ"
            );

        }


        clearForm();

    }
    catch (error) {

        console.error(
            "Save Anime Error:",
            error
        );

        alert(
            "บันทึก Anime ไม่สำเร็จ"
        );

    }

}


// ======================================================
// EDIT
// ======================================================

function startEdit(
    id
) {

    const anime =
        animeData.find(
            item =>
                item.id ===
                id
        );


    if (!anime) {
        return;
    }


    if (
        currentRole !==
            "superadmin" &&
        anime.createdBy !==
            currentUser.uid
    ) {

        alert(
            "คุณไม่มีสิทธิ์แก้ไข Anime นี้"
        );

        return;

    }


    editId =
        id;


    if (formTitle) {

        formTitle.textContent =
            "แก้ไข Anime";

    }


    if (titleInput) {

        titleInput.value =
            anime.title ||
            "";

    }


    if (imageInput) {

        imageInput.value =
            anime.image ||
            "";

    }


    if (trailerInput) {

        trailerInput.value =
            anime.trailer ||
            "";

    }


    if (descriptionInput) {

        descriptionInput.value =
            anime.description ||
            "";

    }


    if (episodesInput) {

        episodesInput.value =
            anime.episodes ||
            0;

    }


    if (statusInput) {

        statusInput.value =
            anime.status ||
            "";

    }


    if (typeInput) {

        typeInput.value =
            anime.type ||
            "";

    }


    document
        .querySelectorAll(
            ".category-group input"
        )
        .forEach(
            input => {

                input.checked =
                    normalizeCategories(
                        anime.category
                    ).includes(
                        input.value
                    );

            }
        );


    if (addBtn) {

        addBtn.textContent =
            "บันทึกการแก้ไข";

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "";

    }


    document
        .querySelector(
            ".form-card"
        )
        ?.scrollIntoView(
            {
                behavior: "smooth"
            }
        );

}


// ======================================================
// CANCEL EDIT
// ======================================================

if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        clearForm
    );

}


function clearForm() {

    editId =
        null;


    if (formTitle) {

        formTitle.textContent =
            "เพิ่ม Anime";

    }


    if (titleInput) {
        titleInput.value = "";
    }

    if (imageInput) {
        imageInput.value = "";
    }

    if (trailerInput) {
        trailerInput.value = "";
    }

    if (descriptionInput) {
        descriptionInput.value = "";
    }

    if (episodesInput) {
        episodesInput.value = "";
    }

    if (statusInput) {
        statusInput.value = "";
    }

    if (typeInput) {
        typeInput.value = "";
    }


    document
        .querySelectorAll(
            ".category-group input"
        )
        .forEach(
            input => {

                input.checked =
                    false;

            }
        );


    if (addBtn) {

        addBtn.innerHTML =
            '<i class="fa-solid fa-plus"></i> เพิ่ม Anime';

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "none";

    }

}


// ======================================================
// DELETE
// ======================================================

async function deleteAnime(
    id
) {

    const anime =
        animeData.find(
            item =>
                item.id ===
                id
        );


    if (!anime) {
        return;
    }


    if (
        currentRole !==
            "superadmin" &&
        anime.createdBy !==
            currentUser.uid
    ) {

        alert(
            "คุณไม่มีสิทธิ์ลบ Anime นี้"
        );

        return;

    }


    if (
        !confirm(
            `ต้องการลบ "${anime.title || "Anime"}" ใช่หรือไม่?\nข้อมูล Review / Favorite / Bookmark ของเรื่องนี้จะถูกลบด้วย`
        )
    ) {

        return;

    }


    try {

        const batch =
            writeBatch(db);


        // ==========================================
        // Reviews
        // ==========================================

        const reviewSnap =
            await getDocs(
                query(
                    collection(
                        db,
                        "reviews"
                    ),
                    where(
                        "animeId",
                        "==",
                        id
                    )
                )
            );


        reviewSnap.forEach(
            item =>
                batch.delete(
                    item.ref
                )
        );


        // ==========================================
        // Favorites
        // ==========================================

        const favoriteSnap =
            await getDocs(
                query(
                    collection(
                        db,
                        "favorites"
                    ),
                    where(
                        "animeId",
                        "==",
                        id
                    )
                )
            );


        favoriteSnap.forEach(
            item =>
                batch.delete(
                    item.ref
                )
        );


        // ==========================================
        // Bookmarks
        // ==========================================

        const bookmarkSnap =
            await getDocs(
                query(
                    collection(
                        db,
                        "bookmarks"
                    ),
                    where(
                        "animeId",
                        "==",
                        id
                    )
                )
            );


        bookmarkSnap.forEach(
            item =>
                batch.delete(
                    item.ref
                )
        );


        // ==========================================
        // Anime
        // ==========================================

        batch.delete(
            doc(
                db,
                "anime",
                id
            )
        );


        await batch.commit();


        alert(
            "ลบ Anime สำเร็จ"
        );


        if (
            reviewSection &&
            selectedAnime?.dataset?.animeId === id
        ) {

            reviewSection.style.display =
                "none";

        }

    }
    catch (error) {

        console.error(
            "Delete Anime Error:",
            error
        );

        alert(
            "ลบ Anime ไม่สำเร็จ"
        );

    }

}


// ======================================================
// HELPERS
// ======================================================

function getAnimeReviews(
    id
) {

    return reviewData.filter(
        review =>
            String(
                review.animeId
            ) ===
            String(id)
    );

}


function getAverageRating(
    reviews
) {

    if (
        !reviews ||
        reviews.length === 0
    ) {

        return 0;

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
                        review.rating ||
                        0
                    )
                );

            },
            0
        );


    return (
        total /
        reviews.length
    );

}


function createStars(
    rating
) {

    let html =
        "";


    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        html +=
            i <= rating
                ? '<i class="fa-solid fa-star"></i>'
                : '<i class="fa-regular fa-star"></i>';

    }


    return html;

}


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


// ======================================================
// CLEANUP
// ======================================================

function cleanupRealtime() {

    if (unsubscribeAnime) {

        unsubscribeAnime();
        unsubscribeAnime = null;

    }


    if (unsubscribeReviews) {

        unsubscribeReviews();
        unsubscribeReviews = null;

    }

}