// ======================================================
// Anime Review Hub
// users.js
// User + Admin Management
// Super Admin Only
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// ======================================================
// Elements
// ======================================================

const totalUsers =
    document.getElementById("totalUsers");

const totalAdmins =
    document.getElementById("totalAdmins");

const totalSuperAdmins =
    document.getElementById("totalSuperAdmins");

const searchUser =
    document.getElementById("searchUser");

const refreshUsers =
    document.getElementById("refreshUsers");

const loading =
    document.getElementById("loading");

const usersTableWrapper =
    document.getElementById("usersTableWrapper");

const usersTable =
    document.getElementById("usersTable");

const emptyUsers =
    document.getElementById("emptyUsers");

const resultText =
    document.getElementById("resultText");

const toast =
    document.getElementById("toast");

const filterButtons =
    document.querySelectorAll(".filter-btn");

const summaryCards =
    document.querySelectorAll(".summary-card");


// ======================================================
// Variables
// ======================================================

let currentUser = null;

let usersData = [];

let currentFilter = "all";


// ======================================================
// Authentication
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "../login.html";

        return;

    }

    currentUser = user;

    try {

        const snap = await getDoc(
            doc(db, "users", user.uid)
        );

        if (!snap.exists()) {

            alert("ไม่พบข้อมูลผู้ใช้");

            window.location.href =
                "../index.html";

            return;

        }

        const data = snap.data();

        if (data.role !== "superadmin") {

            alert(
                "เฉพาะ Super Admin เท่านั้น"
            );

            window.location.href =
                "../index.html";

            return;

        }

        await loadUsers();

    }
    catch (error) {

        console.error(
            "Auth Error:",
            error
        );

        showToast(
            "ตรวจสอบสิทธิ์ไม่สำเร็จ"
        );

    }

});


// ======================================================
// Load Users
// ======================================================

async function loadUsers() {

    showLoading();

    try {

        const snapshot =
            await getDocs(
                collection(db, "users")
            );

        usersData =
            snapshot.docs.map(
                docSnap => ({

                    id: docSnap.id,

                    ...docSnap.data()

                })
            );

        console.log(
            "Users:",
            usersData
        );

        updateSummary();

        applyFilter();

    }
    catch (error) {

        console.error(
            "Load Users Error:",
            error
        );

        hideLoading();

        usersTable.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;color:red;">

                    โหลดข้อมูลไม่สำเร็จ

                    <br>

                    ${escapeHTML(
                        error.message
                    )}

                </td>
            </tr>
        `;

    }

}


// ======================================================
// Summary
// ======================================================

function updateSummary() {

    const users =
        usersData.filter(
            user =>
                !user.role ||
                user.role === "user"
        ).length;

    const admins =
        usersData.filter(
            user =>
                user.role === "admin"
        ).length;

    const superadmins =
        usersData.filter(
            user =>
                user.role === "superadmin"
        ).length;


    totalUsers.textContent =
        users;

    totalAdmins.textContent =
        admins;

    totalSuperAdmins.textContent =
        superadmins;

}


// ======================================================
// Filter
// ======================================================

function applyFilter() {

    const keyword =
        searchUser
            ? searchUser.value
                .trim()
                .toLowerCase()
            : "";


    let result = [...usersData];


    // Role Filter
    if (currentFilter !== "all") {

        result =
            result.filter(user => {

                const role =
                    user.role || "user";

                return role === currentFilter;

            });

    }


    // Search
    if (keyword) {

        result =
            result.filter(user => {

                const name =
                    String(
                        user.name || ""
                    ).toLowerCase();

                const email =
                    String(
                        user.email || ""
                    ).toLowerCase();

                return (
                    name.includes(keyword) ||
                    email.includes(keyword)
                );

            });

    }


    renderUsers(result);

}


// ======================================================
// Render Users
// ======================================================

function renderUsers(list) {

    hideLoading();

    usersTable.innerHTML = "";


    if (resultText) {

        resultText.textContent =
            `พบ ${list.length} รายการ`;

    }


    if (list.length === 0) {

        usersTableWrapper.style.display =
            "none";

        emptyUsers.style.display =
            "block";

        return;

    }


    usersTableWrapper.style.display =
        "block";

    emptyUsers.style.display =
        "none";


    list.forEach(user => {

        const role =
            user.role || "user";


        const row =
            document.createElement("tr");


        // =========================
        // Avatar
        // =========================

        const avatar =
            user.photo ||
            user.photoURL ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                user.name || "User"
            )}`;


        // =========================
        // Role
        // =========================

        let roleClass =
            "role-user";

        let roleText =
            "User";


        if (role === "admin") {

            roleClass =
                "role-admin";

            roleText =
                "Admin";

        }

        if (role === "superadmin") {

            roleClass =
                "role-superadmin";

            roleText =
                "Super Admin";

        }


        // =========================
        // Actions
        // =========================

        let actions = "";


        if (role === "superadmin") {

            actions = `

                <button
                    class="action-btn disabled-btn"
                    disabled>

                    🔒 ป้องกัน

                </button>

            `;

        }
        else {

            if (role === "user") {

                actions = `

                    <div class="user-actions">

                        <button
                            class="action-btn promote-btn"
                            data-action="promote"
                            data-id="${user.id}">

                            ⬆️ ตั้งเป็น Admin

                        </button>

                    </div>

                `;

            }
            else {

                actions = `

                    <div class="user-actions">

                        <button
                            class="action-btn demote-btn"
                            data-action="demote"
                            data-id="${user.id}">

                            ⬇️ ลดเป็น User

                        </button>

                    </div>

                `;

            }

        }


        row.innerHTML = `

            <td>

                <div class="user-cell">

                    <img
                        class="user-avatar"
                        src="${avatar}"
                        alt="User">

                    <span class="user-name">

                        ${escapeHTML(
                            user.name || "User"
                        )}

                    </span>

                </div>

            </td>


            <td>

                ${escapeHTML(
                    user.email || "-"
                )}

            </td>


            <td>

                <span
                    class="user-role ${roleClass}">

                    ${roleText}

                </span>

            </td>


            <td>

                ${actions}

            </td>

        `;


        // =========================
        // Promote
        // =========================

        const promoteBtn =
            row.querySelector(
                '[data-action="promote"]'
            );

        if (promoteBtn) {

            promoteBtn.addEventListener(
                "click",
                () => {

                    changeRole(
                        user.id,
                        "admin"
                    );

                }
            );

        }


        // =========================
        // Demote
        // =========================

        const demoteBtn =
            row.querySelector(
                '[data-action="demote"]'
            );

        if (demoteBtn) {

            demoteBtn.addEventListener(
                "click",
                () => {

                    changeRole(
                        user.id,
                        "user"
                    );

                }
            );

        }


        usersTable.appendChild(row);

    });

}


