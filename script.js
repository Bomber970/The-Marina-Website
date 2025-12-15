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
} else {
    console.error("Firebase SDK not loaded. Check script imports in index.html.");
    var db = null;
}

/* ================= WEBHOOKS & DATA ================= */
const WEBHOOK_APPS = "https://discord.com/api/webhooks/1449133910071054378/WnfKNZx_Qvef-WATbJbrQ6vog1JX3OIC4_fpWShp5lIKyQmV2_sD1kSQnauXq07fduFl";
const WEBHOOK_RES = "https://discord.com/api/webhooks/1449134540730929187/OfaO8GcR1_JZgpswRh0sPbMYS19wQYDGn0Y1FdrhqaWieItAuLaUoGBcHxSlhTMijsvh";
const WEBHOOK_RENTAL = "https://discord.com/api/webhooks/1449134644997132329/SlYFGqa-KBcjkuPkY2brntEDhlU8iROZoM5xXOpuAOenBL6-9ssrTNZDctY1rfNU_Oiu";

// --- CORE DATA ARRAYS ---
let teamData = [];
let financialData = [];
let reservations = [];
let allTablesConfig = []; // NEW: This will be loaded from Firebase
let currentUserRole = null; 

// --- RESERVATION GLOBAL STATE ---
let selectedTables = [];

// --- DEFAULT TABLE CONFIGURATION (FALLBACK/FIRST LOAD) ---
// This is the structure you can now edit in the Superadmin tab
const DEFAULT_TABLES_CONFIG = [
    // Two-Person Tables (T7, T8, T9, T19, T20)
    { id: 7, capacity: 2, isVIP: false, gridArea: '1 / 1 / span 1 / span 1' },
    { id: 8, capacity: 2, isVIP: false, gridArea: '2 / 1 / span 1 / span 1' },
    { id: 9, capacity: 2, isVIP: false, gridArea: '3 / 1 / span 1 / span 1' },
    { id: 19, capacity: 2, isVIP: false, gridArea: '1 / 5 / span 1 / span 1' },
    { id: 20, capacity: 2, isVIP: false, gridArea: '2 / 5 / span 1 / span 1' },
    // Four-Person Tables
    { id: 1, capacity: 4, isVIP: false, gridArea: '1 / 2 / span 1 / span 1' },
    { id: 2, capacity: 4, isVIP: false, gridArea: '1 / 3 / span 1 / span 1' },
    { id: 3, capacity: 4, isVIP: false, gridArea: '2 / 2 / span 1 / span 1' },
    { id: 4, capacity: 4, isVIP: false, gridArea: '2 / 3 / span 1 / span 1' },
    { id: 5, capacity: 4, isVIP: false, gridArea: '3 / 2 / span 1 / span 1' },
    { id: 6, capacity: 4, isVIP: false, gridArea: '3 / 3 / span 1 / span 1' },
    { id: 10, capacity: 4, isVIP: false, gridArea: '4 / 2 / span 1 / span 1' },
    { id: 11, capacity: 4, isVIP: false, gridArea: '4 / 3 / span 1 / span 1' },
    // VIP Tables (T15, T16, T17, T18)
    { id: 15, capacity: 4, isVIP: true, gridArea: '4 / 4 / span 1 / span 1' },
    { id: 16, capacity: 4, isVIP: true, gridArea: '4 / 5 / span 1 / span 1' },
    { id: 17, capacity: 4, isVIP: true, gridArea: '3 / 4 / span 1 / span 1' },
    { id: 18, capacity: 4, isVIP: true, gridArea: '3 / 5 / span 1 / span 1' },
];

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


/* ================= INITIAL LOAD (FIREBASE) ================= */
document.addEventListener('DOMContentLoaded', () => {
    if (!db) return; // Stop if Firebase failed to initialize

    // 0. Load Table Configuration (NEW)
    db.collection("marina_data").doc("tables").onSnapshot((doc) => {
        if (doc.exists && doc.data().config) {
            allTablesConfig = doc.data().config;
            renderMap('map-container', true); 
            if(currentUserRole === 'superadmin') renderEditTableConfigForm();
        } else {
            db.collection("marina_data").doc("tables").set({ config: DEFAULT_TABLES_CONFIG });
            allTablesConfig = DEFAULT_TABLES_CONFIG;
        }
    });

    // 1. Team Data
    db.collection("marina_data").doc("team").onSnapshot((doc) => {
        if (doc.exists) {
            teamData = doc.data().members;
            renderPublicTeam();
            if(currentUserRole === 'superadmin') renderEditTeamForm();
        } else {
            db.collection("marina_data").doc("team").set({ members: defaultTeam });
        }
    });

    // 2. Financial/Menu Data
    db.collection("marina_data").doc("financials").onSnapshot((doc) => {
        if (doc.exists) {
            financialData = doc.data().items;
            renderPublicMenu();
            if(currentUserRole === 'superadmin') renderFinancialsTable();
            if(currentUserRole) renderAdminMenuView();
        } else {
            db.collection("marina_data").doc("financials").set({ items: defaultFinancials });
        }
    });

    // 3. Reservations (Realtime listener for map status)
    db.collection("reservations").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        reservations = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.docId = doc.id; 
            reservations.push(data);
        });
        
        // Rerender customer map and admin components
        renderMap('map-container', true); 
        if(currentUserRole) {
            renderAdminReservations();
            renderMap('admin-map-container', false);
        }
    });

    setupBubbles();
    updateRequiredTables(); // Initial status for reservation modal
});

