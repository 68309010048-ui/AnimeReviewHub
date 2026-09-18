// =====================================================
// Anime Review Hub
// users.js
// User Management
// Super Admin Only
// REAL-TIME
// =====================================================

import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

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


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let usersData = [];

let currentFilter = "all";

let unsubscribeUsers = null;


// =====================================================
// DEFAULT AVATAR
// =====================================================

const DEFAULT_AVATAR =
    "https://api.dicebear.com/9.x/initials/svg?seed=User";


// =====================================================
// CREATE AVATAR FROM NAME
// =====================================================

function createAvatarFromName(name) {

    const finalName =
        String(name || "User")
            .trim() || "User";

    return (
        "https://api.dicebear.com/9.x/initials/svg" +
        "?seed=" +
        encodeURIComponent(finalName) +
        "&backgroundType=gradientLinear"
    );

}


// =====================================================
// GET AVATAR
// =====================================================
// ถ้ามีรูปที่ผู้ใช้กำหนด → ใช้รูปนั้น
// ถ้าไม่มี → สร้าง Avatar จากชื่อ
// รองรับทั้ง photo และ photoURL
// =====================================================

function getAvatar(user) {

    const photo =
        String(
            user.photo ||
            user.photoURL ||
            ""
        ).trim();


    if (photo) {

        return photo;

    }


    return createAvatarFromName(
        user.name || "User"
    );

}


// =====================================================
// GET ROLE TEXT
// =====================================================

function getRoleText(role) {

    switch (
        String(role || "user")
            .toLowerCase()
    ) {

        case "admin":

            return "Admin";


        case "superadmin":

            return "Super Admin";


        default:

            return "User";

    }

}


// =====================================================
// GET ROLE CLASS
// =====================================================

function getRoleClass(role) {

    switch (
        String(role || "user")
            .toLowerCase()
    ) {

        case "admin":

            return "role-admin";


        case "superadmin":

            return "role-superadmin";


        default:

            return "role-user";

    }

}


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    async user => {

        // =================================================
        // STOP OLD LISTENER
        // =================================================

        stopRealtime();


        // =================================================
        // NOT LOGIN
        // =================================================

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        try {

            // =================================================
            // CHECK CURRENT USER
            // =================================================

            const snap =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (
                !snap.exists()
            ) {

                alert(
                    "ไม่พบข้อมูลผู้ใช้"
                );


                window.location.href =
                    "../index.html";


                return;

            }


            const data =
                snap.data();


            // =================================================
            // SUPER ADMIN ONLY
            // =================================================

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


            // =================================================
            // START REAL-TIME
            // =================================================

            startRealtime();

        }

        catch (error) {

            console.error(
                "Auth Error:",
                error
            );


            showError(
                error
            );

        }

    }
);


// =====================================================
// START REAL-TIME
// =====================================================