// ======================================================
// Change Role
// ======================================================

async function changeRole(
    userId,
    newRole
) {

    const user =
        usersData.find(
            item =>
                item.id === userId
        );


    if (!user) return;


    if (
        user.role === "superadmin"
    ) {

        showToast(
            "ไม่สามารถแก้ไข Super Admin ได้"
        );

        return;

    }


    const message =
        newRole === "admin"
            ? `ตั้ง ${user.name || "ผู้ใช้"} เป็น Admin?`
            : `ลด ${user.name || "Admin"} เป็น User?`;


    if (!confirm(message)) {

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "users",
                userId
            ),

            {
                role: newRole
            }

        );


        showToast(

            newRole === "admin"

                ? "✅ ตั้งเป็น Admin แล้ว"

                : "✅ ลดสิทธิ์เป็น User แล้ว"

        );


        await loadUsers();

    }
    catch (error) {

        console.error(
            "Change Role Error:",
            error
        );

        showToast(
            "เปลี่ยนสิทธิ์ไม่สำเร็จ"
        );

    }

}


// ======================================================
// Filter Buttons
// ======================================================

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            currentFilter =
                button.dataset.filter;


            filterButtons.forEach(btn => {

                btn.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            applyFilter();

        }
    );

});


// ======================================================
// Summary Cards Filter
// ======================================================

summaryCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            currentFilter =
                card.dataset.filter;


            filterButtons.forEach(btn => {

                btn.classList.toggle(
                    "active",
                    btn.dataset.filter ===
                    currentFilter
                );

            });


            applyFilter();

        }
    );

});


// ======================================================
// Search
// ======================================================

if (searchUser) {

    searchUser.addEventListener(
        "input",
        applyFilter
    );

}


// ======================================================
// Refresh
// ======================================================

if (refreshUsers) {

    refreshUsers.addEventListener(
        "click",
        async () => {

            refreshUsers.disabled =
                true;

            await loadUsers();

            refreshUsers.disabled =
                false;

        }
    );

}


// ======================================================
// Loading
// ======================================================

function showLoading() {

    if (loading) {

        loading.style.display =
            "flex";

    }

    if (usersTableWrapper) {

        usersTableWrapper.style.display =
            "none";

    }

    if (emptyUsers) {

        emptyUsers.style.display =
            "none";

    }

}


function hideLoading() {

    if (loading) {

        loading.style.display =
            "none";

    }

}


// ======================================================
// Toast
// ======================================================

function showToast(message) {

    if (!toast) return;

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.usersToastTimer
    );


    window.usersToastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

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