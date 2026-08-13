// ======================================================
// Anime Review Hub
// admin.js V2.0
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

const addBtn = document.getElementById("addAnime");
const cancelBtn = document.getElementById("cancelEdit");

const titleInput = document.getElementById("title");
const imageInput = document.getElementById("image");
const trailerInput = document.getElementById("trailer");
const descriptionInput = document.getElementById("description");
const episodesInput = document.getElementById("episodes");
const statusInput = document.getElementById("status");
const typeInput = document.getElementById("type");

const animeList = document.getElementById("animeList");
const searchBox = document.getElementById("searchAnime");

const animeCount = document.getElementById("animeCount");
const userCount = document.getElementById("userCount");
const reviewCount = document.getElementById("reviewCount");


// ======================================================
// Variables
// ======================================================

let editId = null;
let animeData = [];
let isAdmin = false;


// ======================================================
// Authentication / Admin Check
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "../login.html";

        return;

    }

    try {

        const userSnap = await getDoc(
            doc(db, "users", user.uid)
        );

        if (!userSnap.exists()) {

            alert("ไม่พบข้อมูลผู้ใช้");

            location.href = "../index.html";

            return;

        }

        const userData = userSnap.data();

        const allowedRoles = ["admin", "superadmin"];

if (!allowedRoles.includes(userData.role)) {

    alert("คุณไม่มีสิทธิ์เข้าหน้า Admin");

    location.href = "../index.html";

    return;
}

        isAdmin = true;

        console.log("Admin Login Success");

        await Promise.all([
            loadAnime(),
            loadDashboard()
        ]);

    }

    catch (error) {

        console.error("Admin Auth Error:", error);

        alert("ไม่สามารถตรวจสอบสิทธิ์ได้");

    }

});


// ======================================================
// Get Selected Categories
// ======================================================

function getSelectedCategories() {

    return Array.from(
        document.querySelectorAll(
            ".category-group input:checked"
        )
    ).map(input => input.value);

}


// ======================================================
// Set Categories
// ======================================================

function setSelectedCategories(categories) {

    const selected = Array.isArray(categories)
        ? categories
        : categories
            ? [categories]
            : [];

    document
        .querySelectorAll(".category-group input")
        .forEach(input => {

            input.checked =
                selected.includes(input.value);

        });

}


// ======================================================
// Clear Form
// ======================================================

function clearForm() {

    titleInput.value = "";
    imageInput.value = "";
    trailerInput.value = "";
    descriptionInput.value = "";
    episodesInput.value = "";
    statusInput.value = "";
    typeInput.value = "";

    setSelectedCategories([]);

    editId = null;

    addBtn.textContent = "เพิ่มอนิเมะ";

    cancelBtn.style.display = "none";

}


// ======================================================
// Get Form Data
// ======================================================

function getFormData() {

    return {

        title: titleInput.value.trim(),

        image: imageInput.value.trim(),

        category: getSelectedCategories(),

        description:
            descriptionInput.value.trim(),

        episodes:
            parseInt(episodesInput.value, 10) || 0,

        status:
            statusInput.value.trim(),

        type:
            typeInput.value.trim(),

        trailer:
            trailerInput.value.trim()

    };

}


// ======================================================
// Validate Form
// ======================================================

function validateAnime(data) {

    if (!data.title) {

        alert("กรุณากรอกชื่ออนิเมะ");

        return false;

    }

    if (!data.image) {

        alert("กรุณากรอก URL รูปภาพ");

        return false;

    }

    if (data.category.length === 0) {

        alert("กรุณาเลือกหมวดหมู่อย่างน้อย 1 หมวด");

        return false;

    }

    if (!data.description) {

        alert("กรุณากรอกรายละเอียด");

        return false;

    }

    if (!data.status) {

        alert("กรุณากรอกสถานะ");

        return false;

    }

    if (!data.type) {

        alert("กรุณากรอกประเภท");

        return false;

    }

    return true;

}


// ======================================================
// Add / Update Anime
// ======================================================

if (addBtn) {

    addBtn.addEventListener("click", async () => {

        if (!isAdmin) return;

        const data = getFormData();

        if (!validateAnime(data)) return;

        addBtn.disabled = true;

        try {

            // =========================
            // UPDATE
            // =========================

            if (editId) {

                await updateDoc(
                    doc(db, "anime", editId),
                    data
                );

                alert("แก้ไขอนิเมะสำเร็จ");

            }

            // =========================
            // ADD
            // =========================

            else {

                await addDoc(
                    collection(db, "anime"),
                    {
                        ...data,
                        createdAt: serverTimestamp()
                    }
                );

                alert("เพิ่มอนิเมะสำเร็จ");

            }

            clearForm();

            await Promise.all([
                loadAnime(),
                loadDashboard()
            ]);

        }

        catch (error) {

            console.error("Save Anime Error:", error);

            alert(
                "บันทึกข้อมูลไม่สำเร็จ\n" +
                error.message
            );

        }

        finally {

            addBtn.disabled = false;

        }

    });

}


// ======================================================
// Cancel Edit
// ======================================================

if (cancelBtn) {

    cancelBtn.addEventListener("click", () => {

        clearForm();

    });

}


// ======================================================
// Load Dashboard
// ======================================================

