// ======================================================
// Anime Review Hub
// users.js
// User + Admin Management
// Super Admin Only
// REAL-TIME
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// ======================================================
// Elements
// ======================================================

const totalUsers =
    document.getElementById(
        "totalUsers"
    );

const totalAdmins =
    document.getElementById(
        "totalAdmins"
    );

const totalSuperAdmins =
    document.getElementById(
        "totalSuperAdmins"
    );

const searchUser =
    document.getElementById(
        "searchUser"
    );

const refreshUsers =
    document.getElementById(
        "refreshUsers"
    );

const loading =
    document.getElementById(
        "loading"
    );

const usersTableWrapper =
    document.getElementById(
        "usersTableWrapper"
    );

const usersTable =
    document.getElementById(
        "usersTable"
    );

const emptyUsers =
    document.getElementById(
        "emptyUsers"
    );

const resultText =
    document.getElementById(
        "resultText"
    );

const toast =
    document.getElementById(
        "toast"
    );

const filterButtons =
    document.querySelectorAll(
        ".filter-btn"
    );

const summaryCards =
    document.querySelectorAll(
        ".summary-card"
    );


// ======================================================
// Variables
// ======================================================

let currentUser = null;

let usersData = [];

let currentFilter = "all";

let searchText = "";

let unsubscribeUsers = null;


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (unsubscribeUsers) {

            unsubscribeUsers();

            unsubscribeUsers =
                null;

        }


        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }


        currentUser =
            user;


        try {

            const snap =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (!snap.exists()) {

                alert(
                    "ไม่พบข้อมูลผู้ใช้"
                );

                window.location.href =
                    "../index.html";

                return;

            }


            const data =
                snap.data();


            if (
                data.role !==
                "superadmin"
            ) {

                alert(
                    "เฉพาะ Super Admin เท่านั้น"
                );

                window.location.href =
                    "../index.html";

                return;

            }


            startUsersRealtime();

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

    }
);


// ======================================================
// USERS REALTIME
// ======================================================

function startUsersRealtime() {

    showLoading();


    unsubscribeUsers =
        onSnapshot(
            collection(
                db,
                "users"
            ),
            (snapshot) => {

                usersData =
                    snapshot.docs.map(
                        docSnap => ({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        })
                    );


                updateSummary();

                hideLoading();

                applyFilter();

            },

            (error) => {

                console.error(
                    "Users realtime error:",
                    error
                );

                hideLoading();

                showToast(
                    "โหลด Users ไม่สำเร็จ"
                );

            }
        );

}


// ======================================================
// SUMMARY
// ======================================================

function updateSummary() {

    let userCount = 0;

    let adminCount = 0;

    let superAdminCount = 0;


    usersData.forEach(
        user => {

            const role =
                user.role ||
                "user";


            if (
                role ===
                "superadmin"
            ) {

                superAdminCount++;

            }
            else if (
                role === "admin"
            ) {

                adminCount++;

            }
            else {

                userCount++;

            }

        }
    );


    if (totalUsers) {

        totalUsers.textContent =
            userCount;

    }


    if (totalAdmins) {

        totalAdmins.textContent =
            adminCount;

    }


    if (totalSuperAdmins) {

        totalSuperAdmins.textContent =
            superAdminCount;

    }

}


// ======================================================
// FILTER
// ======================================================

function applyFilter() {

    const keyword =
        searchText
            .trim()
            .toLowerCase();


    const filtered =
        usersData.filter(
            user => {

                const role =
                    user.role ||
                    "user";


                // ========================================
                // Role Filter
                // ========================================

                if (
                    currentFilter !==
                    "all"
                ) {

                    if (
                        role !==
                        currentFilter
                    ) {

                        return false;

                    }

                }


                // ========================================
                // Search
                // ========================================

                if (!keyword) {
                    return true;
                }


                const name =
                    String(
                        user.name ||
                        ""
                    ).toLowerCase();


                const email =
                    String(
                        user.email ||
                        ""
                    ).toLowerCase();


                return (
                    name.includes(
                        keyword
                    ) ||
                    email.includes(
                        keyword
                    )
                );

            }
        );


    renderUsers(
        filtered
    );

}


// ======================================================
// RENDER USERS
// ======================================================

