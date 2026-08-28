// =====================================================
// Anime Review Hub
// auth.js
// Register + Email Login + Google Login
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
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";


// =====================================================
// REGISTER
// =====================================================

const registerBtn =
    document.getElementById("registerBtn");


if (registerBtn) {

    registerBtn.addEventListener("click", async () => {

        const nameInput =
            document.getElementById("name");

        const emailInput =
            document.getElementById("email");

        const passwordInput =
            document.getElementById("password");


        const name =
            nameInput
                ? nameInput.value.trim()
                : "";

        const email =
            emailInput
                ? emailInput.value.trim()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";


        if (!name || !email || !password) {

            alert(
                "กรุณากรอกข้อมูลให้ครบ"
            );

            return;
        }


        try {

            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                result.user;


            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {
                    name: name,

                    email:
                        user.email || email,

                    role: "user",

                    photo: "",

                    createdAt:
                        serverTimestamp(),

                    provider: "email"
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

    });

}


// =====================================================
// EMAIL LOGIN
// =====================================================

const loginBtn =
    document.getElementById("loginBtn");


if (loginBtn) {

    loginBtn.addEventListener("click", async () => {

        const emailInput =
            document.getElementById("loginEmail");

        const passwordInput =
            document.getElementById("loginPassword");


        const email =
            emailInput
                ? emailInput.value.trim()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";


        console.log(
            "Email:",
            email
        );


        if (!email || !password) {

            alert(
                "กรุณากรอก Email และ Password"
            );

            return;
        }


        loginBtn.disabled = true;

        loginBtn.textContent =
            "กำลังเข้าสู่ระบบ...";


        try {

            const result =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                result.user;


            console.log(
                "Email Login Success:",
                user.email
            );


            // =========================================
            // ตรวจ users/{uid}
            // =========================================

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


            // =========================================
            // ถ้ายังไม่มี Firestore User
            // =========================================

            if (!userSnap.exists()) {

                await setDoc(
                    userRef,
                    {
                        name:
                            user.displayName ||
                            user.email ||
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
                            "email"
                    }
                );

            }


            window.location.href =
                "../index.html";

        }
        catch (error) {

            console.error(
                "Email Login Error:",
                error
            );


            alert(
                getAuthErrorMessage(
                    error
                )
            );


            loginBtn.disabled = false;

            loginBtn.textContent =
                "เข้าสู่ระบบ";

        }

    });

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


                console.log(
                    "Google Login:",
                    user.email
                );


                // =========================================
                // Firestore User
                // =========================================

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


                // =========================================
                // Google Login ครั้งแรก
                // =========================================

                if (!userSnap.exists()) {

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


                // =========================================
                // Google Login ครั้งต่อไป
                // =========================================
                // ไม่เปลี่ยน photo และ role
                // =========================================

                else {

                    const oldData =
                        userSnap.data();


                    await setDoc(
                        userRef,
                        {
                            name:
                                oldData.name ||
                                user.displayName ||
                                "User",

                            email:
                                oldData.email ||
                                user.email ||
                                ""
                        },
                        {
                            merge: true
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
// ERROR MESSAGE
// =====================================================

function getAuthErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-credential":

            return "Email หรือ Password ไม่ถูกต้อง";


        case "auth/user-not-found":

            return "ไม่พบบัญชีผู้ใช้นี้";


        case "auth/wrong-password":

            return "Password ไม่ถูกต้อง";


        case "auth/invalid-email":

            return "รูปแบบ Email ไม่ถูกต้อง";


        case "auth/email-already-in-use":

            return "Email นี้ถูกใช้งานแล้ว";


        case "auth/weak-password":

            return "Password ต้องมีอย่างน้อย 6 ตัวอักษร";


        case "auth/popup-closed-by-user":

            return "ปิดหน้าต่าง Google Login";


        case "auth/popup-blocked":

            return "Browser บล็อกหน้าต่าง Google";


        case "auth/unauthorized-domain":

            return "Domain นี้ยังไม่ได้เพิ่มใน Firebase Authorized Domains";


        case "auth/network-request-failed":

            return "ไม่สามารถเชื่อมต่อ Firebase ได้";


        case "permission-denied":

            return "ไม่มีสิทธิ์เข้าถึง Firestore";


        default:

            return (
                error.message ||
                "เกิดข้อผิดพลาด กรุณาลองใหม่"
            );

    }

}