/* ================= UTILS & HELPERS ================= */
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
function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
    if (id === 'reservation-modal') {
        selectedTables = [];
        updateRequiredTables();
    }
}

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

/* ================= MAP & RESERVATION LOGIC ================= */

function getTableStatus(tableId) {
    const activeRes = reservations.find(res => {
        return res.tables && res.tables.includes(tableId) && (res.status === 'on_hold' || res.status === 'confirmed');
    });

    if (!activeRes) return 'free';
    return activeRes.status;
}

/**
 * Renders the table layout into the specified container using CSS Grid.
 */
function renderMap(containerId, isCustomerView) {
    const layout = document.getElementById(`${containerId}-layout`);
    if (!layout) return; 

    layout.innerHTML = '';

    allTablesConfig.forEach(table => {
        const status = getTableStatus(table.id);
        const isSelected = selectedTables.includes(table.id);
        const isFree = status === 'free';
        const isClickable = isCustomerView && isFree;

        let tableHtml = `<div class="table-text">T${table.id}<small>(${table.capacity} max)</small>`;
        if (status !== 'free') {
            tableHtml += `<small>${status.toUpperCase().replace('_', ' ')}</small>`;
        }
        tableHtml += `</div>`;
        
        // Create the inner table element
        const element = document.createElement('div');
        element.className = `table-element table-${table.capacity} status-${status} ${table.isVIP ? 'table-vip' : ''} ${isSelected ? 'selected' : ''}`;
        element.innerHTML = tableHtml;

        if (isClickable) {
            element.onclick = () => handleTableClick(table.id);
        } else if (!isCustomerView && status !== 'free') {
             element.onclick = () => showAdminTableActions(table.id);
        }
        
        // Create the wrapper for Grid placement
        const wrapper = document.createElement('div');
        wrapper.className = 'table-element-wrapper';
        wrapper.style.gridArea = table.gridArea;
        wrapper.appendChild(element);

        layout.appendChild(wrapper);
    });
    
    if (isCustomerView) {
        updateSubmitButtonStatus();
    }
}

/**
 * Customer function: Handles table selection with capacity limits.
 */
function handleTableClick(tableId) {
    const tableIndex = allTablesConfig.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;

    const table = allTablesConfig[tableIndex];
    const isCurrentlySelected = selectedTables.includes(tableId);
    const size = parseInt(document.getElementById('res-size').value) || 0;
    
    if (size === 0) {
        alert("Please enter your group size first.");
        return;
    }

    if (isCurrentlySelected) {
        // Deselect table
        selectedTables = selectedTables.filter(id => id !== tableId);
    } else {
        // Validation: Prevent picking a 2-person table if party size > 2
        if (table.capacity === 2 && size > 2) {
             alert(`Table T${tableId} has a capacity of 2. Your party size of ${size} requires a 4-person table or multiple 2-person tables.`);
             return;
        }

        // Select table
        selectedTables.push(tableId);
    }
    
    // Update visuals and check status
    const vipWarning = document.getElementById('vip-warning');
    const hasSelectedVip = selectedTables.some(id => allTablesConfig.find(t => t.id === id).isVIP);
    vipWarning.style.display = hasSelectedVip ? 'block' : 'none';

    renderMap('map-container', true);
    updateSubmitButtonStatus();
}

/**
 * Customer function: Updates the required capacity display.
 * FIXED: Calculation error fixed. Uses Math.ceil(size / max_capacity) for tables needed.
 */
function updateRequiredTables() {
    const sizeInput = document.getElementById('res-size');
    const size = parseInt(sizeInput.value);
    const reqText = document.getElementById('table-requirements');
    
    if (size < 2 || size > 20) {
        sizeInput.value = Math.min(Math.max(size, 2), 20);
        return;
    }
    
    const maxCapacityPerTable = allTablesConfig.reduce((max, table) => Math.max(max, table.capacity), 0);
    const tablesNeeded = Math.ceil(size / maxCapacityPerTable); // Assumes we use only the largest available tables

    selectedTables = [];
    
    reqText.innerHTML = `**Required:** Minimum of **${tablesNeeded} table(s)** (Total Cap $\\geq$ ${size} people).`;
    
    renderMap('map-container', true);
    updateSubmitButtonStatus();
}

/**
 * Customer function: Checks if selected tables meet the minimum capacity requirement.
 */
