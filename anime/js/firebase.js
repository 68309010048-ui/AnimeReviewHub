import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMqcBdBOclKmUK-Sj0QKPK5re4XEFpCVc",
  authDomain: "animereviewhub.firebaseapp.com",
  projectId: "animereviewhub",
  storageBucket: "animereviewhub.firebasestorage.app",
  messagingSenderId: "222386848907",
  appId: "1:222386848907:web:3253a3b7511fa2135c808e"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };