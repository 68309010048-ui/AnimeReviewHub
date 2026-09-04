// ======================================================
// Anime Review Hub
// admin.js V3.0
// Reviewer + Super Admin Panel
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// ======================================================
// Elements
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
    document.getElementById("roleInfo");

const reviewerInfo =
    document.getElementById(
        "reviewerInfo"
    );

const reviewerList =
    document.getElementById(
        "reviewerList"
    );

const animeResultText =
    document.getElementById(
        "animeResultText"
    );


// ======================================================
// Variables
// ======================================================

let currentUser = null;

let currentRole = "";

let editId = null;

let animeData = [];

let reviewData = [];

let reviewerData = [];


// ======================================================
// Authentication
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        currentUser = user;


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
            // ตรวจสิทธิ์
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


            // ==========================================
            // Role Information
            // ==========================================

            updateRoleUI();


            // ==========================================
            // Load
            // ==========================================

            await loadData();

        }
        catch (error) {

            console.error(
                "Admin Auth Error:",
                error
            );

            alert(
                "ไม่สามารถตรวจสอบสิทธิ์ได้"
            );

        }

    }
);


// ======================================================
// Update Role UI
// ======================================================

function updateRoleUI() {

    if (roleInfo) {

        if (currentRole === "superadmin") {

            roleInfo.innerHTML = `
                <i class="fa-solid fa-crown"></i>
                <span>
                    Super Admin — สามารถจัดการ Anime และรีวิวทั้งหมด
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


    // ==============================================
    // Dashboard Label
    // ==============================================

    const dashboardBoxes =
        document.querySelectorAll(
            ".dashboard .box"
        );


    if (dashboardBoxes.length >= 4) {

        const animeLabel =
            dashboardBoxes[0]
                .querySelector("p");

        const reviewerLabel =
            dashboardBoxes[1]
                .querySelector("p");

        const reviewLabel =
            dashboardBoxes[2]
                .querySelector("p");

        const reviewedAnimeLabel =
            dashboardBoxes[3]
                .querySelector("p");


        if (currentRole === "superadmin") {

            if (animeLabel) {

                animeLabel.textContent =
                    "Anime ทั้งหมด";

            }

            if (reviewerLabel) {

                reviewerLabel.textContent =
                    "ผู้รีวิวทั้งหมด";

            }

            if (reviewLabel) {

                reviewLabel.textContent =
                    "รีวิวทั้งหมด";

            }

            if (reviewedAnimeLabel) {

                reviewedAnimeLabel.textContent =
                    "Anime ที่มีรีวิว";

            }

        }
        else {

            if (animeLabel) {

                animeLabel.textContent =
                    "Anime ของฉัน";

            }

            if (reviewerLabel) {

                reviewerLabel.textContent =
                    "ผู้รีวิวของฉัน";

            }

            if (reviewLabel) {

                reviewLabel.textContent =
                    "รีวิวทั้งหมด";

            }

            if (reviewedAnimeLabel) {

                reviewedAnimeLabel.textContent =
                    "Anime ที่มีรีวิว";

            }

        }

    }

}


// ======================================================
// Load All Data
// ======================================================

async function loadData() {

    await Promise.all([
        loadAnime(),
        loadReviews()
    ]);


    updateDashboard();

    renderReviewerData();

}


// ======================================================
// Load Anime
// ======================================================

async function loadAnime() {

    if (!animeList) return;


    animeList.innerHTML = `
        <div class="loading">
            <div class="loader"></div>

            <p>
                กำลังโหลด Anime...
            </p>
        </div>
    `;


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

                    id: docSnap.id,

                    ...docSnap.data()

                })
            );


        // ==========================================
        // Reviewer
        // ==========================================

        if (currentRole === "admin") {

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


        console.log(
            "Anime ทั้งหมด:",
            allAnime.length
        );


        console.log(
            "Anime ที่แสดง:",
            animeData.length
        );


        renderAnime(
            animeData
        );

    }
    catch (error) {

        console.error(
            "Load Anime Error:",
            error
        );


        animeList.innerHTML = `
            <div class="empty-box">

                <h3>
                    โหลดข้อมูลไม่สำเร็จ
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


// ======================================================
// Load Reviews
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

                    id: docSnap.id,

                    ...docSnap.data()

                })
            );


        // ==========================================
        // Reviewer
        // ==========================================

        if (currentRole === "admin") {

            const myAnimeIds =
                new Set(
                    animeData.map(
                        (anime) =>
                            String(anime.id)
                    )
                );


            reviewData =
                allReviews.filter(
                    (review) => {

                        return myAnimeIds.has(
                            String(
                                review.animeId
                            )
                        );

                    }
                );

        }


        // ==========================================
        // Super Admin
        // ==========================================

        else {

            reviewData =
                allReviews;

        }


        console.log(
            "Reviews ที่แสดง:",
            reviewData.length
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
// Dashboard
// ======================================================

function updateDashboard() {

    // ==========================================
    // Anime
    // ==========================================

    if (animeCount) {

        animeCount.textContent =
            animeData.length;

    }


    // ==========================================
    // Unique Reviewers
    // ==========================================

    const reviewerIds =
        new Set();


    reviewData.forEach(
        (review) => {

            const reviewerId =
                review.uid ||
                review.email ||
                review.username;


            if (reviewerId) {

                reviewerIds.add(
                    String(
                        reviewerId
                    )
                );

            }

        }
    );


    if (reviewerCount) {

        reviewerCount.textContent =
            reviewerIds.size;

    }


    // ==========================================
    // Reviews
    // ==========================================

    if (reviewCount) {

        reviewCount.textContent =
            reviewData.length;

    }


    // ==========================================
    // Anime ที่มีรีวิว
    // ==========================================

    const reviewedAnimeIds =
        new Set();


    reviewData.forEach(
        (review) => {

            if (review.animeId) {

                reviewedAnimeIds.add(
                    String(
                        review.animeId
                    )
                );

            }

        }
    );


    if (reviewedAnimeCount) {

        reviewedAnimeCount.textContent =
            reviewedAnimeIds.size;

    }

}


// ======================================================
// Reviewer Data
// ======================================================

function createReviewerData() {

    const map =
        new Map();


    reviewData.forEach(
        (review) => {

            const uid =
                String(
                    review.uid ||
                    review.email ||
                    review.username ||
                    "unknown"
                );


            if (!map.has(uid)) {

                map.set(
                    uid,
                    {

                        uid: uid,

                        username:
                            review.username ||
                            "ผู้ใช้",

                        email:
                            review.email ||
                            "",

                        photoURL:
                            review.photoURL ||
                            "",

                        reviews: [],

                        animeIds:
                            new Set()

                    }
                );

            }


            const reviewer =
                map.get(uid);


            reviewer.reviews.push(
                review
            );


            if (review.animeId) {

                reviewer.animeIds.add(
                    String(
                        review.animeId
                    )
                );

            }

        }
    );


    return Array.from(
        map.values()
    );

}


// ======================================================
// Render Reviewer Data
// ======================================================

function renderReviewerData() {

    reviewerData =
        createReviewerData();


    if (!reviewerInfo) {
        return;
    }


    if (reviewerData.length === 0) {

        reviewerInfo.style.display =
            "block";


        if (reviewerList) {

            reviewerList.innerHTML = `
                <div class="empty-box">

                    <i class="fa-solid fa-users-slash"></i>

                    <h3>
                        ยังไม่มีผู้มารีวิว
                    </h3>

                    <p>
                        เมื่อมีผู้ใช้มารีวิว Anime
                        รายชื่อจะแสดงที่นี่
                    </p>

                </div>
            `;

        }

        return;
    }


    reviewerInfo.style.display =
        "block";


    if (!reviewerList) {
        return;
    }


    reviewerList.innerHTML = "";


    reviewerData.forEach(
        (reviewer, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "reviewer-item";


            const photo =
                reviewer.photoURL ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    reviewer.username
                )}`;


            card.innerHTML = `

                <div class="reviewer-header">

                    <img
                        src="${escapeAttribute(photo)}"
                        alt="${escapeAttribute(
                            reviewer.username
                        )}"
                        class="reviewer-avatar"
                    >


                    <div class="reviewer-main">

                        <h3>
                            ${escapeHTML(
                                reviewer.username
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                reviewer.email ||
                                "ไม่แสดง Email"
                            )}
                        </p>

                    </div>


                    <div class="reviewer-stats">

                        <span>
                            ${reviewer.reviews.length}
                            รีวิว
                        </span>

                        <span>
                            ${reviewer.animeIds.size}
                            Anime
                        </span>

                    </div>


                    <button
                        type="button"
                        class="reviewer-view-btn">

                        ดูรีวิว

                        <i class="fa-solid fa-chevron-down"></i>

                    </button>

                </div>


                <div
                    class="reviewer-reviews"
                    style="display:none;">

                </div>

            `;


            const reviewContainer =
                card.querySelector(
                    ".reviewer-reviews"
                );


            reviewer.reviews.forEach(
                (review) => {

                    const anime =
                        animeData.find(
                            (item) =>
                                String(item.id) ===
                                String(review.animeId)
                        );


                    const reviewBox =
                        document.createElement(
                            "div"
                        );


                    reviewBox.className =
                        "review-item";


                    reviewBox.innerHTML = `

                        <div class="review-item-top">

                            <strong>
                                ${escapeHTML(
                                    anime
                                        ? anime.title
                                        : "Anime"
                                )}
                            </strong>

                            <span class="review-rating">
                                ⭐ ${Number(
                                    review.rating || 0
                                ).toFixed(1)}
                            </span>

                        </div>


                        <p class="review-comment">

                            ${escapeHTML(
                                review.comment ||
                                "ไม่มีข้อความรีวิว"
                            )}

                        </p>

                    `;


                    reviewContainer.appendChild(
                        reviewBox
                    );

                }
            );


            const viewButton =
                card.querySelector(
                    ".reviewer-view-btn"
                );


            viewButton.addEventListener(
                "click",
                () => {

                    const isOpen =
                        reviewContainer.style.display !==
                        "none";


                    reviewContainer.style.display =
                        isOpen
                            ? "none"
                            : "block";


                    viewButton.innerHTML =
                        isOpen

                            ? 'ดูรีวิว <i class="fa-solid fa-chevron-down"></i>'

                            : 'ซ่อนรีวิว <i class="fa-solid fa-chevron-up"></i>';

                }
            );


            reviewerList.appendChild(
                card
            );

        }
    );

}


// ======================================================
// Get Selected Categories
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


// ======================================================
// Set Categories
// ======================================================

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
// Clear Form
// ======================================================

function clearForm() {

    if (titleInput)
        titleInput.value = "";

    if (imageInput)
        imageInput.value = "";

    if (trailerInput)
        trailerInput.value = "";

    if (descriptionInput)
        descriptionInput.value = "";

    if (episodesInput)
        episodesInput.value = "";

    if (statusInput)
        statusInput.value = "";

    if (typeInput)
        typeInput.value = "";


    setSelectedCategories([]);


    editId = null;


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
// Get Form Data
// ======================================================

function getFormData() {

    return {

        title:
            titleInput
                ? titleInput.value.trim()
                : "",

        image:
            imageInput
                ? imageInput.value.trim()
                : "",

        category:
            getSelectedCategories(),

        description:
            descriptionInput
                ? descriptionInput.value.trim()
                : "",

        episodes:
            episodesInput
                ? parseInt(
                    episodesInput.value,
                    10
                ) || 0
                : 0,

        status:
            statusInput
                ? statusInput.value.trim()
                : "",

        type:
            typeInput
                ? typeInput.value.trim()
                : "",

        trailer:
            trailerInput
                ? trailerInput.value.trim()
                : ""

    };

}


// ======================================================
// Validate
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


    if (!data.status) {

        alert(
            "กรุณากรอกสถานะ"
        );

        return false;

    }


    if (!data.type) {

        alert(
            "กรุณากรอกประเภท"
        );

        return false;

    }


    return true;

}


// ======================================================
// Add / Update
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

                // ========================================
                // UPDATE
                // ========================================

                if (editId) {

                    const animeRef =
                        doc(
                            db,
                            "anime",
                            editId
                        );


                    const animeSnap =
                        await getDoc(
                            animeRef
                        );


                    if (!animeSnap.exists()) {

                        alert(
                            "ไม่พบ Anime นี้"
                        );

                        clearForm();

                        return;

                    }


                    const oldData =
                        animeSnap.data();


                    // ==================================
                    // Permission
                    // ==================================

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


                    // ==================================
                    // Update
                    // ==================================

                    await updateDoc(
                        animeRef,
                        data
                    );


                    alert(
                        "แก้ไข Anime สำเร็จ"
                    );

                }


                // ========================================
                // ADD
                // ========================================

                else {

                    await addDoc(
                        collection(
                            db,
                            "anime"
                        ),
                        {

                            ...data,

                            // เจ้าของ Anime
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
// Cancel Edit
// ======================================================

if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        () => {

            clearForm();

        }
    );

}


// ======================================================
// Render Anime
// ======================================================

function renderAnime(list) {

    if (!animeList) return;


    animeList.innerHTML = "";


    if (animeResultText) {

        if (currentRole === "superadmin") {

            animeResultText.textContent =
                `${list.length} Anime ทั้งหมด`;

        }
        else {

            animeResultText.textContent =
                `${list.length} Anime ของคุณ`;

        }

    }


    if (list.length === 0) {

        animeList.innerHTML = `

            <div class="empty-box">

                <i class="fa-solid fa-film"></i>

                <h3>
                    ไม่พบ Anime
                </h3>

                <p>
                    ${
                        currentRole === "superadmin"
                            ? "ยังไม่มี Anime ในระบบ"
                            : "คุณยังไม่ได้เพิ่ม Anime"
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

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "anime-card";


            const categories =
                Array.isArray(
                    anime.category
                )

                    ? anime.category.join(
                        ", "
                    )

                    : anime.category ||
                        "-";


            // ==========================================
            // Owner
            // ==========================================

            const isOwner =
                anime.createdBy ===
                currentUser.uid;


            const canManage =
                currentRole ===
                    "superadmin" ||
                isOwner;


            // ==========================================
            // Reviews
            // ==========================================

            const animeReviews =
                reviewData.filter(
                    (review) => {

                        return String(
                            review.animeId
                        ) === String(
                            anime.id
                        );

                    }
                );


            const totalRatings =
                animeReviews.reduce(
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


            const average =
                animeReviews.length > 0

                    ? (
                        totalRatings /
                        animeReviews.length
                    ).toFixed(1)

                    : "0.0";


            card.innerHTML = `

                <img
                    src="${escapeAttribute(
                        anime.image || ""
                    )}"
                    alt="${escapeAttribute(
                        anime.title || ""
                    )}"
                    loading="lazy"
                    class="anime-image"
                >


                <div class="anime-info">

                    <h3>
                        ${escapeHTML(
                            anime.title || "-"
                        )}
                    </h3>


                    <p>

                        <b>
                            หมวด:
                        </b>

                        ${escapeHTML(
                            categories
                        )}

                    </p>


                    <p>

                        <b>
                            คะแนน:
                        </b>

                        ⭐ ${average}

                        <span>
                            (${animeReviews.length} รีวิว)
                        </span>

                    </p>


                    <p>

                        <b>
                            ผู้สร้าง:
                        </b>

                        ${
                            anime.createdBy ===
                            currentUser.uid

                                ? "ฉัน"

                                : "Reviewer อื่น"
                        }

                    </p>


                    <p class="description">

                        ${escapeHTML(
                            anime.description ||
                            "-"
                        )}

                    </p>

                </div>


                <div class="action">

                    ${
                        canManage

                            ? `

                                <button
                                    class="editBtn"
                                    type="button"
                                >

                                    ✏️ แก้ไข

                                </button>


                                <button
                                    class="deleteBtn"
                                    type="button"
                                >

                                    🗑 ลบ

                                </button>

                            `

                            : `

                                <span class="no-permission">

                                    🔒 ดูได้อย่างเดียว

                                </span>

                            `
                    }

                </div>

            `;


            // ==========================================
            // Image
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
            // Edit
            // ==========================================

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


            // ==========================================
            // Delete
            // ==========================================

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


            fragment.appendChild(
                card
            );

        }
    );


    animeList.appendChild(
        fragment
    );

}


