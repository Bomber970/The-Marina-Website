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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ================= WEBHOOKS ================= */
const WEBHOOK_APPS = "https://discord.com/api/webhooks/1449133910071054378/WnfKNZx_Qvef-WATbJbrQ6vog1JX3OIC4_fpWShp5lIKyQmV2_sD1kSQnauXq07fduFl";
const WEBHOOK_RES = "https://discord.com/api/webhooks/1449134540730929187/OfaO8GcR1_JZgpswRh0sPbMYS19wQYDGn0Y1FdrhqaWieItAuLaUoGBcHxSlhTMijsvh";
const WEBHOOK_RENTAL = "https://discord.com/api/webhooks/1449134644997132329/SlYFGqa-KBcjkuPkY2brntEDhlU8iROZoM5xXOpuAOenBL6-9ssrTNZDctY1rfNU_Oiu";

/* ================= DATA INITIALIZATION ================= */
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
    { cat: "Service", name: "(D) The Extra Lifeboat", contents: "1 App + 1 Entree + 1 Drink", cost: 37, price: 500, status: "👑 Premium" },
    { cat: "Combo", name: "Blue Lady Roll 5x5 Healthy", contents: "5 Healthy Sushi + 5 Drinks", cost: 255, price: 600, status: "🔥 High Margin" },
    { cat: "Combo", name: "The Shamu Combo 10x10", contents: "10 Entrees + 10 Drinks (Boil/Lobster Only)", cost: 290, price: 620, status: "💰 Great" },
    { cat: "Combo", name: "The Captain's Combo 5x5", contents: "5 Entrees + 5 Drinks (Boil/Lobster Only)", cost: 145, price: 350, status: "💰 Great" },
    { cat: "Service", name: "(D) Service Charge", contents: "Fee Only", cost: 0, price: 200, status: "💵 Pure Profit" },
    { cat: "Combo", name: "Service Combo (PD/EMS)", contents: "5 Entrees + 5 Drinks (Boil/Lobster Only)", cost: 145, price: 250, status: "✅ Good" },
    { cat: "Combo", name: "The Mino 1x1", contents: "1 Entree + 1 Drink (Calc. w/ Alfredo)", cost: 35, price: 100, status: "🔥 Best Value" },
    { cat: "Entree", name: "Healthy Sushi", contents: "1 Healthy Sushi", cost: 46, price: 100, status: "🔥 High Margin" },
    { cat: "Entree", name: "8oz Lobster Tail", contents: "10 Frozen Meat ($14ea) + Dough", cost: 24, price: 75, status: "🔥 High Margin" },
    { cat: "Entree", name: "Shrimp Alfredo", contents: "10 Premium Meat ($20ea) + Dough", cost: 30, price: 75, status: "✅ Good" },
    { cat: "Combo", name: "Tacklebox Combo 3x3", contents: "3 Entrees + 3 Drinks (Calc. w/ Alfredo)", cost: 105, price: 150, status: "⚠️ Low Profit" },
    { cat: "Drink", name: "Mint Mojito", contents: "1 Mint Mojito", cost: 5, price: 45, status: "🔥 High Margin" },
    { cat: "Appetizer", name: "Coconut Shrimp", contents: "5 Frozen Meat ($14ea) + Salt", cost: 8, price: 30, status: "🆗 Standard" },
    { cat: "Entree", name: "Alamo Seafood Boil", contents: "10 Frozen Meat ($14ea) + Dough", cost: 24, price: 40, status: "⚠️ Low Margin" }
];

let teamData = [];
let financialData = [];
let reservations = [];
let currentUserRole = null; 

/* ================= INITIAL LOAD (FIREBASE) ================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Listen for Team Data
    db.collection("marina_data").doc("team").onSnapshot((doc) => {
        if (doc.exists) {
            teamData = doc.data().members;
            renderPublicTeam();
            if(currentUserRole === 'superadmin') renderEditTeamForm();
        } else {
            // First time setup
            db.collection("marina_data").doc("team").set({ members: defaultTeam });
        }
    });

    // 2. Listen for Financial/Menu Data
    db.collection("marina_data").doc("financials").onSnapshot((doc) => {
        if (doc.exists) {
            financialData = doc.data().items;
            renderPublicMenu();
            if(currentUserRole === 'superadmin') renderFinancialsTable();
            if(currentUserRole) renderAdminMenuView();
        } else {
            // First time setup
            db.collection("marina_data").doc("financials").set({ items: defaultFinancials });
        }
    });

    // 3. Listen for Reservations
    db.collection("reservations").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        reservations = [];
        snapshot.forEach(doc => reservations.push(doc.data()));
        if(currentUserRole) renderAdminReservations();
    });

    setupBubbles();
});

/* ================= UTILS ================= */
function sendToDiscord(url, embedData) {
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embedData] })
    }).catch(err => console.error("Discord Error:", err));
}