function updateSubmitButtonStatus() {
    const size = parseInt(document.getElementById('res-size').value) || 0;
    const submitBtn = document.getElementById('submit-reservation-btn');
    const capacityWarning = document.getElementById('capacity-warning');

    if (size === 0) {
        submitBtn.disabled = true;
        submitBtn.textContent = `Enter group size above to start.`;
        capacityWarning.style.display = 'none';
        return;
    }
    
    const totalCapacity = selectedTables.reduce((sum, id) => {
        const t = allTablesConfig.find(t => t.id === id);
        return sum + (t ? t.capacity : 0);
    }, 0);
    
    if (selectedTables.length > 0 && totalCapacity >= size) {
        submitBtn.disabled = false;
        submitBtn.textContent = `Confirm Reservation (Tables: ${selectedTables.join(', ')})`;
        capacityWarning.style.display = 'none';
    } else {
        submitBtn.disabled = true;
        submitBtn.textContent = `Select table(s) (Required Cap: ${size}, Selected Cap: ${totalCapacity})`;
        if (selectedTables.length > 0) {
             capacityWarning.style.display = 'block';
        } else {
             capacityWarning.style.display = 'none';
        }
    }
}


/* ================= FORM HANDLERS ================= */

// Reservation Form Submission (Discord logging is preserved)
document.getElementById('reservation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('submit-reservation-btn').disabled) {
        alert("Please select table(s) to meet your party size requirement.");
        return;
    }
    
    const resDate = document.getElementById('res-date').value;
    const isVip = selectedTables.some(id => allTablesConfig.find(t => t.id === id).isVIP);

    const newRes = {
        name: document.getElementById('res-name').value,
        phone: document.getElementById('res-phone').value,
        date: resDate,
        size: parseInt(document.getElementById('res-size').value),
        tables: selectedTables.sort((a, b) => a - b),
        isVip: isVip,
        vipFee: isVip ? 250 : 0,
        status: 'on_hold',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (db) db.collection("reservations").add(newRes);

    const embed = {
        title: "⚠️ NEW RESERVATION (ON HOLD)",
        color: 15844367, // Amber
        fields: [
            { name: "Name", value: newRes.name, inline: true },
            { name: "Phone", value: newRes.phone, inline: true },
            { name: "Size", value: newRes.size, inline: true },
            { name: "Date/Time", value: newRes.date.replace('T', ' '), inline: false },
            { name: "Tables Selected", value: newRes.tables.join(', '), inline: false },
            { name: "VIP Fee", value: newRes.vipFee > 0 ? `$${newRes.vipFee}` : 'No', inline: true },
            { name: "Action", value: "Must be confirmed in Admin Panel!", inline: true }
        ],
        footer: { text: "The Marina - Table Management" }
    };
    sendToDiscord(WEBHOOK_RES, embed);
    
    alert(`Reservation request for table(s) ${newRes.tables.join(', ')} has been sent and is 'ON HOLD'. Please wait for confirmation.`);
    closeModal('reservation-modal');
    e.target.reset();
    selectedTables = [];
});

// ... (Rental and Application Forms remain the same, Discord logging is preserved)


/* ================= ADMIN FUNCTIONS ================= */

// FIXED: Admin login restored.
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

// ... (Logout and setupAdminPanel remain the same)

// === SUPERADMIN: TABLE CONFIGURATION (NEW) ===

function renderEditTableConfigForm() {
    const container = document.getElementById('table-config-editor');
    container.innerHTML = '<h4>Edit Table Properties:</h4><p>Use CSS Grid Area to position tables (e.g., 1 / 1 / span 1 / span 1).</p>';
    
    allTablesConfig.forEach((table, index) => {
        container.innerHTML += `
            <div style="border:1px solid #ccc; padding:5px; margin-bottom:5px; border-radius:5px; background:#f9f9f9; font-size:0.8rem; color: #000;">
                <strong>Table T${table.id}</strong><br>
                ID: <input type="number" value="${table.id}" onchange="updateTableConfig(${index}, 'id', parseInt(this.value))" style="width:50px; display:inline-block;"><br>
                Capacity: <input type="number" value="${table.capacity}" onchange="updateTableConfig(${index}, 'capacity', parseInt(this.value))" style="width:50px; display:inline-block;"><br>
                VIP: <select onchange="updateTableConfig(${index}, 'isVIP', this.value === 'true')" style="width:100px; display:inline-block;">
                    <option value="true" ${table.isVIP ? 'selected' : ''}>Yes</option>
                    <option value="false" ${!table.isVIP ? 'selected' : ''}>No</option>
                </select><br>
                Grid Area: <input type="text" value="${table.gridArea}" onchange="updateTableConfig(${index}, 'gridArea', this.value)" placeholder="row / col / span / span">
            </div>
        `;
    });
}

function updateTableConfig(index, key, value) {
    allTablesConfig[index][key] = value;
    // Real-time map update on configuration change
    renderMap('admin-map-container', false);
}

function saveTableConfiguration() {
    if (confirm("Are you sure you want to save the new table configuration? This will update the map for all users.")) {
        db.collection("marina_data").doc("tables").update({ config: allTablesConfig })
            .then(() => {
                alert("Table configuration updated successfully!");
                // Reload team and menu data (optional, but ensures fresh sync)
                if (currentUserRole) setupAdminPanel();
            })
            .catch(err => alert("Error saving table configuration: " + err.message));
    }
}