// ======================================================
// Search
// ======================================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        () => {

            const keyword =
                searchBox.value
                    .trim()
                    .toLowerCase();


            if (!keyword) {

                renderAnime(
                    animeData
                );

                return;

            }


            const result =
                animeData.filter(
                    (anime) => {

                        const title =
                            String(
                                anime.title ||
                                ""
                            )
                                .toLowerCase();


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


            renderAnime(
                result
            );

        }
    );

}


// ======================================================
// Edit Anime
// ======================================================

async function editAnime(
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
                "ไม่พบข้อมูล Anime"
            );

            return;

        }


        const data =
            snap.data();


        // ==========================================
        // Permission
        // ==========================================

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


        // ==========================================
        // Fill
        // ==========================================

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


        if (addBtn) {

            addBtn.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> บันทึกการแก้ไข';

        }


        if (cancelBtn) {

            cancelBtn.style.display =
                "inline-block";

        }


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }
    catch (error) {

        console.error(
            "Edit Anime Error:",
            error
        );


        alert(
            "ไม่สามารถโหลดข้อมูลเพื่อแก้ไขได้"
        );

    }

}


// ======================================================
// Delete Anime
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


        const animeSnap =
            await getDoc(
                animeRef
            );


        if (!animeSnap.exists()) {

            alert(
                "ไม่พบ Anime นี้"
            );

            return;

        }


        const anime =
            animeSnap.data();


        // ==========================================
        // Permission
        // ==========================================

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


        if (
            !confirm(
                `ต้องการลบ "${anime.title || "Anime"}" หรือไม่?`
            )
        ) {

            return;

        }


        // ==========================================
        // Delete Reviews
        // ==========================================

        const reviewQuery =
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
            );


        const reviewSnapshot =
            await getDocs(
                reviewQuery
            );


        for (
            const reviewDoc
            of reviewSnapshot.docs
        ) {

            await deleteDoc(
                reviewDoc.ref
            );

        }


        // ==========================================
        // Delete Favorite
        // ==========================================

        const favoriteQuery =
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
            );


        const favoriteSnapshot =
            await getDocs(
                favoriteQuery
            );


        for (
            const favoriteDoc
            of favoriteSnapshot.docs
        ) {

            await deleteDoc(
                favoriteDoc.ref
            );

        }


        // ==========================================
        // Delete Bookmark
        // ==========================================

        const bookmarkQuery =
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
            );


        const bookmarkSnapshot =
            await getDocs(
                bookmarkQuery
            );


        for (
            const bookmarkDoc
            of bookmarkSnapshot.docs
        ) {

            await deleteDoc(
                bookmarkDoc.ref
            );

        }


        // ==========================================
        // Delete Anime
        // ==========================================

        await deleteDoc(
            animeRef
        );


        if (editId === id) {

            clearForm();

        }


        alert(
            "ลบ Anime และข้อมูลที่เกี่ยวข้องเรียบร้อย"
        );


        await loadData();

    }
    catch (error) {

        console.error(
            "Delete Anime Error:",
            error
        );


        alert(
            "ลบข้อมูลไม่สำเร็จ\n" +
            error.message
        );

    }

}


// ======================================================
// Escape HTML
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


// ======================================================
// Escape Attribute
// ======================================================

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}