function setupBubbles() {
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(b => {
        b.addEventListener('click', function(e) {
            if(this.classList.contains('popping')) return;
            this.classList.add('popping');
            setTimeout(() => {
                this.classList.remove('popping');
                this.style.animation = 'none';
                this.offsetHeight; 
                this.style.animation = ''; 
            }, 200);
        });
    });
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

/* ================= PUBLIC FUNCTIONS ================= */
function createTeamCard(member) {
    if(!member) return '';
    return `
        <div class="team-card">
            <img src="${member.img}" class="team-photo" alt="${member.name}" onerror="this.src='https://via.placeholder.com/80'">
            <h3>${member.name}</h3>
            <p><strong>${member.title}</strong></p>
            <p>${member.desc}</p>
        </div>
    `;
}

function renderPublicTeam() {
    const container = document.getElementById('all-staff-container');
    container.innerHTML = '';
    teamData.forEach(member => {
        container.innerHTML += createTeamCard(member);
    });
}

function renderPublicMenu() {
    const list = document.getElementById('public-menu-list');
    list.innerHTML = '';
    const hideDescription = [
        "Healthy Sushi", "8oz Lobster Tail", "Shrimp Alfredo", 
        "Tacklebox Combo 3x3", "Mint Mojito", "Coconut Shrimp", "Alamo Seafood Boil"
    ];
    financialData.forEach(item => {
        let descHtml = '';
        if (!hideDescription.includes(item.name)) {
            descHtml = `<br><span style="font-size:0.9rem; color: #555;">${item.contents}</span>`;
        }
        list.innerHTML += `
            <li style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <strong style="font-size:1.1rem; color: #00334e;">${item.name}</strong>
                ${descHtml}
            </li>`;
    });
}

/* ================= FORMS & DB WRITES ================= */

// Reservation
document.getElementById('reservation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newRes = {
        name: document.getElementById('res-name').value,
        phone: document.getElementById('res-phone').value,
        date: document.getElementById('res-date').value,
        size: document.getElementById('res-size').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firebase
    db.collection("reservations").add(newRes);

    // Discord
    const embed = {
        title: "🍽️ New Table Reservation",
        color: 3066993,
        fields: [
            { name: "Name", value: newRes.name, inline: true },
            { name: "Phone", value: newRes.phone, inline: true },
            { name: "Party Size", value: newRes.size, inline: true },
            { name: "Date/Time", value: newRes.date.replace('T', ' '), inline: false }
        ],
        footer: { text: "The Marina Automated System" }
    };
    sendToDiscord(WEBHOOK_RES, embed);

    alert("Reservation Request Sent!");
    closeModal('reservation-modal');
    e.target.reset();
});

// Rental
document.getElementById('rental-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const rental = {
        name: document.getElementById('rent-name').value,
        type: document.getElementById('rent-type').value,
        staff: document.getElementById('rent-staffing').value
    };

    const embed = {
        title: "🥂 New Venue Rental Inquiry",
        color: 15844367,
        fields: [
            { name: "Organization/Name", value: rental.name, inline: true },
            { name: "Event Type", value: rental.type, inline: true },
            { name: "Staffing Required?", value: rental.staff, inline: false }
        ],
        footer: { text: "The Marina Automated System" }
    };
    sendToDiscord(WEBHOOK_RENTAL, embed);

    alert("Rental Inquiry Sent!");
    closeModal('rental-modal');
    e.target.reset();
});

// Applications
document.getElementById('application-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const app = {
        discord: document.getElementById('app-discord').value,
        icName: document.getElementById('app-ic-name').value,
        id: document.getElementById('app-id').value,
        phone: document.getElementById('app-phone').value,
        storm: document.getElementById('app-storm').value,
        exp: document.getElementById('app-exp').value,
        mot: document.getElementById('app-mot').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firebase
    db.collection("applications").add(app);

    const embed = {
        title: "📝 New Job Application",
        color: 3447003,
        fields: [
            { name: "Discord", value: app.discord, inline: true },
            { name: "IC Name", value: app.icName, inline: true },
            { name: "State ID", value: app.id, inline: true },
            { name: "Phone", value: app.phone, inline: true },
            { name: "Availability", value: app.storm + " Storm", inline: false },
            { name: "Experience", value: app.exp || "None provided", inline: false },
            { name: "Motivation", value: app.mot || "None provided", inline: false }
        ],
        footer: { text: "The Marina Automated System" }
    };
    sendToDiscord(WEBHOOK_APPS, embed);

    alert("Application Submitted! Good luck.");
    closeModal('application-modal');
    e.target.reset();
});

/* ================= ADMIN FUNCTIONS ================= */
function attemptLogin() {
    const input = document.getElementById('admin-code').value;
    const errorMsg = document.getElementById('login-error');

    if (input === 'marina25') {
        currentUserRole = 'admin';
        setupAdminPanel();
    } else if (input === 'marinA25') {
        currentUserRole = 'superadmin';
        setupAdminPanel();
    } else {
        errorMsg.textContent = "Invalid Code.";
        return;
    }
    closeModal('login-modal');
    document.getElementById('admin-code').value = '';
    errorMsg.textContent = '';
    openModal('admin-panel');
}

