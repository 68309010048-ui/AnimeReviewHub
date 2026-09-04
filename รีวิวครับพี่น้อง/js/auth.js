// =====================================================
// Anime Review Hub
// auth.js
// Register + Email Login + Google Login
// Forgot Password + Remember Me
// =====================================================

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
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

    registerBtn.addEventListener(
        "click",
        async () => {

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


            if (password.length < 6) {

                alert(
                    "Password ต้องมีอย่างน้อย 6 ตัวอักษร"
                );

                return;
            }


            registerBtn.disabled = true;

            registerBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสมัครสมาชิก...';


            try {

                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    result.user;


                // =========================================
                // Create Firestore User
                // =========================================

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


                registerBtn.disabled = false;

                registerBtn.innerHTML =
                    '<i class="fa-solid fa-user-plus"></i> สมัครสมาชิก';

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
        loginWithEmail
    );

}


// =====================================================
// Email Login Function
// =====================================================

async function loginWithEmail() {

    const emailInput =
        document.getElementById("loginEmail");

    const passwordInput =
        document.getElementById("loginPassword");

    const rememberMe =
        document.getElementById("rememberMe");

    const message =
        document.getElementById("message");


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";


    if (!email || !password) {

        showMessage(
            "กรุณากรอก Email และ Password"
        );

        return;
    }


    if (loginBtn) {

        loginBtn.disabled = true;

        loginBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...';

    }


    try {

        // =========================================
        // Remember Me
        // =========================================

        const persistence =
            rememberMe &&
            rememberMe.checked

                ? browserLocalPersistence

                : browserSessionPersistence;


        await setPersistence(
            auth,
            persistence
        );


        // =========================================
        // Sign In
        // =========================================

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
        // สร้าง User หากยังไม่มี
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


        // =========================================
        // ไปหน้า Home
        // =========================================

        window.location.href =
            "../index.html";

    }
    catch (error) {

        console.error(
            "Email Login Error:",
            error
        );


        showMessage(
            getAuthErrorMessage(
                error
            )
        );


        if (loginBtn) {

            loginBtn.disabled = false;

            loginBtn.innerHTML =
                '<i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ';

        }

    }

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
        loginWithGoogle
    );

}


// =====================================================
// Google Login
// =====================================================

async function loginWithGoogle() {

    googleLoginBtn.disabled = true;

    googleLoginBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        กำลังเข้าสู่ระบบ...
    `;


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
        // ครั้งแรก
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
        // ครั้งต่อไป
        // =========================================
        // ไม่เขียน photo
        // ไม่เขียน role
        // เพื่อป้องกันรูป Profile ถูก Google ทับ
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


        // =========================================
        // Home
        // =========================================

        window.location.href =
            "../index.html";

    }
    catch (error) {

        console.error(
            "Google Login Error:",
            error
        );


        showMessage(
            getAuthErrorMessage(
                error
            )
        );


        googleLoginBtn.disabled = false;


        googleLoginBtn.innerHTML = `
            <span class="google-icon">
                G
            </span>

            เข้าสู่ระบบด้วย Google
        `;

    }

}


// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPassword =
    document.getElementById(
        "forgotPassword"
    );


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        resetPassword
    );

}


// =====================================================
// Reset Password
// =====================================================

async function resetPassword() {

    const emailInput =
        document.getElementById("loginEmail");

    const email =
        emailInput
            ? emailInput.value.trim()
            : "";


    if (!email) {

        alert(
            "กรุณากรอก Email ก่อน แล้วกด ลืมรหัสผ่าน?"
        );

        if (emailInput) {

            emailInput.focus();

        }

        return;
    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        alert(
            "ส่งลิงก์สำหรับเปลี่ยน Password ไปที่ Email แล้ว"
        );

    }
    catch (error) {

        console.error(
            "Reset Password Error:",
            error
        );


        alert(
            getAuthErrorMessage(
                error
            )
        );

    }

}


// =====================================================
// Enter Key Login
// =====================================================

const loginEmail =
    document.getElementById(
        "loginEmail"
    );

const loginPassword =
    document.getElementById(
        "loginPassword"
    );


if (loginEmail) {

    loginEmail.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                loginWithEmail();

            }

        }
    );

}


if (loginPassword) {

    loginPassword.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                loginWithEmail();

            }

        }
    );

}


// =====================================================
// Message
// =====================================================

function showMessage(message) {

    const messageElement =
        document.getElementById(
            "message"
        );


    if (messageElement) {

        messageElement.textContent =
            message;

    }

}


// =====================================================
// Error Message
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

        case "auth/too-many-requests":
            return "มีการพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง";

        case "auth/user-disabled":
            return "บัญชีนี้ถูกระงับการใช้งาน";

        case "auth/operation-not-allowed":
            return "วิธีเข้าสู่ระบบนี้ยังไม่ได้เปิดใช้งานใน Firebase";

        case "auth/missing-password":
            return "กรุณากรอก Password";

        case "permission-denied":
            return "ไม่มีสิทธิ์เข้าถึง Firestore";

        case "auth/invalid-action-code":
            return "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว";

        default:
            return (
                error.message ||
                "เกิดข้อผิดพลาด กรุณาลองใหม่"
            );

    }

}