function renderUsers(
    list
) {

    if (!usersTable) {
        return;
    }


    usersTable.innerHTML =
        "";


    if (resultText) {

        resultText.textContent =
            `${list.length} Users`;

    }


    if (
        list.length ===
        0
    ) {

        if (usersTableWrapper) {

            usersTableWrapper.style.display =
                "none";

        }


        if (emptyUsers) {

            emptyUsers.style.display =
                "";

        }

        return;

    }


    if (usersTableWrapper) {

        usersTableWrapper.style.display =
            "";

    }


    if (emptyUsers) {

        emptyUsers.style.display =
            "none";

    }


    list.forEach(
        user => {

            const role =
                user.role ||
                "user";


            let roleText =
                "User";

            let roleClass =
                "user";


            if (
                role ===
                "admin"
            ) {

                roleText =
                    "Admin";

                roleClass =
                    "admin";

            }


            if (
                role ===
                "superadmin"
            ) {

                roleText =
                    "Super Admin";

                roleClass =
                    "superadmin";

            }


            const avatar =
                user.photo ||
                user.photoURL ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    user.name ||
                    "User"
                )}`;


            const row =
                document.createElement(
                    "tr"
                );


            let actions =
                "";


            if (
                role !==
                "superadmin"
            ) {

                if (
                    role ===
                    "user"
                ) {

                    actions = `
                        <button
                            class="action-btn promote-btn"
                            data-action="promote"
                            data-id="${escapeAttribute(
                                user.id
                            )}"
                        >

                            ⬆️ ตั้งเป็น Admin

                        </button>
                    `;

                }
                else {

                    actions = `
                        <button
                            class="action-btn demote-btn"
                            data-action="demote"
                            data-id="${escapeAttribute(
                                user.id
                            )}"
                        >

                            ⬇️ ลดเป็น User

                        </button>
                    `;

                }

            }
            else {

                actions = `
                    <span class="protected-label">

                        <i class="fa-solid fa-lock"></i>

                        Protected

                    </span>
                `;

            }


            row.innerHTML = `
                <td>

                    <div class="user-cell">

                        <img
                            class="user-avatar"
                            src="${escapeAttribute(
                                avatar
                            )}"
                            alt="User"
                        >


                        <span class="user-name">

                            ${escapeHTML(
                                user.name ||
                                "User"
                            )}

                        </span>

                    </div>

                </td>


                <td>

                    ${escapeHTML(
                        user.email ||
                        "-"
                    )}

                </td>


                <td>

                    <span
                        class="user-role ${roleClass}"
                    >

                        ${roleText}

                    </span>

                </td>


                <td>

                    ${actions}

                </td>
            `;


            // ==========================================
            // Promote
            // ==========================================

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


            // ==========================================
            // Demote
            // ==========================================

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


            usersTable.appendChild(
                row
            );

        }
    );

}


// ======================================================
// CHANGE ROLE
// ======================================================

async function changeRole(
    userId,
    newRole
) {

    const user =
        usersData.find(
            item =>
                item.id ===
                userId
        );


    if (!user) {
        return;
    }


    if (
        user.role ===
        "superadmin"
    ) {

        showToast(
            "ไม่สามารถแก้ไข Super Admin ได้"
        );

        return;

    }


    const message =
        newRole ===
        "admin"
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
                role:
                    newRole
            }
        );


        showToast(
            newRole ===
                "admin"
                ? "ตั้งเป็น Admin แล้ว"
                : "ลดสิทธิ์เป็น User แล้ว"
        );


        // ไม่ต้อง loadUsers()
        // เพราะ onSnapshot จะอัปเดตเอง

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
// FILTER BUTTONS
// ======================================================

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                currentFilter =
                    button.dataset.filter ||
                    "all";


                filterButtons
                    .forEach(
                        btn => {

                            btn.classList.toggle(
                                "active",
                                btn ===
                                    button
                            );

                        }
                    );


                applyFilter();

            }
        );

    }
);


// ======================================================
// SUMMARY CARD FILTER
// ======================================================

summaryCards.forEach(
    card => {

        card.addEventListener(
            "click",
            () => {

                const filter =
                    card.dataset.filter;


                if (!filter) {
                    return;
                }


                currentFilter =
                    filter;


                filterButtons
                    .forEach(
                        button => {

                            button.classList.toggle(
                                "active",
                                button.dataset.filter ===
                                    filter
                            );

                        }
                    );


                applyFilter();

            }
        );

    }
);


// ======================================================
// SEARCH
// ======================================================

if (searchUser) {

    searchUser.addEventListener(
        "input",
        () => {

            searchText =
                searchUser.value;

            applyFilter();

        }
    );

}


// ======================================================
// REFRESH
// ======================================================

if (refreshUsers) {

    refreshUsers.addEventListener(
        "click",
        () => {

            // Real-time listener ทำงานอยู่แล้ว
            // ปุ่มนี้ไว้ render ใหม่

            applyFilter();

            showToast(
                "รีเฟรชข้อมูลแล้ว"
            );

        }
    );

}


// ======================================================
// LOADING
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
// TOAST
// ======================================================

function showToast(
    message
) {

    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


// ======================================================
// ESCAPE
// ======================================================

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