async function loadDashboard() {

    try {

        const [
            animeSnap,
            userSnap,
            reviewSnap
        ] = await Promise.all([

            getDocs(
                collection(db, "anime")
            ),

            getDocs(
                collection(db, "users")
            ),

            getDocs(
                collection(db, "reviews")
            )

        ]);

        if (animeCount) {
            animeCount.textContent =
                animeSnap.size;
        }

        if (userCount) {
            userCount.textContent =
                userSnap.size;
        }

        if (reviewCount) {
            reviewCount.textContent =
                reviewSnap.size;
        }

        console.log(
            `Dashboard: Anime=${animeSnap.size}, Users=${userSnap.size}, Reviews=${reviewSnap.size}`
        );

    }

    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


// ======================================================
// Load Anime
// ======================================================

async function loadAnime() {

    if (!animeList) return;

    animeList.innerHTML = `
        <div class="loading">
            กำลังโหลดอนิเมะ...
        </div>
    `;

    try {

        const snapshot = await getDocs(
            collection(db, "anime")
        );

        animeData = snapshot.docs.map(docSnap => ({

            id: docSnap.id,

            ...docSnap.data()

        }));

        renderAnime(animeData);

    }

    catch (error) {

        console.error(
            "Load Anime Error:",
            error
        );

        animeList.innerHTML = `
            <p>
                โหลดข้อมูลไม่สำเร็จ
            </p>
        `;

    }

}


// ======================================================
// Render Anime
// ======================================================

function renderAnime(list) {

    if (!animeList) return;

    animeList.innerHTML = "";

    if (list.length === 0) {

        animeList.innerHTML = `
            <div class="empty-box">
                <h3>ไม่พบอนิเมะ</h3>
                <p>ลองค้นหาชื่อเรื่องอื่น</p>
            </div>
        `;

        return;

    }

    const fragment = document.createDocumentFragment();

    list.forEach(anime => {

        const card =
            document.createElement("div");

        card.className = "anime-card";

        const categories =
            Array.isArray(anime.category)
                ? anime.category.join(", ")
                : anime.category || "-";

        card.innerHTML = `

            <img
                src="${anime.image || ""}"
                alt="${escapeHTML(anime.title || "")}"
                loading="lazy"
            >

            <div class="anime-info">

                <h3>
                    ${escapeHTML(anime.title || "-")}
                </h3>

                <p>
                    <b>หมวด:</b>
                    ${escapeHTML(categories)}
                </p>

                <p>
                    ${escapeHTML(
                        anime.description || "-"
                    )}
                </p>

            </div>

            <div class="action">

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

            </div>

        `;

        const editButton =
            card.querySelector(".editBtn");

        const deleteButton =
            card.querySelector(".deleteBtn");

        editButton.addEventListener(
            "click",
            () => editAnime(anime.id)
        );

        deleteButton.addEventListener(
            "click",
            () => deleteAnime(anime.id)
        );

        fragment.appendChild(card);

    });

    animeList.appendChild(fragment);

}


// ======================================================
// Search
// ======================================================

if (searchBox) {

    searchBox.addEventListener("input", () => {

        const keyword =
            searchBox.value
                .trim()
                .toLowerCase();

        if (!keyword) {

            renderAnime(animeData);

            return;

        }

        const result =
            animeData.filter(anime => {

                const title =
                    String(anime.title || "")
                        .toLowerCase();

                return title.includes(keyword);

            });

        renderAnime(result);

    });

}


// ======================================================
// Edit Anime
// ======================================================

async function editAnime(id) {

    try {

        const snap = await getDoc(
            doc(db, "anime", id)
        );

        if (!snap.exists()) {

            alert("ไม่พบข้อมูลอนิเมะ");

            return;

        }

        const data = snap.data();

        // -------------------------
        // Fill Form
        // -------------------------

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


        // -------------------------
        // Category
        // -------------------------

        setSelectedCategories(
            data.category
        );


        // -------------------------
        // Edit State
        // -------------------------

        editId = id;

        addBtn.textContent =
            "💾 บันทึกการแก้ไข";

        cancelBtn.style.display =
            "inline-block";


        // -------------------------
        // Scroll
        // -------------------------

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

async function deleteAnime(id) {

    if (
        !confirm(
            "ต้องการลบอนิเมะนี้ใช่หรือไม่?"
        )
    ) {

        return;

    }

    try {

        // ลบ Reviews ที่เกี่ยวข้อง

        const reviewQuery = query(

            collection(db, "reviews"),

            where(
                "animeId",
                "==",
                id
            )

        );

        const reviewSnapshot =
            await getDocs(reviewQuery);


        for (
            const reviewDoc
            of reviewSnapshot.docs
        ) {

            await deleteDoc(

                doc(
                    db,
                    "reviews",
                    reviewDoc.id
                )

            );

        }


        // ลบ Anime

        await deleteDoc(

            doc(
                db,
                "anime",
                id
            )

        );


        // ถ้ากำลังแก้เรื่องนี้อยู่
        if (editId === id) {

            clearForm();

        }

        alert(
            "ลบอนิเมะและรีวิวเรียบร้อย"
        );


        await Promise.all([

            loadAnime(),

            loadDashboard()

        ]);

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

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}