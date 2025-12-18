/* ================= FIREBASE CONFIGURATION ================= */
const firebaseConfig = {
  apiKey: "AIzaSyD8vvI5QENQr_oajP1VxUEMakzMcxYi2bQ",
  authDomain: "the-marina-rp.firebaseapp.com",
  projectId: "the-marina-rp",
  storageBucket: "the-marina-rp.firebasestorage.app",
  messagingSenderId: "955663143694",
  appId: "1:955663143694:web:1f54138e2c666481543d5f"
};

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
let events = []; 
let currentUserRole = null;

// --- FALLBACK DATA (Edit this list to change defaults) ---
const defaultTeam = [
    { name: "Russ", title: "Owner", desc: "The Visionary", img: "img/RussMarina.png" },
    { name: "Kaizo", title: "Co-Owner", desc: "Head Chef", img: "img/KaizoMarina.png" },
    { name: "Zeb", title: "Co-Owner", desc: "Operations", img: "img/ZebMarina.png" },
    { name: "Deon", title: "Co-Owner", desc: "PR Lead", img: "img/DeonMarina.png" },
    { name: "Aura", title: "Manager", desc: "Staff Lead", img: "img/AuraMarina.png" },
    // NEW MANAGER ADDED HERE
    { name: "Legend Stewart", title: "Manager", desc: "Staff Lead", img: "img/LegendMarina.png" },
    { name: "Legend Stewart", title: "Manager", desc: "Staff Lead", img: "img/LegendMarina.png" }
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

    // Load Financials
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
        snapshot.forEach(doc => { let data = doc.data(); data.docId = doc.id; reservations.push(data); });
        if(currentUserRole) renderAdminReservations();
    });

    // Load Events
    db.collection("events").orderBy("date", "asc").onSnapshot((snapshot) => {
        events = [];
        snapshot.forEach(doc => { let data = doc.data(); data.docId = doc.id; events.push(data); });
        renderPublicEvents();
        if(currentUserRole) renderAdminEvents(); 
    });

    setupBubbles();
});

/* ================= UTILS & UI ================= */
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function setupBubbles() {
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(b => {
        b.addEventListener('click', function(e) {
            if(this.classList.contains('popping')) return;
            this.classList.add('popping');
            setTimeout(() => { this.classList.remove('popping'); this.style.animation = 'none'; this.offsetHeight; this.style.animation = ''; }, 200);
        });
    });
}

function sendToDiscord(url, embedData) {
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embedData] })
    }).catch(err => console.error("Discord Error:", err));
}

/* ================= PUBLIC RENDER FUNCTIONS ================= */
// UPDATED: Now accepts INDEX for click handler
function createTeamCard(member, index) {
    if(!member) return '';
    // Pass the index to openTeamMember function
    return `<div class="team-card" onclick="openTeamMember(${index})">
        <img src="${member.img}" class="team-photo" onerror="this.src='https://via.placeholder.com/80'">
        <h3>${member.name}</h3><p><strong>${member.title}</strong></p><p>${member.desc}</p>
    </div>`;
}

function renderPublicTeam() {
    const container = document.getElementById('all-staff-container');
    container.innerHTML = '';
    // Pass index to createTeamCard
    teamData.forEach((member, index) => {
        container.innerHTML += createTeamCard(member, index);
    });
}

// NEW: Function to open team member in modal
function openTeamMember(index) {
    const member = teamData[index];
    if(!member) return;

    document.getElementById('tm-img').src = member.img || 'https://via.placeholder.com/150';
    document.getElementById('tm-name').innerText = member.name;
    document.getElementById('tm-title').innerText = member.title;
    document.getElementById('tm-desc').innerText = member.desc;

    openModal('team-modal');
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

function renderPublicEvents() {
    const container = document.getElementById('event-display-container');
    const upcomingEvents = events.filter(e => e.status === 'confirmed' && new Date(e.date) > new Date());
    
    if (upcomingEvents.length === 0) {
        container.style.display = 'none';
        return;
    }

    const nextEvent = upcomingEvents[0]; 
    const dateObj = new Date(nextEvent.date);
    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    container.style.display = 'block';
    container.innerHTML = `
        <div class="event-popup-container">
            <div class="event-popup-header">
                <img src="${nextEvent.image}" class="event-popup-img" onerror="this.src='https://via.placeholder.com/300x150?text=The+Marina'">
                <button class="event-close-btn" onclick="closeEventPopup()">X</button>
            </div>
            <div class="event-popup-body">
                <span class="event-popup-badge">Upcoming</span>
                <h3>${nextEvent.title}</h3>
                <h5>📅 ${dateStr} @ ${nextEvent.location}</h5>
                <p>${nextEvent.desc}</p>
                ${nextEvent.isDinner ? `<button onclick="openModal('reservation-modal')" class="btn btn-primary btn-small">Book Table</button>` : ''}
            </div>
        </div>
    `;
}

function closeEventPopup() {
    document.getElementById('event-display-container').style.display = 'none';
}

/* ================= FORMS ================= */
document.getElementById('reservation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newRes = {
        name: document.getElementById('res-name').value,
        phone: document.getElementById('res-phone').value,
        date: document.getElementById('res-date').value,
        size: document.getElementById('res-size').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection("reservations").add(newRes);
    sendToDiscord(WEBHOOK_RES, {
        title: "📅 New Reservation Request", color: 15844367,
        fields: [{ name: "Name", value: newRes.name, inline: true }, { name: "Size", value: newRes.size, inline: true }, { name: "Phone", value: newRes.phone, inline: true }, { name: "Date", value: newRes.date.replace('T', ' '), inline: false }]
    });
    alert("Reservation Sent!"); closeModal('reservation-modal'); e.target.reset();
});