function logout() {
    currentUserRole = null;
    closeModal('admin-panel');
    alert("Logged out.");
}

function setupAdminPanel() {
    const title = document.getElementById('admin-title');
    const superTabs = document.querySelectorAll('.super-only');
    
    renderAdminReservations();
    renderAdminMenuView();

    if (currentUserRole === 'superadmin') {
        title.textContent = "Admin Panel (Superadmin)";
        superTabs.forEach(el => el.style.display = 'block');
        renderFinancialsTable();
        renderEditTeamForm();
    } else {
        title.textContent = "Admin Panel";
        superTabs.forEach(el => el.style.display = 'none');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabId)) btn.classList.add('active');
    });
}

function renderAdminReservations() {
    const tbody = document.getElementById('admin-res-body');
    tbody.innerHTML = '';
    if(reservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No reservations.</td></tr>';
        return;
    }
    reservations.forEach(res => {
        tbody.innerHTML += `<tr><td>${res.name}</td><td>${res.date.replace('T', ' ')}</td><td>${res.size}</td><td>${res.phone}</td></tr>`;
    });
}

function renderAdminMenuView() {
    const div = document.getElementById('admin-menu-view-list');
    div.innerHTML = '<ul style="list-style:none; padding:0;">';
    financialData.forEach(item => { 
        div.innerHTML += `<li style="padding:5px; border-bottom:1px solid #eee;">
            <strong>${item.name}</strong> - ${item.contents}
        </li>`; 
    });
    div.innerHTML += '</ul>';
}

// === SUPERADMIN: FINANCIALS ===
function renderFinancialsTable() {
    const tbody = document.getElementById('financial-body');
    tbody.innerHTML = '';
    financialData.forEach((item, index) => {
        const profit = item.price - item.cost;
        const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
        
        tbody.innerHTML += `
            <tr>
                <td><input type="text" value="${item.cat}" onchange="updateFinData(${index}, 'cat', this.value)" style="width:70px"></td>
                <td><input type="text" value="${item.name}" onchange="updateFinData(${index}, 'name', this.value)"></td>
                <td><input type="text" value="${item.contents}" onchange="updateFinData(${index}, 'contents', this.value)"></td>
                <td><input type="number" value="${item.cost}" onchange="updateFinData(${index}, 'cost', this.value)" style="width:60px"></td>
                <td><input type="number" value="${item.price}" onchange="updateFinData(${index}, 'price', this.value)" style="width:60px"></td>
                <td class="${profitClass}">$${profit}</td>
                <td><input type="text" value="${item.status}" onchange="updateFinData(${index}, 'status', this.value)" style="width:100px"></td>
                <td><button class="btn btn-danger btn-small" onclick="deleteProduct(${index})">X</button></td>
            </tr>
        `;
    });
}

function updateFinData(index, key, value) {
    if(key === 'cost' || key === 'price') value = parseFloat(value);
    financialData[index][key] = value;
}

function addNewProductRow() {
    financialData.push({ cat: "New", name: "Item", contents: "Desc", cost: 0, price: 0, status: "Active" });
    renderFinancialsTable();
}

function deleteProduct(index) {
    if(confirm("Delete item?")) {
        financialData.splice(index, 1);
        renderFinancialsTable();
    }
}

function saveFinancials() {
    db.collection("marina_data").doc("financials").update({ items: financialData })
    .then(() => alert("Financials Saved to Database!"))
    .catch(err => alert("Error saving: " + err.message));
}

// === SUPERADMIN: TEAM ===
function renderEditTeamForm() {
    const container = document.getElementById('edit-team-container');
    container.innerHTML = '';
    teamData.forEach((member, index) => {
        container.innerHTML += `
            <div style="border:1px solid #ccc; padding:5px; margin-bottom:5px; border-radius:5px; background:#f9f9f9; font-size:0.8rem;">
                <strong>Staff Member #${index + 1}</strong><br>
                Name: <input type="text" value="${member.name}" onchange="updateTeamData(${index}, 'name', this.value)"><br>
                Title: <input type="text" value="${member.title}" onchange="updateTeamData(${index}, 'title', this.value)"><br>
                Desc: <input type="text" value="${member.desc}" onchange="updateTeamData(${index}, 'desc', this.value)"><br>
                Img URL: <input type="text" value="${member.img}" onchange="updateTeamData(${index}, 'img', this.value)">
            </div>
        `;
    });
}

function updateTeamData(index, key, value) { teamData[index][key] = value; }

function saveTeamChanges() {
    db.collection("marina_data").doc("team").update({ members: teamData })
    .then(() => alert("Team Updated in Database!"))
    .catch(err => alert("Error saving: " + err.message));
}