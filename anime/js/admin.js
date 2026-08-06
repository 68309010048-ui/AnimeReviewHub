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

// ===========================
// ตรวจสอบสิทธิ์ Admin
// ===========================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {

        alert("ไม่พบข้อมูลผู้ใช้");

        location.href = "../index.html";

        return;

    }

    const data = snap.data();

    if (data.role !== "admin") {

        alert("เฉพาะผู้ดูแลระบบเท่านั้น");

        location.href = "../index.html";

        return;

    }

    console.log("Admin Login Success");

    loadAnime();

    loadDashboard();

});

// ===========================
// ตัวแปร
// ===========================

let editId = null;

const addBtn = document.getElementById("addAnime");

const cancelBtn = document.getElementById("cancelEdit");

// ===========================
// เพิ่ม / แก้ไข อนิเมะ
// ===========================

addBtn.addEventListener("click", async () => {

    const title = document.getElementById("title").value.trim();

    const image = document.getElementById("image").value.trim();

    const category = document.getElementById("category").value.trim();

    const trailer = document.getElementById("trailer").value.trim();

    const description = document.getElementById("description").value.trim();

    const score = parseFloat(document.getElementById("score").value) || 0;

    const episodes = parseInt(document.getElementById("episodes").value) || 0;

    const status = document.getElementById("status").value.trim();

    const type = document.getElementById("type").value.trim();

    if (
    !title ||
    !image ||
    !category ||
    !description ||
    !status ||
    !type
) {

    alert("กรุณากรอกข้อมูลให้ครบ");

    return;

}

    try {

        if (editId) {

           await updateDoc(
    doc(db, "anime", editId),
    {
        title,
        image,
        category,
        score,
        episodes,
        status,
        type,
        trailer,
        description
    }
);

            alert("แก้ไขอนิเมะสำเร็จ");

            editId = null;

            addBtn.textContent = "เพิ่มอนิเมะ";

            cancelBtn.style.display = "none";

        }

        else {

            await addDoc(

    collection(db, "anime"),

    {

        title,

        image,

        category,

        score,

        episodes,

        status,

        type,

        trailer,

        description,

        createdAt: serverTimestamp()

    }

);

alert("เพิ่มอนิเมะสำเร็จ");

        }

        clearForm();

        loadAnime();

        loadDashboard();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ===========================
// Dashboard
// ===========================

async function loadDashboard() {

    const animeSnap = await getDocs(collection(db, "anime"));

    document.getElementById("animeCount").textContent = animeSnap.size;

    const userSnap = await getDocs(collection(db, "users"));

    document.getElementById("userCount").textContent = userSnap.size;

    const reviewSnap = await getDocs(collection(db, "reviews"));

    document.getElementById("reviewCount").textContent = reviewSnap.size;
    

}

// ===========================
// โหลดรายการอนิเมะ
// ===========================

async function loadAnime() {

    const animeList = document.getElementById("animeList");

    animeList.innerHTML = "";

    const snapshot = await getDocs(collection(db, "anime"));

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        animeList.innerHTML += `

        <div class="anime-card">

            <img src="${data.image}" alt="${data.title}">

            <div class="anime-info">

                <h3>${data.title}</h3>

                <p><b>หมวด :</b> ${data.category}</p>

                <p>${data.description}</p>

            </div>

            <div class="action">

                <button
                class="editBtn"
                onclick="editAnime('${docSnap.id}')">

                ✏️ แก้ไข

                </button>

                <button
                class="deleteBtn"
                onclick="deleteAnime('${docSnap.id}')">

                🗑 ลบ

                </button>

            </div>

        </div>

        `;

    });

}

// ===========================
// ค้นหาอนิเมะ
// ===========================

const searchBox = document.getElementById("searchAnime");

if (searchBox) {

    searchBox.addEventListener("keyup", async (e) => {

        const keyword = e.target.value.toLowerCase();

        const animeList = document.getElementById("animeList");

        animeList.innerHTML = "";

        const snapshot = await getDocs(collection(db, "anime"));

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            if (data.title.toLowerCase().includes(keyword)) {

                animeList.innerHTML += `

                <div class="anime-card">

                    <img src="${data.image}" alt="${data.title}">

                    <div class="anime-info">

                        <h3>${data.title}</h3>

                        <p><b>หมวด :</b> ${data.category}</p>

                        <p>${data.description}</p>

                    </div>

                    <div class="action">

                        <button
                        class="editBtn"
                        onclick="editAnime('${docSnap.id}')">

                        ✏️ แก้ไข

                        </button>

                        <button
                        class="deleteBtn"
                        onclick="deleteAnime('${docSnap.id}')">

                        🗑 ลบ

                        </button>

                    </div>

                </div>

                `;

            }

        });

    });

}
// ===========================
// แก้ไขอนิเมะ
// ===========================

window.editAnime = async (id) => {

    const snap = await getDoc(doc(db, "anime", id));

    if (!snap.exists()) {

        alert("ไม่พบข้อมูล");

        return;

    }

    const data = snap.data();

    document.getElementById("title").value = data.title;

    document.getElementById("image").value = data.image;

    document.getElementById("category").value = data.category;

    document.getElementById("trailer").value = data.trailer || "";

    document.getElementById("description").value = data.description;

    document.getElementById("score").value = data.score || 0;

    document.getElementById("episodes").value = data.episodes || 0;

    document.getElementById("status").value = data.status || "";

    document.getElementById("type").value = data.type || "";

    editId = id;

    addBtn.textContent = "💾 บันทึกการแก้ไข";

    cancelBtn.style.display = "inline-block";

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

};

// ===========================
// ลบอนิเมะ
// ===========================

window.deleteAnime = async (id) => {

    if (!confirm("ต้องการลบอนิเมะนี้ใช่หรือไม่ ?")) return;

    try {

        const reviewQuery = query(
            collection(db, "reviews"),
            where("animeId", "==", id)
        );

        const reviewSnapshot = await getDocs(reviewQuery);

        for (const reviewDoc of reviewSnapshot.docs) {

            await deleteDoc(doc(db, "reviews", reviewDoc.id));

        }

        await deleteDoc(doc(db, "anime", id));

        alert("ลบอนิเมะและรีวิวเรียบร้อย");

        loadAnime();

        loadDashboard();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

};

// ===========================
// ยกเลิกการแก้ไข
// ===========================

cancelBtn.addEventListener("click", () => {

    editId = null;

    addBtn.textContent = "เพิ่มอนิเมะ";

    cancelBtn.style.display = "none";

    clearForm();

});

// ===========================
// ล้างข้อมูลในฟอร์ม
// ===========================

function clearForm() {

    document.getElementById("title").value = "";

    document.getElementById("image").value = "";

    document.getElementById("category").value = "";

    document.getElementById("trailer").value = "";

    document.getElementById("description").value = "";

    document.getElementById("score").value = "";

    document.getElementById("episodes").value = "";

    document.getElementById("status").value = "";
    
    document.getElementById("type").value = "";

}