document.getElementById('rental-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const rental = { name: document.getElementById('rent-name').value, type: document.getElementById('rent-type').value, staff: document.getElementById('rent-staffing').value };
    sendToDiscord(WEBHOOK_RENTAL, { title: "🥂 Venue Rental Inquiry", color: 15844367, fields: [{ name: "Name", value: rental.name }, { name: "Type", value: rental.type }, { name: "Staffing", value: rental.staff }] });
    alert("Inquiry Sent!"); closeModal('rental-modal'); e.target.reset();
});

document.getElementById('application-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const app = { discord: document.getElementById('app-discord').value, icName: document.getElementById('app-ic-name').value, id: document.getElementById('app-id').value, phone: document.getElementById('app-phone').value, storm: document.getElementById('app-storm').value, exp: document.getElementById('app-exp').value, mot: document.getElementById('app-mot').value };
    db.collection("applications").add(app);
    sendToDiscord(WEBHOOK_APPS, { title: "📝 Job Application", color: 3447003, fields: [{ name: "Discord", value: app.discord, inline: true }, { name: "Name", value: app.icName, inline: true }, { name: "ID", value: app.id, inline: true }] });
    alert("Application Submitted!"); closeModal('application-modal'); e.target.reset();
});

/* ================= ADMIN FUNCTIONS ================= */
function attemptLogin() {
    const input = document.getElementById('admin-code').value;
    if (input === 'marina25') { currentUserRole = 'admin'; setupAdminPanel(); }
    else if (input === 'marinA25') { currentUserRole = 'superadmin'; setupAdminPanel(); }
    else { document.getElementById('login-error').innerText = "Invalid Code"; return; }
    closeModal('login-modal'); openModal('admin-panel');
}

function logout() { currentUserRole = null; closeModal('admin-panel'); alert("Logged out."); }

