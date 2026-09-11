// ======================================================
// Anime Review Hub
// admin.js
// Reviewer + Super Admin
// Anime Management + Review Viewer
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const addBtn =
    document.getElementById("addAnime");

const cancelBtn =
    document.getElementById("cancelEdit");

const titleInput =
    document.getElementById("title");

const imageInput =
    document.getElementById("image");

const trailerInput =
    document.getElementById("trailer");

const descriptionInput =
    document.getElementById("description");

const episodesInput =
    document.getElementById("episodes");

const statusInput =
    document.getElementById("status");

const typeInput =
    document.getElementById("type");

const animeList =
    document.getElementById("animeList");

const searchBox =
    document.getElementById("searchAnime");

const animeCount =
    document.getElementById("animeCount");

const reviewerCount =
    document.getElementById("reviewerCount");

const reviewCount =
    document.getElementById("reviewCount");

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


// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;

let currentRole = "";

let editId = null;

let animeData = [];

let reviewData = [];


// ======================================================
// AUTHENTICATION
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

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


            // ==========================================
            // Role
            // ==========================================

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


            await loadData();

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
                Super Admin — จัดการ Anime และรีวิวทั้งหมด
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
// LOAD DATA
// ======================================================

async function loadData() {

    await loadAnime();

    await loadReviews();

    updateDashboard();

    renderAnime();

}


// ======================================================
// LOAD ANIME
// ======================================================

async function loadAnime() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "anime"
                )
            );


        const allAnime =
            snapshot.docs.map(
                (docSnap) => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        // ==========================================
        // Reviewer
        // ==========================================

        if (
            currentRole ===
            "admin"
        ) {

            animeData =
                allAnime.filter(
                    (anime) => {

                        return (
                            anime.createdBy ===
                            currentUser.uid
                        );

                    }
                );

        }


        // ==========================================
        // Super Admin
        // ==========================================

        else {

            animeData =
                allAnime;

        }

    }
    catch (error) {

        console.error(
            "Load Anime Error:",
            error
        );

        animeData = [];

    }

}


// ======================================================
// LOAD REVIEWS
// ======================================================

