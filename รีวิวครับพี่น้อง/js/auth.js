// =====================================================
// Anime Review Hub
// auth.js
// Email Login + Register + Google Login
// =====================================================

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// REGISTER
// =====================================================

const registerBtn =
    document.getElementById("registerBtn");


if (registerBtn) {

    registerBtn.addEventListener(
        "click",
        async () => {

            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            if (
                !name ||
                !email ||
                !password
            ) {

                alert(
                    "กรุณากรอกข้อมูลให้ครบ"
                );

                return;

            }


            try {

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                await setDoc(
                    doc(
                        db,
                        "users",
                        userCredential.user.uid
                    ),
                    {

                        name:
                            name,

                        email:
                            email,

                        role:
                            "user",

                        photo:
                            "",

                        createdAt:
                            serverTimestamp()

                    }
                );


                alert(
                    "สมัครสมาชิกสำเร็จ"
                );


                window.location.href =
                    "login.html";


            }
            catch (error) {

                console.error(
                    "Register Error:",
                    error
                );


                alert(
                    getAuthErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// =====================================================
// EMAIL LOGIN
// =====================================================

const loginBtn =
    document.getElementById("loginBtn");


if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        async () => {

            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            if (
                !email ||
                !password
            ) {

                alert(
                    "กรุณากรอก Email และ Password"
                );

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                window.location.href =
                    "../index.html";


            }
            catch (error) {

                console.error(
                    "Login Error:",
                    error
                );


                alert(
                    getAuthErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// =====================================================
// GOOGLE LOGIN
// =====================================================

const googleLoginBtn =
    document.getElementById(
        "googleLoginBtn"
    );


if (googleLoginBtn) {

    googleLoginBtn.addEventListener(
        "click",
        async () => {

            googleLoginBtn.disabled =
                true;


            googleLoginBtn.textContent =
                "กำลังเข้าสู่ระบบ...";


            try {

                const provider =
                    new GoogleAuthProvider();


                const result =
                    await signInWithPopup(
                        auth,
                        provider
                    );


                const user =
                    result.user;


                // ==========================================
                // Check Firestore User
                // ==========================================

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                const userSnap =
                    await getDoc(
                        userRef
                    );


                // ==========================================
                // First Google Login
                // ==========================================

                if (
                    !userSnap.exists()
                ) {

                    await setDoc(
                        userRef,
                        {

                            name:
                                user.displayName ||
                                "User",

                            email:
                                user.email ||
                                "",

                            role:
                                "user",

                            photo:
                                user.photoURL ||
                                "",

                            createdAt:
                                serverTimestamp(),

                            provider:
                                "google"

                        }
                    );

                }
                else {

                    // ======================================
                    // อัปเดตรูป Google ล่าสุด
                    // แต่ไม่เปลี่ยน role
                    // ======================================

                    await setDoc(
                        userRef,
                        {

                            name:
                                user.displayName ||
                                userSnap.data().name ||
                                "User",

                            email:
                                user.email ||
                                userSnap.data().email ||
                                "",

                            photo:
                                user.photoURL ||
                                userSnap.data().photo ||
                                "",

                        },
                        {
                            merge:true
                        }
                    );

                }


                window.location.href =
                    "../index.html";


            }
            catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );


                alert(
                    getAuthErrorMessage(
                        error
                    )
                );


                googleLoginBtn.disabled =
                    false;


                googleLoginBtn.innerHTML = `
                    <span class="google-icon">
                        G
                    </span>
                    เข้าสู่ระบบด้วย Google
                `;

            }

        }
    );

}


// =====================================================
// AUTH ERROR MESSAGE
// =====================================================

function getAuthErrorMessage(error) {

    switch (
        error.code
    ) {

        case "auth/invalid-credential":
            return "Email หรือ Password ไม่ถูกต้อง";

        case "auth/user-not-found":
            return "ไม่พบบัญชีผู้ใช้นี้";

        case "auth/wrong-password":
            return "Password ไม่ถูกต้อง";

        case "auth/email-already-in-use":
            return "Email นี้ถูกใช้งานแล้ว";

        case "auth/weak-password":
            return "Password ต้องมีอย่างน้อย 6 ตัวอักษร";

        case "auth/popup-closed-by-user":
            return "ปิดหน้าต่าง Google Login";

        case "auth/popup-blocked":
            return "Browser บล็อกหน้าต่าง Google กรุณาอนุญาต Popup";

        case "auth/unauthorized-domain":
            return "Domain นี้ยังไม่ได้รับอนุญาตใน Firebase";

        default:
            return error.message ||
                "เกิดข้อผิดพลาด กรุณาลองใหม่";

    }

}

