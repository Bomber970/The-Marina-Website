/* ================= FIREBASE CONFIGURATION ================= */
const firebaseConfig = {
  apiKey: "AIzaSyD8vvI5QENQr_oajP1VxUEMakzMcxYi2bQ",
  authDomain: "the-marina-rp.firebaseapp.com",
  projectId: "the-marina-rp",
  storageBucket: "the-marina-rp.firebasestorage.app",
  messagingSenderId: "955663143694",
  appId: "1:955663143694:web:1f54138e2c666481543d5f"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
} else { console.error("Firebase SDK not loaded."); var db = null; }

/* ================= WEBHOOKS & GLOBALS ================= */
const WEBHOOK_APPS = "https://discord.com/api/webhooks/1449133910071054378/WnfKNZx_Qvef-WATbJbrQ6vog1JX3OIC4_fpWShp5lIKyQmV2_sD1kSQnauXq07fduFl";
const WEBHOOK_RES = "https://discord.com/api/webhooks/1449134540730929187/OfaO8GcR1_JZgpswRh0sPbMYS19wQYDGn0Y1FdrhqaWieItAuLaUoGBcHxSlhTMijsvh";
const WEBHOOK_RENTAL = "https://discord.com/api/webhooks/1449134644997132329/SlYFGqa-KBcjkuPkY2brntEDhlU8iROZoM5xXOpuAOenBL6-9ssrTNZDctY1rfNU_Oiu";

let teamData = [];
let financialData = [];
let reservations = [];
let currentUserRole = null;

// Fallback Data
const defaultTeam = [
    { name: "Russ", title: "Owner", desc: "The Visionary", img: "img/RussMarina.png" },
    { name: "Kaizo", title: "Co-Owner", desc: "Head Chef", img: "img/KaizoMarina.png" },
    { name: "Zeb", title: "Co-Owner", desc: "Operations", img: "img/ZebMarina.png" },
    { name: "Deon", title: "Co-Owner", desc: "PR Lead", img: "img/DeonMarina.png" },
    { name: "Aura", title: "Manager", desc: "Staff Lead", img: "img/AuraMarina.png" }
];

const defaultFinancials = [
    { cat: "Combo", name: "The Catering Bundle", contents: "50 Apps + 50 Entrees + 50 Drinks", cost: 1850, price: 5000, status: "💰 HUGE" },
    { cat: "Service", name: "(D) The 5 Star Experience", contents: "2 Apps + 2 Entrees + 2 Drinks", cost: 74, price: 1000, status: "👑 Premium" },
    { cat: "Entree", name: "8oz Lobster Tail", contents: "10 Frozen Meat ($14ea) + Dough", cost: 24, price: 75, status: "🔥 High Margin" }
];

/* ================= INITIAL LOAD ================= */
document.addEventListener('DOMContentLoaded', () => {
    if (!db) return;

    // Load Team
    db.collection("marina_data").doc("team").onSnapshot((doc) => {
        if (doc.exists) { teamData = doc.data().members; } 
        else { db.collection("marina_data").doc("team").set({ members: defaultTeam }); teamData = defaultTeam; }
        renderPublicTeam();
        if(currentUserRole === 'superadmin') renderEditTeamForm();
    });

    // Load Financials/Menu
    db.collection("marina_data").doc("financials").onSnapshot((doc) => {
        if (doc.exists) { financialData = doc.data().items; } 
        else { db.collection("marina_data").doc("financials").set({ items: defaultFinancials }); financialData = defaultFinancials; }
        renderPublicMenu();
        if(currentUserRole === 'superadmin') renderFinancialsTable();
        if(currentUserRole) renderAdminMenuView();
    });

    // Load Reservations
    db.collection("reservations").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        reservations = [];
        snapshot.forEach(doc => {
            let data = doc.data();
            data.docId = doc.id;
            reservations.push(data);
        });
        if(currentUserRole) renderAdminReservations();
    });
});

/* ================= PUBLIC UI FUNCTIONS ================= */
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function createTeamCard(member) {
    if(!member) return '';
    return `<div class="team-card">
        <img src="${member.img}" class="team-photo" onerror="this.src='https://via.placeholder.com/80'">
        <h3>${member.name}</h3><p><strong>${member.title}</strong></p><p>${member.desc}</p>
    </div>`;
}

function renderPublicTeam() {
    const container = document.getElementById('all-staff-container');
    container.innerHTML = '';
    teamData.forEach(member => container.innerHTML += createTeamCard(member));
}

function renderPublicMenu() {
    const list = document.getElementById('public-menu-list');
    list.innerHTML = '';
    financialData.forEach(item => {
        list.innerHTML += `<li style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
            <strong style="font-size:1.1rem; color: #00334e;">${item.name}</strong><br>
            <span style="font-size:0.9rem; color: #555;">${item.contents}</span>
        </li>`;
    });
}

function sendToDiscord(url, embedData) {
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embedData] })
    }).catch(err => console.error("Discord Error:", err));
}

/* ================= FORM HANDLERS ================= */

// RESERVATION FORM (SIMPLE)
document.getElementById('reservation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newRes = {
        name: document.getElementById('res-name').value,
        phone: document.getElementById('res-phone').value,
        size: document.getElementById('res-size').value,
        date: document.getElementById('res-date').value,
        notes: document.getElementById('res-notes').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("reservations").add(newRes);

    const embed = {
        title: "📅 New Reservation Request",
        color: 15844367,
        fields: [
            { name: "Name", value: newRes.name, inline: true },
            { name: "Size", value: newRes.size, inline: true },
            { name: "Phone", value: newRes.phone, inline: true },
            { name: "Date/Time", value: newRes.date.replace('T', ' '), inline: false },
            { name: "Notes", value: newRes.notes || "None", inline: false }
        ]
    };
    sendToDiscord(WEBHOOK_RES, embed);

    alert("Reservation Sent! We will contact you to confirm.");
    closeModal('reservation-modal');
    e.target.reset();
});