async function loadReviews() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        const allReviews =
            snapshot.docs.map(
                (docSnap) => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        const allowedAnime =
            new Set(
                animeData.map(
                    (anime) =>
                        String(
                            anime.id
                        )
                )
            );


        reviewData =
            allReviews.filter(
                (review) => {

                    return allowedAnime.has(
                        String(
                            review.animeId
                        )
                    );

                }
            );

    }
    catch (error) {

        console.error(
            "Load Reviews Error:",
            error
        );

        reviewData = [];

    }

}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    if (animeCount) {

        animeCount.textContent =
            animeData.length;

    }


    if (reviewCount) {

        reviewCount.textContent =
            reviewData.length;

    }


    // ==========================================
    // Unique reviewers
    // ==========================================

    const reviewerSet =
        new Set();


    reviewData.forEach(
        (review) => {

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


    // ==========================================
    // Reviewed anime
    // ==========================================

    const reviewedAnimeSet =
        new Set();


    reviewData.forEach(
        (review) => {

            if (review.animeId) {

                reviewedAnimeSet.add(
                    String(
                        review.animeId
                    )
                );

            }

        }
    );


    if (reviewedAnimeCount) {

        reviewedAnimeCount.textContent =
            reviewedAnimeSet.size;

    }


    // ==========================================
    // Labels
    // ==========================================

    const boxes =
        document.querySelectorAll(
            ".dashboard .box"
        );


    if (boxes.length >= 4) {

        const animeLabel =
            boxes[0].querySelector("p");

        const reviewerLabel =
            boxes[1].querySelector("p");


        if (animeLabel) {

            animeLabel.textContent =
                currentRole ===
                    "superadmin"

                    ? "Anime ทั้งหมด"

                    : "Anime ของฉัน";

        }


        if (reviewerLabel) {

            reviewerLabel.textContent =
                currentRole ===
                    "superadmin"

                    ? "ผู้รีวิวทั้งหมด"

                    : "ผู้รีวิวของฉัน";

        }

    }

}


// ======================================================
// GET REVIEWS FOR ANIME
// ======================================================

function getAnimeReviews(
    animeId
) {

    return reviewData.filter(
        (review) => {

            return (
                String(
                    review.animeId
                ) ===
                String(
                    animeId
                )
            );

        }
    );

}


// ======================================================
// AVERAGE RATING
// ======================================================

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


// ======================================================
// RENDER ANIME
// ======================================================

function renderAnime() {

    if (!animeList) {
        return;
    }


    const keyword =
        searchBox
            ? searchBox.value
                .trim()
                .toLowerCase()
            : "";


    let list =
        [...animeData];


    // ==========================================
    // Search
    // ==========================================

    if (keyword) {

        list =
            list.filter(
                (anime) => {

                    const title =
                        String(
                            anime.title ||
                            ""
                        ).toLowerCase();


                    const category =
                        Array.isArray(
                            anime.category
                        )

                            ? anime.category
                                .join(" ")
                                .toLowerCase()

                            : String(
                                anime.category ||
                                ""
                            ).toLowerCase();


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

    }


    animeList.innerHTML =
        "";


    if (animeResultText) {

        animeResultText.textContent =
            `${list.length} Anime`;

    }


    if (
        list.length === 0
    ) {

        animeList.innerHTML = `

            <div class="empty-box">

                <i class="fa-solid fa-film"></i>

                <h3>
                    ไม่พบ Anime
                </h3>

                <p>
                    ${
                        keyword
                            ? "ลองเปลี่ยนคำค้นหา"
                            : "ยังไม่มี Anime"
                    }
                </p>

            </div>

        `;

        return;

    }


    const fragment =
        document.createDocumentFragment();


    list.forEach(
        (anime) => {

            fragment.appendChild(
                createAnimeCard(
                    anime
                )
            );

        }
    );


    animeList.appendChild(
        fragment
    );

}


// ======================================================
// CREATE ANIME CARD
// ======================================================

function createAnimeCard(
    anime
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "anime-card";


    const reviews =
        getAnimeReviews(
            anime.id
        );


    const average =
        getAverageRating(
            reviews
        );


    const categories =
        Array.isArray(
            anime.category
        )

            ? anime.category.join(
                ", "
            )

            : anime.category ||
                "-";


    const image =
        anime.image ||
        "https://via.placeholder.com/400x550?text=No+Image";


    const title =
        anime.title ||
        "ไม่มีชื่อ";


    const isOwner =
        anime.createdBy ===
        currentUser.uid;


    const canManage =
        currentRole ===
            "superadmin" ||
        isOwner;


    card.innerHTML = `

        <img
            src="${escapeAttribute(image)}"
            alt="${escapeAttribute(title)}"
            class="anime-image"
            loading="lazy"
        >


        <div class="anime-info">

            <h3>
                ${escapeHTML(title)}
            </h3>


            <p class="anime-category">

                <i class="fa-solid fa-layer-group"></i>

                ${escapeHTML(categories)}

            </p>


            <div class="anime-score-row">

                <div class="anime-score">

                    <i class="fa-solid fa-star"></i>

                    ${
                        average > 0
                            ? average.toFixed(1)
                            : "0.0"
                    }

                </div>


                <span class="review-count">

                    ${reviews.length} รีวิว

                </span>

            </div>


            <p class="owner-row">

                <i class="fa-solid fa-user"></i>

                ผู้สร้าง:

                <strong>
                    ${
                        isOwner
                            ? "ฉัน"
                            : "Reviewer อื่น"
                    }
                </strong>

            </p>


            <p class="description">

                ${escapeHTML(
                    anime.description ||
                    "ไม่มีเรื่องย่อ"
                )}

            </p>

        </div>


        <div class="action">


            ${
                canManage

                    ? `

                        <button
                            type="button"
                            class="editBtn">

                            <i class="fa-solid fa-pen"></i>

                            แก้ไข

                        </button>


                        <button
                            type="button"
                            class="deleteBtn">

                            <i class="fa-solid fa-trash"></i>

                            ลบ

                        </button>

                    `

                    : `

                        <span class="no-permission">

                            <i class="fa-solid fa-lock"></i>

                            ดูอย่างเดียว

                        </span>

                    `
            }


            <button
                type="button"
                class="reviewBtn">

                <i class="fa-solid fa-comments"></i>

                ดูรีวิว

                ${
                    reviews.length
                        ? `(${reviews.length})`
                        : ""
                }

            </button>


        </div>

    `;


    // ==================================================
    // IMAGE ERROR
    // ==================================================

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


    // ==================================================
    // EDIT
    // ==================================================

    const editButton =
        card.querySelector(
            ".editBtn"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {

                editAnime(
                    anime.id
                );

            }
        );

    }


    // ==================================================
    // DELETE
    // ==================================================

    const deleteButton =
        card.querySelector(
            ".deleteBtn"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            () => {

                deleteAnime(
                    anime.id
                );

            }
        );

    }


    // ==================================================
    // REVIEWS
    // ==================================================

    const reviewButton =
        card.querySelector(
            ".reviewBtn"
        );


    if (reviewButton) {

        reviewButton.addEventListener(
            "click",
            () => {

                openReviewSection(
                    anime
                );

            }
        );

    }


    return card;

}


// ======================================================
// OPEN REVIEW SECTION
// ======================================================

function openReviewSection(
    anime
) {

    if (!reviewSection) {
        return;
    }


    const reviews =
        getAnimeReviews(
            anime.id
        );


    const average =
        getAverageRating(
            reviews
        );


    reviewSection.style.display =
        "block";


    // ==========================================
    // Title
    // ==========================================

    if (selectedAnimeText) {

        selectedAnimeText.textContent =
            `รีวิวของ ${anime.title || "Anime"}`;

    }


    // ==========================================
    // Anime Summary
    // ==========================================

    if (selectedAnime) {

        const image =
            anime.image ||
            "https://via.placeholder.com/100x140?text=No+Image";


        selectedAnime.innerHTML = `

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(
                    anime.title || "Anime"
                )}"
                class="selected-anime-image"
            >


            <div class="selected-anime-info">

                <h3>

                    ${escapeHTML(
                        anime.title ||
                        "Anime"
                    )}

                </h3>


                <div class="selected-anime-rating">

                    <span>

                        <i class="fa-solid fa-star"></i>

                        ${
                            average > 0
                                ? average.toFixed(1)
                                : "0.0"
                        }

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
        reviews
    );


    // ==========================================
    // Scroll
    // ==========================================

    setTimeout(
        () => {

            reviewSection.scrollIntoView({
                behavior:"smooth",
                block:"start"
            });

        },
        50
    );

}


// ======================================================
// RENDER SELECTED REVIEWS
// ======================================================

function renderSelectedReviews(
    reviews
) {

    if (!selectedReviewList) {
        return;
    }


    selectedReviewList.innerHTML =
        "";


    // ==========================================
    // No Reviews
    // ==========================================

    if (
        !reviews ||
        reviews.length === 0
    ) {

        selectedReviewList.innerHTML = `

            <div class="review-empty">

                <div class="review-empty-icon">

                    <i class="fa-regular fa-comment-dots"></i>

                </div>


                <h3>
                    ยังไม่มีรีวิว
                </h3>


                <p>
                    Anime นี้ยังไม่มีผู้ใช้มารีวิว
                </p>

            </div>

        `;

        return;

    }


    // ==========================================
    // Reviews
    // ==========================================

    reviews.forEach(
        (review) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "selected-review-item";


            const username =
                review.username ||
                review.name ||
                "ผู้ใช้";


            const photo =
                review.photoURL ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    username
                )}`;


            const rating =
                Number(
                    review.rating || 0
                );


            item.innerHTML = `

                <div class="selected-review-head">


                    <img
                        src="${escapeAttribute(photo)}"
                        alt="${escapeAttribute(username)}"
                        class="selected-review-avatar"
                    >


                    <div class="selected-review-user">

                        <strong>
                            ${escapeHTML(username)}
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
                            rating
                        )}

                    </div>

                </div>


                <div class="selected-review-comment">

                    ${
                        review.comment
                            ? escapeHTML(
                                review.comment
                            )
                            : "ไม่มีข้อความรีวิว"
                    }

                </div>

            `;


            selectedReviewList.appendChild(
                item
            );

        }
    );

}


