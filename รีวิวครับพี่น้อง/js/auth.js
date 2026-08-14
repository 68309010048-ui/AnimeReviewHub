// ======================================================
// Anime Review Hub
// auth.js
// Email/Password + Google Register
// ======================================================

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


// ======================================================
// Google Provider
// ======================================================

const googleProvider = new GoogleAuthProvider();


// ======================================================
// Register - Email / Password
// ======================================================

const registerBtn =
    document.getElementById("registerBtn");

if (registerBtn) {

    registerBtn.addEventListener("click", async () => {

        const name =
            document.getElementById("name")
                .value
                .trim();

        const email =
            document.getElementById("email")
                .value
                .trim();

        const password =
            document.getElementById("password")
                .value;


        if (!name || !email || !password) {

            alert("กรุณากรอกข้อมูลให้ครบ");

            return;

        }


        try {

            registerBtn.disabled = true;

            registerBtn.textContent =
                "กำลังสมัครสมาชิก...";


            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            // สร้างข้อมูลผู้ใช้ใน Firestore
            await setDoc(

                doc(
                    db,
                    "users",
                    user.uid
                ),

                {
                    name: name,

                    email: email,

                    role: "user",

                    photo: "",

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
                getAuthErrorMessage(error)
            );

            registerBtn.disabled = false;

            registerBtn.textContent =
                "สมัครสมาชิก";

        }

    });

}


// ======================================================
// Register - Google
// ======================================================

const googleRegisterBtn =
    document.getElementById(
        "googleRegisterBtn"
    );

if (googleRegisterBtn) {

    googleRegisterBtn.addEventListener(
        "click",
        async () => {

            try {

                googleRegisterBtn.disabled =
                    true;

                googleRegisterBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสมัครสมาชิก...';


                const result =
                    await signInWithPopup(
                        auth,
                        googleProvider
                    );


                const user =
                    result.user;


                // ตรวจสอบว่ามีข้อมูลใน Firestore หรือยัง
                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );

                const userSnap =
                    await getDoc(userRef);


                // ถ้ายังไม่มี ให้สร้างครั้งแรก
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
                                serverTimestamp()

                        }

                    );

                }


                alert(
                    "สมัครสมาชิกด้วย Google สำเร็จ"
                );


                window.location.href =
                    "../index.html";

            }
            catch (error) {

                console.error(
                    "Google Register Error:",
                    error
                );

                alert(
                    getGoogleErrorMessage(
                        error
                    )
                );


                googleRegisterBtn.disabled =
                    false;

                googleRegisterBtn.innerHTML =
                    '<i class="fa-brands fa-google"></i> สมัครสมาชิกด้วย Google';

            }

        }
    );

}


// ======================================================
// Login - Email / Password
// ======================================================

const loginBtn =
    document.getElementById("loginBtn");

if (loginBtn) {

    loginBtn.addEventListener("click", async () => {

        const email =
            document.getElementById("loginEmail")
                .value
                .trim();

        const password =
            document.getElementById("loginPassword")
                .value;


        if (!email || !password) {

            alert(
                "กรุณากรอก Email และ Password"
            );

            return;

        }


        try {

            loginBtn.disabled = true;

            loginBtn.textContent =
                "กำลังเข้าสู่ระบบ...";


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
                getAuthErrorMessage(error)
            );

            loginBtn.disabled = false;

            loginBtn.textContent =
                "เข้าสู่ระบบ";

        }

    });

}


// ======================================================
// Error - Email / Password
// ======================================================

function getAuthErrorMessage(error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            return "อีเมลนี้ถูกใช้งานแล้ว";

        case "auth/invalid-email":
            return "รูปแบบ Email ไม่ถูกต้อง";

        case "auth/weak-password":
            return "Password ต้องมีอย่างน้อย 6 ตัวอักษร";

        case "auth/invalid-credential":
            return "Email หรือ Password ไม่ถูกต้อง";

        case "auth/user-not-found":
            return "ไม่พบผู้ใช้นี้";

        case "auth/wrong-password":
            return "Password ไม่ถูกต้อง";

        default:
            return error.message ||
                "เกิดข้อผิดพลาด";

    }

}


// ======================================================
// Error - Google
// ======================================================

function getGoogleErrorMessage(error) {

    switch (error.code) {

        case "auth/popup-closed-by-user":
            return "คุณปิดหน้าต่าง Google Login";

        case "auth/popup-blocked":
            return "Browser บล็อกหน้าต่าง Google Login";

        case "auth/cancelled-popup-request":
            return "การสมัครถูกยกเลิก";

        case "auth/operation-not-allowed":
            return "ยังไม่ได้เปิด Google Login ใน Firebase";

        case "auth/account-exists-with-different-credential":
            return "อีเมลนี้มีบัญชีอยู่แล้วด้วยวิธี Login อื่น";

        default:
            return error.message ||
                "สมัครสมาชิกด้วย Google ไม่สำเร็จ";

    }

}