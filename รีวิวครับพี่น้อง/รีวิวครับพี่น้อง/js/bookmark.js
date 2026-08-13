import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {

collection,
query,
where,
getDocs,
deleteDoc,
doc

} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const bookmarkList=document.getElementById("bookmarkList");
const bookmarkCount=document.getElementById("bookmarkCount");
const emptyBox=document.getElementById("emptyBox");
const search=document.getElementById("searchBookmark");

let bookmark=[];
let currentUser=null;

onAuthStateChanged(auth,async(user)=>{

if(!user){

location.href="../login.html";
return;

}

currentUser=user;

loadBookmark();

});

async function loadBookmark(){

bookmark=[];

const q=query(

collection(db,"bookmarks"),

where("uid","==",currentUser.uid)

);

const snap=await getDocs(q);

snap.forEach(docSnap=>{

bookmark.push({

id:docSnap.id,

...docSnap.data()

});

});

showBookmark(bookmark);

}

function showBookmark(list){

bookmarkList.innerHTML="";

bookmarkCount.textContent=list.length;

if(list.length===0){

bookmarkList.style.display="none";
emptyBox.style.display="block";
return;

}

bookmarkList.style.display="grid";
emptyBox.style.display="none";

list.forEach(item=>{

bookmarkList.innerHTML+=`

<div class="card">

<img src="${item.image}">

<div class="card-content">

<h3>${item.title}</h3>

<p class="genre">

${item.category}

</p>

<p class="rating">

⭐ ${Number(item.score||0).toFixed(1)}

</p>

<div class="card-buttons">

<button
class="detail-btn"
onclick="showDetail('${item.animeId}')">

ดูรายละเอียด

</button>

<button
class="remove-btn"
onclick="removeBookmark('${item.id}')">

🔖 ลบออก

</button>

</div>

</div>

</div>

`;

});

}

search.addEventListener("keyup",()=>{

const keyword=search.value.toLowerCase();

const result=bookmark.filter(item=>

item.title.toLowerCase().includes(keyword)

);

showBookmark(result);

});

window.showDetail=function(id){

localStorage.setItem("animeId",id);

location.href="detail.html";

}

window.removeBookmark=async function(id){

if(!confirm("ลบ Bookmark ?")) return;

await deleteDoc(doc(db,"bookmarks",id));

loadBookmark();

}