function setupAdminPanel() {
    document.getElementById('admin-title').innerText = currentUserRole === 'superadmin' ? "Admin Panel (Super)" : "Admin Panel";
    document.querySelectorAll('.super-only').forEach(el => el.style.display = currentUserRole === 'superadmin' ? 'block' : 'none');
    
    renderAdminReservations();
    renderAdminMenuView();
    renderAdminEvents(); 
    if(currentUserRole === 'superadmin') { renderFinancialsTable(); renderEditTeamForm(); }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// EVENTS LOGIC
function createNewEvent() {
    const title = document.getElementById('evt-title').value;
    const date = document.getElementById('evt-date').value;
    const img = document.getElementById('evt-img').value;
    const loc = document.getElementById('evt-loc').value;
    const desc = document.getElementById('evt-desc').value;
    const isDinner = document.getElementById('evt-is-dinner').checked;

    if(!title || !date || !img || !loc || !desc) { alert("All fields required"); return; }

    db.collection("events").add({
        title, date, image: img, location: loc, desc, isDinner,
        status: 'pending', 
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Event created! Status: Pending (Needs SADMIN confirmation)");
    document.getElementById('evt-title').value = ''; document.getElementById('evt-date').value = ''; 
    document.getElementById('evt-img').value = ''; document.getElementById('evt-loc').value = ''; document.getElementById('evt-desc').value = '';
}

function renderAdminEvents() {
    const tbody = document.getElementById('admin-events-body');
    tbody.innerHTML = '';
    events.forEach(ev => {
        let confirmBtn = '';
        if(ev.status === 'pending' && currentUserRole === 'superadmin') {
            confirmBtn = `<button class="btn btn-primary btn-small" onclick="confirmEvent('${ev.docId}')">Confirm</button> `;
        }
        let statusColor = ev.status === 'confirmed' ? 'green' : 'orange';
        tbody.innerHTML += `<tr><td>${ev.title}</td><td>${ev.date.replace('T', ' ')}</td><td>${ev.isDinner ? 'Dinner' : 'Event'}</td><td style="color:${statusColor}; font-weight:bold;">${ev.status.toUpperCase()}</td><td>${confirmBtn}<button class="btn btn-danger btn-small" onclick="deleteEvent('${ev.docId}')">Delete</button></td></tr>`;
    });
}

function confirmEvent(docId) { if(confirm("Confirm this event?")) db.collection("events").doc(docId).update({status: 'confirmed'}); }
function deleteEvent(docId) { if(confirm("Delete this event?")) db.collection("events").doc(docId).delete(); }

// RESERVATIONS LOGIC
function renderAdminReservations() {
    const tbody = document.getElementById('admin-res-body');
    tbody.innerHTML = '';
    reservations.forEach(res => {
        tbody.innerHTML += `<tr><td>${res.name}</td><td>${res.date.replace('T', ' ')}</td><td>${res.size}</td><td>${res.phone}</td>
        <td><button class="btn btn-danger btn-small" onclick="deleteRes('${res.docId}')">Delete</button></td></tr>`;
    });
}
function deleteRes(id) { if(confirm("Delete reservation?")) db.collection("reservations").doc(id).delete(); }

// FINANCIALS LOGIC
function renderAdminMenuView() { const div = document.getElementById('admin-menu-view-list'); div.innerHTML = '<ul>'; financialData.forEach(i => div.innerHTML += `<li>${i.name} ($${i.price})</li>`); div.innerHTML += '</ul>'; }
function renderFinancialsTable() { const tb = document.getElementById('financial-body'); tb.innerHTML = ''; financialData.forEach((item, i) => { tb.innerHTML += `<tr><td><input value="${item.cat}" onchange="updFin(${i},'cat',this.value)"></td><td><input value="${item.name}" onchange="updFin(${i},'name',this.value)"></td><td><input value="${item.contents}" onchange="updFin(${i},'contents',this.value)"></td><td><input type="number" value="${item.cost}" onchange="updFin(${i},'cost',this.value)"></td><td><input type="number" value="${item.price}" onchange="updFin(${i},'price',this.value)"></td><td><button onclick="delFin(${i})">X</button></td></tr>`; }); }
function updFin(i,k,v) { financialData[i][k] = (k==='cost'||k==='price') ? parseFloat(v) : v; }
function delFin(i) { financialData.splice(i,1); renderFinancialsTable(); }
function addNewProductRow() { financialData.push({cat:"",name:"",contents:"",cost:0,price:0,status:""}); renderFinancialsTable(); }
function saveFinancials() { db.collection("marina_data").doc("financials").update({items:financialData}).then(()=>alert("Saved")); }

// TEAM LOGIC & RESET BUTTON
function renderEditTeamForm() { 
    const c = document.getElementById('edit-team-container'); 
    c.innerHTML = ''; 
    teamData.forEach((m,i) => { 
        c.innerHTML += `
            <div style="background:#f9f9f9; padding:10px; border:1px solid #ddd; margin-bottom:10px; border-radius:5px;">
                <label>Name:</label> <input value="${m.name}" onchange="updTeam(${i},'name',this.value)">
                <label>Title:</label> <input value="${m.title}" onchange="updTeam(${i},'title',this.value)">
                <label>Description:</label> <input value="${m.desc}" onchange="updTeam(${i},'desc',this.value)">
                <label>Image URL:</label> <input value="${m.img}" onchange="updTeam(${i},'img',this.value)">
            </div>
        `; 
    }); 
    
    // RESET BUTTON
    c.innerHTML += `
        <div style="margin-top:20px; border-top:2px solid #eee; padding-top:10px;">
            <p style="color:red; font-size:0.8rem;">Warning: This button resets the live database to the code defaults (including 2x Legend Stewart).</p>
            <button class="btn btn-danger" onclick="resetTeamToDefaults()">⚠ Reset Team to Code Defaults</button>
        </div>
    `;
}

function updTeam(i,k,v) { teamData[i][k] = v; }
function saveTeamChanges() { db.collection("marina_data").doc("team").update({members:teamData}).then(()=>alert("Saved")); }

function resetTeamToDefaults() {
    if(confirm("Are you sure? This will OVERWRITE the database with the list in script.js.")) {
        db.collection("marina_data").doc("team").set({ members: defaultTeam })
        .then(() => {
            alert("Team reset! Refresh the page.");
            location.reload();
        });
    }
}