// ======================================================
// CREATE STARS
// ======================================================

function createStars(
    rating
) {

    let html = "";


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        if (i <= rating) {

            html += `
                <i class="fa-solid fa-star"></i>
            `;

        }
        else {

            html += `
                <i class="fa-regular fa-star"></i>
            `;

        }

    }


    return html;

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


            if (selectedAnime) {

                selectedAnime.innerHTML =
                    "";

            }


            if (selectedReviewList) {

                selectedReviewList.innerHTML =
                    "";

            }

        }
    );

}


// ======================================================
// ANIME TOGGLE
// ======================================================

if (
    animeToggle &&
    animeSection
) {

    animeToggle.addEventListener(
        "click",
        () => {

            const isOpen =
                animeSection.classList.toggle(
                    "open"
                );


            if (isOpen) {

                animeToggle.innerHTML = `

                    <span>
                        ซ่อนรายการ
                    </span>

                    <i class="fa-solid fa-chevron-up"></i>

                `;

            }
            else {

                animeToggle.innerHTML = `

                    <span>
                        แสดงรายการ
                    </span>

                    <i class="fa-solid fa-chevron-down"></i>

                `;

            }

        }
    );

}


// ======================================================
// ADD / UPDATE
// ======================================================

if (addBtn) {

    addBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {
                return;
            }


            const data =
                getFormData();


            if (!validateAnime(data)) {
                return;
            }


            addBtn.disabled =
                true;


            try {

                // ======================================
                // UPDATE
                // ======================================

                if (editId) {

                    const animeRef =
                        doc(
                            db,
                            "anime",
                            editId
                        );


                    const snap =
                        await getDoc(
                            animeRef
                        );


                    if (!snap.exists()) {

                        alert(
                            "ไม่พบ Anime นี้"
                        );

                        return;

                    }


                    const oldData =
                        snap.data();


                    const canEdit =
                        currentRole ===
                            "superadmin" ||
                        oldData.createdBy ===
                            currentUser.uid;


                    if (!canEdit) {

                        alert(
                            "คุณไม่มีสิทธิ์แก้ไข Anime นี้"
                        );

                        return;

                    }


                    await updateDoc(
                        animeRef,
                        data
                    );


                    alert(
                        "แก้ไข Anime สำเร็จ"
                    );

                }


                // ======================================
                // ADD
                // ======================================

                else {

                    await addDoc(
                        collection(
                            db,
                            "anime"
                        ),
                        {

                            ...data,

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

                await loadData();

            }
            catch (error) {

                console.error(
                    "Save Anime Error:",
                    error
                );


                alert(
                    "บันทึกข้อมูลไม่สำเร็จ\n" +
                    error.message
                );

            }
            finally {

                addBtn.disabled =
                    false;

            }

        }
    );

}


// ======================================================
// GET FORM DATA
// ======================================================

function getFormData() {

    return {

        title:
            titleInput.value.trim(),

        image:
            imageInput.value.trim(),

        category:
            getSelectedCategories(),

        episodes:
            parseInt(
                episodesInput.value,
                10
            ) || 0,

        status:
            statusInput.value.trim(),

        type:
            typeInput.value.trim(),

        trailer:
            trailerInput.value.trim(),

        description:
            descriptionInput.value.trim()

    };

}


// ======================================================
// VALIDATE
// ======================================================

function validateAnime(
    data
) {

    if (!data.title) {

        alert(
            "กรุณากรอกชื่อ Anime"
        );

        return false;

    }


    if (!data.image) {

        alert(
            "กรุณากรอก URL รูปภาพ"
        );

        return false;

    }


    if (
        data.category.length === 0
    ) {

        alert(
            "กรุณาเลือกหมวดหมู่อย่างน้อย 1 หมวด"
        );

        return false;

    }


    if (!data.description) {

        alert(
            "กรุณากรอกเรื่องย่อ"
        );

        return false;

    }


    return true;

}


// ======================================================
// CATEGORIES
// ======================================================

function getSelectedCategories() {

    return Array.from(
        document.querySelectorAll(
            ".category-group input:checked"
        )
    ).map(
        (input) =>
            input.value
    );

}


function setSelectedCategories(
    categories
) {

    const selected =
        Array.isArray(categories)
            ? categories
            : categories
                ? [categories]
                : [];


    document
        .querySelectorAll(
            ".category-group input"
        )
        .forEach(
            (input) => {

                input.checked =
                    selected.includes(
                        input.value
                    );

            }
        );

}


// ======================================================
// EDIT
// ======================================================

async function editAnime(
    id
) {

    try {

        const ref =
            doc(
                db,
                "anime",
                id
            );


        const snap =
            await getDoc(
                ref
            );


        if (!snap.exists()) {

            alert(
                "ไม่พบ Anime"
            );

            return;

        }


        const data =
            snap.data();


        const canEdit =
            currentRole ===
                "superadmin" ||
            data.createdBy ===
                currentUser.uid;


        if (!canEdit) {

            alert(
                "คุณไม่มีสิทธิ์แก้ไข Anime นี้"
            );

            return;

        }


        titleInput.value =
            data.title || "";


        imageInput.value =
            data.image || "";


        trailerInput.value =
            data.trailer || "";


        descriptionInput.value =
            data.description || "";


        episodesInput.value =
            data.episodes ?? "";


        statusInput.value =
            data.status || "";


        typeInput.value =
            data.type || "";


        setSelectedCategories(
            data.category
        );


        editId =
            id;


        addBtn.innerHTML = `

            <i class="fa-solid fa-floppy-disk"></i>

            บันทึกการแก้ไข

        `;


        cancelBtn.style.display =
            "inline-flex";


        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    }
    catch (error) {

        console.error(
            "Edit Error:",
            error
        );


        alert(
            "ไม่สามารถโหลด Anime ได้"
        );

    }

}


// ======================================================
// DELETE ANIME
// ======================================================

async function deleteAnime(
    id
) {

    try {

        const animeRef =
            doc(
                db,
                "anime",
                id
            );


        const snap =
            await getDoc(
                animeRef
            );


        if (!snap.exists()) {

            alert(
                "ไม่พบ Anime นี้"
            );

            return;

        }


        const anime =
            snap.data();


        const canDelete =
            currentRole ===
                "superadmin" ||
            anime.createdBy ===
                currentUser.uid;


        if (!canDelete) {

            alert(
                "คุณไม่มีสิทธิ์ลบ Anime นี้"
            );

            return;

        }


        const confirmed =
            confirm(
                `ต้องการลบ "${anime.title || "Anime"}" หรือไม่?`
            );


        if (!confirmed) {
            return;
        }


        // ==========================================
        // Reviews
        // ==========================================

        const reviewSnap =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        for (
            const item
            of reviewSnap.docs
        ) {

            const data =
                item.data();


            if (
                String(
                    data.animeId
                ) ===
                String(id)
            ) {

                await deleteDoc(
                    item.ref
                );

            }

        }


        // ==========================================
        // Favorites
        // ==========================================

        const favoriteSnap =
            await getDocs(
                collection(
                    db,
                    "favorites"
                )
            );


        for (
            const item
            of favoriteSnap.docs
        ) {

            const data =
                item.data();


            if (
                String(
                    data.animeId
                ) ===
                String(id)
            ) {

                await deleteDoc(
                    item.ref
                );

            }

        }


        // ==========================================
        // Bookmarks
        // ==========================================

        const bookmarkSnap =
            await getDocs(
                collection(
                    db,
                    "bookmarks"
                )
            );


        for (
            const item
            of bookmarkSnap.docs
        ) {

            const data =
                item.data();


            if (
                String(
                    data.animeId
                ) ===
                String(id)
            ) {

                await deleteDoc(
                    item.ref
                );

            }

        }


        // ==========================================
        // Anime
        // ==========================================

        await deleteDoc(
            animeRef
        );


        if (editId === id) {

            clearForm();

        }


        if (
            reviewSection &&
            selectedAnime
        ) {

            reviewSection.style.display =
                "none";

            selectedAnime.innerHTML =
                "";

            selectedReviewList.innerHTML =
                "";

        }


        alert(
            "ลบ Anime เรียบร้อย"
        );


        await loadData();

    }
    catch (error) {

        console.error(
            "Delete Error:",
            error
        );


        alert(
            "ลบ Anime ไม่สำเร็จ\n" +
            error.message
        );

    }

}


// ======================================================
// CLEAR FORM
// ======================================================

function clearForm() {

    titleInput.value =
        "";

    imageInput.value =
        "";

    trailerInput.value =
        "";

    descriptionInput.value =
        "";

    episodesInput.value =
        "";

    statusInput.value =
        "";

    typeInput.value =
        "";


    setSelectedCategories([]);


    editId =
        null;


    addBtn.innerHTML = `

        <i class="fa-solid fa-plus"></i>

        เพิ่ม Anime

    `;


    cancelBtn.style.display =
        "none";

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


// ======================================================
// SEARCH
// ======================================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        renderAnime
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}