function startRealtime() {

    console.log(
        "User Management Real-time: ON"
    );


    unsubscribeUsers =
        onSnapshot(

            collection(
                db,
                "users"
            ),

            snapshot => {

                // =================================================
                // UPDATE DATA
                // =================================================

                usersData =
                    snapshot.docs.map(
                        docSnap => ({

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        })
                    );


                console.log(
                    "Users Real-time Update:",
                    usersData
                );


                // =================================================
                // SUMMARY
                // =================================================

                updateSummary();


                // =================================================
                // FILTER
                // =================================================

                applyFilter();

            },

            error => {

                console.error(
                    "Users Real-time Error:",
                    error
                );


                showError(
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
        typeof unsubscribeUsers ===
        "function"
    ) {

        unsubscribeUsers();

        unsubscribeUsers =
            null;

    }

}


// =====================================================
// UPDATE SUMMARY
// =====================================================

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


    if (totalUsers) {

        totalUsers.textContent =
            users;

    }


    if (totalAdmins) {

        totalAdmins.textContent =
            admins;

    }


    if (totalSuperAdmins) {

        totalSuperAdmins.textContent =
            superadmins;

    }

}


// =====================================================
// APPLY FILTER
// =====================================================

function applyFilter() {

    const keyword =
        searchUser
            ? searchUser.value
                .trim()
                .toLowerCase()
            : "";


    let result =
        [...usersData];


    // =================================================
    // ROLE FILTER
    // =================================================

    if (
        currentFilter !==
        "all"
    ) {

        result =
            result.filter(
                user => {

                    const role =
                        user.role ||
                        "user";


                    return (
                        role ===
                        currentFilter
                    );

                }
            );

    }


    // =================================================
    // SEARCH
    // =================================================

    if (keyword) {

        result =
            result.filter(
                user => {

                    const name =
                        String(
                            user.name ||
                            ""
                        )
                            .toLowerCase();


                    const email =
                        String(
                            user.email ||
                            ""
                        )
                            .toLowerCase();


                    return (

                        name.includes(
                            keyword
                        )

                        ||

                        email.includes(
                            keyword
                        )

                    );

                }
            );

    }


    renderUsers(
        result
    );

}


// =====================================================
// RENDER USERS
// =====================================================

function renderUsers(
    list
) {

    hideLoading();


    if (usersTable) {

        usersTable.innerHTML =
            "";

    }


    // =================================================
    // RESULT
    // =================================================

    if (resultText) {

        resultText.textContent =
            `พบ ${list.length} รายการ`;

    }


    // =================================================
    // EMPTY
    // =================================================

    if (
        !list ||
        list.length === 0
    ) {

        if (usersTableWrapper) {

            usersTableWrapper.style.display =
                "none";

        }


        if (emptyUsers) {

            emptyUsers.style.display =
                "block";

        }


        return;

    }


    // =================================================
    // SHOW TABLE
    // =================================================

    if (usersTableWrapper) {

        usersTableWrapper.style.display =
            "block";

    }


    if (emptyUsers) {

        emptyUsers.style.display =
            "none";

    }


    // =================================================
    // RENDER EACH USER
    // =================================================

    list.forEach(
        user => {

            const role =
                user.role ||
                "user";


            const row =
                document.createElement(
                    "tr"
                );


            // =================================================
            // AVATAR
            // =================================================

            const avatar =
                getAvatar(
                    user
                );


            const userName =
                user.name ||
                "User";


            const email =
                user.email ||
                "-";


            // =================================================
            // ROLE
            // =================================================

            const roleClass =
                getRoleClass(
                    role
                );


            const roleText =
                getRoleText(
                    role
                );


            // =================================================
            // ACTIONS
            // =================================================

            let actions =
                "";


            // =================================================
            // SUPER ADMIN
            // =================================================

            if (
                role ===
                "superadmin"
            ) {

                actions = `

                    <button
                        class="action-btn disabled-btn"
                        type="button"
                        disabled>

                        🔒 ป้องกัน

                    </button>

                `;

            }


            // =================================================
            // USER
            // =================================================

            else if (
                role ===
                "user"
            ) {

                actions = `

                    <div class="user-actions">

                        <button
                            class="action-btn promote-btn"
                            type="button"
                            data-action="promote"
                            data-id="${escapeAttribute(
                                user.id
                            )}">

                            ⬆️ ตั้งเป็น Admin

                        </button>

                    </div>

                `;

            }


            // =================================================
            // ADMIN
            // =================================================

            else {

                actions = `

                    <div class="user-actions">

                        <button
                            class="action-btn demote-btn"
                            type="button"
                            data-action="demote"
                            data-id="${escapeAttribute(
                                user.id
                            )}">

                            ⬇️ ลดเป็น User

                        </button>

                    </div>

                `;

            }


            // =================================================
            // ROW HTML
            // =================================================

            row.innerHTML = `

                <td>

                    <div class="user-cell">

                        <img
                            class="user-avatar"
                            src="${escapeAttribute(
                                avatar
                            )}"
                            alt="${escapeAttribute(
                                userName
                            )}">

                        <span
                            class="user-name">

                            ${escapeHTML(
                                userName
                            )}

                        </span>

                    </div>

                </td>


                <td>

                    ${escapeHTML(
                        email
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


            // =================================================
            // AVATAR ERROR
            // =================================================

            const avatarImage =
                row.querySelector(
                    ".user-avatar"
                );


            if (avatarImage) {

                avatarImage.addEventListener(
                    "error",
                    () => {

                        avatarImage.src =
                            createAvatarFromName(
                                userName
                            );

                    }
                );

            }


            // =================================================
            // PROMOTE
            // =================================================

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


            // =================================================
            // DEMOTE
            // =================================================

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


            // =================================================
            // APPEND
            // =================================================

            if (usersTable) {

                usersTable.appendChild(
                    row
                );

            }

        }
    );

}


// =====================================================
// CHANGE ROLE
// =====================================================

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


    // =================================================
    // PROTECT SUPER ADMIN
    // =================================================

    if (
        user.role ===
        "superadmin"
    ) {

        showToast(
            "ไม่สามารถแก้ไข Super Admin ได้"
        );

        return;

    }


    const newRoleText =
        newRole === "admin"
            ? "Admin"
            : "User";


    const confirmMessage =
        newRole === "admin"

            ? `ตั้ง ${user.name || "ผู้ใช้"} เป็น Admin?`

            : `ลด ${user.name || "Admin"} เป็น User?`;


    if (
        !confirm(
            confirmMessage
        )
    ) {

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


        // =================================================
        // ไม่ต้อง loadUsers()
        // onSnapshot จะอัปเดตเอง
        // =================================================

        showToast(
            `✅ เปลี่ยนเป็น ${newRoleText} แล้ว`
        );

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


// =====================================================
// FILTER BUTTONS
// =====================================================

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                currentFilter =
                    button.dataset.filter ||
                    "all";


                filterButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                applyFilter();

            }
        );

    }
);


// =====================================================
// SUMMARY CARD FILTER
// =====================================================

summaryCards.forEach(
    card => {

        card.addEventListener(
            "click",
            () => {

                currentFilter =
                    card.dataset.filter ||
                    "all";


                filterButtons.forEach(
                    button => {

                        button.classList.toggle(

                            "active",

                            button.dataset.filter ===
                            currentFilter

                        );

                    }
                );


                applyFilter();

            }
        );

    }
);


// =====================================================
// SEARCH
// =====================================================

if (searchUser) {

    searchUser.addEventListener(
        "input",
        () => {

            applyFilter();

        }
    );

}


// =====================================================
// REFRESH
// =====================================================

if (refreshUsers) {

    refreshUsers.addEventListener(
        "click",
        () => {

            refreshUsers.disabled =
                true;


            updateSummary();

            applyFilter();


            setTimeout(
                () => {

                    refreshUsers.disabled =
                        false;

                },
                300
            );

        }
    );

}


// =====================================================
// LOADING
// =====================================================

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


// =====================================================
// ERROR
// =====================================================

function showError(
    error
) {

    hideLoading();


    if (usersTableWrapper) {

        usersTableWrapper.style.display =
            "block";

    }


    if (emptyUsers) {

        emptyUsers.style.display =
            "none";

    }


    if (usersTable) {

        usersTable.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="
                        text-align:center;
                        color:#ef4444;
                        padding:30px;
                    ">

                    โหลดข้อมูลไม่สำเร็จ

                    <br><br>

                    ${escapeHTML(
                        error?.message ||
                        "Unknown error"
                    )}

                </td>

            </tr>

        `;

    }

}


// =====================================================
// TOAST
// =====================================================

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


    clearTimeout(
        window.usersToastTimer
    );


    window.usersToastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
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
// INITIAL LOADING
// =====================================================

showLoading();