// RENTAL FORM
document.getElementById('rental-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const rental = {
        name: document.getElementById('rent-name').value,
        type: document.getElementById('rent-type').value,
        staff: document.getElementById('rent-staffing').value
    };
    const embed = {
        title: "🥂 Venue Rental Inquiry", color: 15844367,
        fields: [{ name: "Name", value: rental.name }, { name: "Type", value: rental.type }, { name: "Staffing", value: rental.staff }]
    };
    sendToDiscord(WEBHOOK_RENTAL, embed);
    alert("Inquiry Sent!");
    closeModal('rental-modal');
    e.target.reset();
});

// APPLICATION FORM
document.getElementById('application-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const app = {
        discord: document.getElementById('app-discord').value,
        icName: document.getElementById('app-ic-name').value,
        id: document.getElementById('app-id').value,
        phone: document.getElementById('app-phone').value,
        storm: document.getElementById('app-storm').value,
        exp: document.getElementById('app-exp').value,
        mot: document.getElementById('app-mot').value
    };
    db.collection("applications").add(app);
    const embed = {
        title: "📝 Job Application", color: 3447003,
        fields: [
            { name: "Discord", value: app.discord, inline: true },
            { name: "Name", value: app.icName, inline: true },
            { name: "ID", value: app.id, inline: true },
            { name: "Exp", value: app.exp || "-", inline: false }
        ]
    };
    sendToDiscord(WEBHOOK_APPS, embed);
    alert("Application Submitted!");
    closeModal('application-modal');
    e.target.reset();
});

/* ================= ADMIN FUNCTIONS ================= */

function attemptLogin() {
    const input = document.getElementById('admin-code').value;
    if (input === 'marina25') {
        currentUserRole = 'admin';
        setupAdminPanel();
    } else if (input === 'marinA25') {
        currentUserRole = 'superadmin';
        setupAdminPanel();
    } else {
        document.getElementById('login-error').innerText = "Invalid Code";
        return;
    }
    closeModal('login-modal');
    openModal('admin-panel');
}

function logout() {
    currentUserRole = null;
    closeModal('admin-panel');
    alert("Logged out.");
}

function setupAdminPanel() {
    document.getElementById('admin-title').innerText = currentUserRole === 'superadmin' ? "Admin Panel (Super)" : "Admin Panel";
    document.querySelectorAll('.super-only').forEach(el => el.style.display = currentUserRole === 'superadmin' ? 'block' : 'none');
    
    renderAdminReservations();
    renderAdminMenuView();
    if(currentUserRole === 'superadmin') {
        renderFinancialsTable();
        renderEditTeamForm();
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function renderAdminReservations() {
    const tbody = document.getElementById('admin-res-body');
    tbody.innerHTML = '';
    reservations.forEach(res => {
        tbody.innerHTML += `<tr>
            <td>${res.name}</td>
            <td>${res.date.replace('T', ' ')}</td>
            <td>${res.size}</td>
            <td>${res.phone}</td>
            <td>${res.notes || '-'}</td>
            <td><button class="btn btn-danger btn-small" onclick="deleteRes('${res.docId}')">Delete</button></td>
        </tr>`;
    });
}

function deleteRes(docId) {
    if(confirm("Delete this reservation?")) {
        db.collection("reservations").doc(docId).delete();
    }
}

// Reuse existing admin functions for Financials/Team
function renderAdminMenuView() {
    const div = document.getElementById('admin-menu-view-list');
    div.innerHTML = '<ul>';
    financialData.forEach(i => div.innerHTML += `<li>${i.name} (${i.price})</li>`);
    div.innerHTML += '</ul>';
}

function renderFinancialsTable() {
    const tbody = document.getElementById('financial-body');
    tbody.innerHTML = '';
    financialData.forEach((item, index) => {
        tbody.innerHTML += `<tr>
            <td><input value="${item.cat}" onchange="updFin(${index},'cat',this.value)"></td>
            <td><input value="${item.name}" onchange="updFin(${index},'name',this.value)"></td>
            <td><input value="${item.contents}" onchange="updFin(${index},'contents',this.value)"></td>
            <td><input type="number" value="${item.cost}" onchange="updFin(${index},'cost',this.value)"></td>
            <td><input type="number" value="${item.price}" onchange="updFin(${index},'price',this.value)"></td>
            <td><button onclick="delFin(${index})">X</button></td>
        </tr>`;
    });
}
function updFin(i,k,v) { financialData[i][k] = (k==='cost'||k==='price') ? parseFloat(v) : v; }
function delFin(i) { financialData.splice(i,1); renderFinancialsTable(); }
function addNewProductRow() { financialData.push({cat:"",name:"",contents:"",cost:0,price:0,status:""}); renderFinancialsTable(); }
function saveFinancials() { db.collection("marina_data").doc("financials").update({items:financialData}).then(()=>alert("Saved")); }

function renderEditTeamForm() {
    const c = document.getElementById('edit-team-container'); c.innerHTML = '';
    teamData.forEach((m,i) => {
        c.innerHTML += `<div><input value="${m.name}" onchange="updTeam(${i},'name',this.value)"> <input value="${m.title}" onchange="updTeam(${i},'title',this.value)"></div>`;
    });
}
function updTeam(i,k,v) { teamData[i][k] = v; }
function saveTeamChanges() { db.collection("marina_data").doc("team").update({members:teamData}).then(()=>alert("Saved")); }