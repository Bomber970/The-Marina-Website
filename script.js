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
let allTablesConfig = []; 
let currentUserRole = null; 
let selectedTables = [];

// --- DEFAULT TABLE CONFIGURATION (Absolute Position Based on marinamap.png) ---
// Position is based on the top-left corner of the table element (X, Y percentage)
const DEFAULT_TABLES_CONFIG = [
    // BALCONY TABLES (T10 - T18, T14/T15 are side tables)
    { id: 10, capacity: 4, isVIP: false, x: 60, y: 75 },
    { id: 11, capacity: 4, isVIP: false, x: 50, y: 75 },
    { id: 12, capacity: 4, isVIP: false, x: 40, y: 75 },
    { id: 13, capacity: 4, isVIP: false, x: 30, y: 75 },
    { id: 14, capacity: 4, isVIP: false, x: 10, y: 50 }, // Side Table
    { id: 15, capacity: 4, isVIP: false, x: 10, y: 20 }, // Side Table
    { id: 16, capacity: 4, isVIP: false, x: 25, y: 20 },
    { id: 17, capacity: 4, isVIP: false, x: 35, y: 20 },
    { id: 18, capacity: 4, isVIP: false, x: 45, y: 20 },

    // NORMAL TABLES (T1 - T4)
    { id: 1, capacity: 4, isVIP: false, x: 70, y: 55 },
    { id: 2, capacity: 4, isVIP: false, x: 70, y: 20 },
    { id: 3, capacity: 4, isVIP: false, x: 80, y: 20 },
    { id: 4, capacity: 4, isVIP: false, x: 80, y: 55 },

    // V.I.P. TABLES (T5 - T9, T19, T20)
    { id: 5, capacity: 4, isVIP: true, x: 50, y: 40 }, 
    { id: 6, capacity: 4, isVIP: true, x: 50, y: 70 }, 
    { id: 7, capacity: 4, isVIP: true, x: 75, y: 40 }, 
    { id: 8, capacity: 4, isVIP: true, x: 75, y: 70 }, 
    { id: 9, capacity: 4, isVIP: true, x: 85, y: 40 }, 
    
    // Small tables T19/T20
    { id: 19, capacity: 2, isVIP: false, x: 62, y: 15 },
    { id: 20, capacity: 2, isVIP: false, x: 62, y: 5 },
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
    if (!db) return; 

    // 0. Load Table Configuration 
    db.collection("marina_data").doc("tables").onSnapshot((doc) => {
        if (doc.exists && doc.data().config && doc.data().config.length > 0) {
            allTablesConfig = doc.data().config;
            renderMap('map-container', true); 
            if(currentUserRole === 'superadmin') renderEditTableConfigForm();
        } else {
            // Initial save of the default map configuration
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
        
        // Rerender map whenever reservation data changes
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

/* ================= PUBLIC FUNCTIONS (Remains the same) ================= */
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
 * Renders the table layout using absolute positioning based on X/Y percentages.
 */
function renderMap(containerId, isCustomerView) {
    const layout = document.getElementById(`${containerId}-layout`);
    if (!layout) return; 

    layout.innerHTML = '';
    
    if (allTablesConfig.length === 0) {
        layout.innerHTML = '<p style="color: black; margin-top: 10px;">Loading table map...</p>';
        return;
    }

    allTablesConfig.forEach(table => {
        const status = getTableStatus(table.id);
        const isSelected = selectedTables.includes(table.id);
        const isFree = status === 'free';
        const isClickable = isCustomerView && isFree;
        
        const isDraggable = !isCustomerView && currentUserRole === 'superadmin';

        let tableHtml = `<div class="table-text">T${table.id}<small>(${table.capacity} max)</small>`;
        if (status !== 'free') {
            tableHtml += `<small>${status.toUpperCase().replace('_', ' ')}</small>`;
        }
        tableHtml += `</div>`;
        
        // Create the inner table element
        const element = document.createElement('div');
        element.className = `table-element table-${table.capacity} status-${status} ${table.isVIP ? 'table-vip' : ''} ${isSelected ? 'selected' : ''}`;
        element.innerHTML = tableHtml;
        
        if (isDraggable) {
            element.setAttribute('draggable', 'true');
            element.ondragstart = (e) => handleDragStart(e, table.id);
        }

        if (isClickable) {
            element.onclick = () => handleTableClick(table.id);
        } else if (!isCustomerView && status !== 'free') {
             element.onclick = () => showAdminTableActions(table.id);
        }
        
        // Create the wrapper for Absolute positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'table-element-wrapper';
        wrapper.setAttribute('data-table-id', table.id); // Store ID on wrapper
        wrapper.setAttribute('data-x', table.x);
        wrapper.setAttribute('data-y', table.y);
        
        // Apply absolute position based on stored X/Y percentages
        wrapper.style.left = `${table.x}%`;
        wrapper.style.top = `${table.y}%`;
        
        // Attach D&D listeners to the wrapper (the drag target) in admin view
        if (isDraggable) {
            wrapper.ondragover = (e) => handleDragOver(e);
            wrapper.ondragleave = (e) => handleDragLeave(e);
            wrapper.ondrop = (e) => handleDrop(e, wrapper); // Pass the wrapper itself
        }

        wrapper.appendChild(element);
        layout.appendChild(wrapper);
    });
    
    if (isCustomerView) {
        updateSubmitButtonStatus();
    }
}

/* ================= DRAG & DROP FUNCTIONS (SUPERADMIN ONLY) ================= */

let draggedTableId = null;

function handleDragStart(e, tableId) {
    draggedTableId = tableId;
    e.dataTransfer.setData('text/plain', tableId);
    
    // Calculate the mouse offset relative to the wrapper for smooth dragging illusion
    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('application/json', JSON.stringify({ offsetX, offsetY }));
    
    e.target.style.opacity = '0.5'; 
    
    // Enable all wrappers as drop targets (even if they already contain a table, as we need their position)
    const wrappers = document.querySelectorAll('.table-element-wrapper');
    wrappers.forEach(w => w.style.pointerEvents = 'auto');
}

function handleDragOver(e) {
    e.preventDefault(); 
    // Find the nearest wrapper element that is the actual drop target
    const wrapper = e.target.closest('.table-element-wrapper');
    if (wrapper) {
        // Only highlight if the target is different from the source
        if (parseInt(wrapper.getAttribute('data-table-id')) !== draggedTableId) {
             wrapper.classList.add('drag-over');
        }
    }
}

function handleDragLeave(e) {
    const wrapper = e.target.closest('.table-element-wrapper');
    if (wrapper) {
        wrapper.classList.remove('drag-over');
    }
}

function handleDrop(e, targetWrapper) {
    e.preventDefault();
    targetWrapper.classList.remove('drag-over');
    
    const mapContainer = targetWrapper.closest('.map-container');
    const mapRect = mapContainer.getBoundingClientRect();
    
    const sourceTableId = draggedTableId;
    const sourceTable = allTablesConfig.find(t => t.id === sourceTableId);
    
    if (!sourceTable) return;
    
    // Get mouse offsets from dataTransfer
    const offsetData = JSON.parse(e.dataTransfer.getData('application/json'));
    const offsetX = offsetData.offsetX;
    const offsetY = offsetData.offsetY;

    // Calculate new position based on map container (relative to top-left of the container)
    // We adjust by the mouse offset to place the table correctly under the cursor
    let newX = ((e.clientX - mapRect.left - offsetX) / mapRect.width) * 100;
    let newY = ((e.clientY - mapRect.top - offsetY) / mapRect.height) * 100;
    
    // Clamp values between 0 and 100%
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    
    // --- Update Configuration ---
    const sourceIndex = allTablesConfig.findIndex(t => t.id === sourceTableId);
    allTablesConfig[sourceIndex].x = newX.toFixed(2);
    allTablesConfig[sourceIndex].y = newY.toFixed(2);

    // Reset opacity and pointer events
    const draggedElement = document.querySelector(`[ondragstart$='handleDragStart(event, ${sourceTableId})']`);
    if (draggedElement) {
        draggedElement.style.opacity = '1';
    }
    
    // Final actions: Re-render map and save
    renderMap('admin-map-container', false);
    saveTableConfiguration();
    
    draggedTableId = null;

    // Disable drop events again for stability
    const wrappers = document.querySelectorAll('.table-element-wrapper');
    wrappers.forEach(w => w.style.pointerEvents = 'none');
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
 */
function updateRequiredTables() {
    const sizeInput = document.getElementById('res-size');
    const size = parseInt(sizeInput.value);
    const reqText = document.getElementById('table-requirements');
    
    if (size < 2 || size > 20) {
        sizeInput.value = Math.min(Math.max(size, 2), 20);
        return;
    }
    
    // Calculate the maximum capacity available in the current configuration
    const maxCapacityPerTable = allTablesConfig.length > 0 
        ? allTablesConfig.reduce((max, table) => Math.max(max, table.capacity), 0) 
        : 4; 
        
    // Calculate the minimum number of tables needed based on the largest table capacity
    const tablesNeeded = Math.ceil(size / maxCapacityPerTable); 

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


/* ================= FORM HANDLERS (Remains the same) ================= */

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

// Rental Form (Remains the same)
document.getElementById('rental-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const rental = {
        name: document.getElementById('rent-name').value,
        type: document.getElementById('rent-type').value,
        staff: document.getElementById('rent-staffing').value
    };

    const embed = {
        title: "🥂 New Venue Rental Inquiry",
        color: 15844367, // Gold
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

// Application Form (Remains the same)
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

    if (db) db.collection("applications").add(app);

    const embed = {
        title: "📝 New Job Application",
        color: 3447003, // Blue
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

/* ================= ADMIN FUNCTIONS (Remains the same) ================= */

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
    // Only attempt to open the panel modal if the user role was successfully set
    if (currentUserRole) {
        closeModal('login-modal');
        document.getElementById('admin-code').value = '';
        errorMsg.textContent = '';
        openModal('admin-panel');
    }
}

function logout() {
    currentUserRole = null;
    closeModal('admin-panel');
    alert("Logged out.");
}

function setupAdminPanel() {
    const title = document.getElementById('admin-title');
    const superTabs = document.querySelectorAll('.super-only');
    
    // Always call these, but renderMap will contain the safeguard
    renderAdminReservations();
    renderAdminMenuView();

    if (currentUserRole === 'superadmin') {
        title.textContent = "Admin Panel (Superadmin)";
        superTabs.forEach(el => el.style.display = 'block');
        renderFinancialsTable();
        renderEditTeamForm();
        // Render the table config form when Superadmin logs in
        renderEditTableConfigForm();
    } else {
        title.textContent = "Admin Panel";
        superTabs.forEach(el => el.style.display = 'none');
    }
    renderMap('admin-map-container', false);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabId)) btn.classList.add('active');
    });

    if (tabId === 'tab-tables') {
        renderMap('admin-map-container', false);
        renderEditTableConfigForm(); // Refresh the editor when switching to this tab
        document.getElementById('table-admin-actions').innerHTML = '';
    }
}

function renderAdminReservations() {
    const tbodyOnhold = document.getElementById('admin-res-body-onhold');
    const tbodyConfirmed = document.getElementById('admin-res-body-confirmed');
    tbodyOnhold.innerHTML = '';
    tbodyConfirmed.innerHTML = '';

    const onHoldRes = reservations.filter(res => res.status === 'on_hold');
    const confirmedRes = reservations.filter(res => res.status === 'confirmed');

    if (onHoldRes.length === 0) {
        tbodyOnhold.innerHTML = '<tr><td colspan="6">No pending requests.</td></tr>';
    } else {
        onHoldRes.forEach(res => {
            tbodyOnhold.innerHTML += `<tr>
                <td>${res.docId ? res.docId.substring(0, 5) : 'N/A'}...</td>
                <td>${res.name}</td>
                <td>${res.date ? res.date.replace('T', ' ') : '-'}</td>
                <td>${res.size}</td>
                <td>${res.tables.join(', ')}</td>
                <td><span style="color:orange;">${res.status.toUpperCase()}</span></td>
            </tr>`;
        });
    }
    
    if (confirmedRes.length === 0) {
        tbodyConfirmed.innerHTML = '<tr><td colspan="6">No confirmed reservations.</td></tr>';
    } else {
        confirmedRes.forEach(res => {
            tbodyConfirmed.innerHTML += `<tr>
                <td>${res.docId ? res.docId.substring(0, 5) : 'N/A'}...</td>
                <td>${res.name}</td>
                <td>${res.date ? res.date.replace('T', ' ') : '-'}</td>
                <td>${res.size}</td>
                <td>${res.tables.join(', ')}</td>
                <td><span style="color:green;">${res.status.toUpperCase()}</span></td>
            </tr>`;
        });
    }
}

// Admin Table Management Actions (Remains the same)
function showAdminTableActions(tableId) {
    const activeRes = reservations.find(res => res.tables && res.tables.includes(tableId));
    const actionsDiv = document.getElementById('table-admin-actions');
    
    if (!activeRes) {
        actionsDiv.innerHTML = `<p>Table T${tableId} is FREE.</p>`;
        return;
    }

    const resDetails = `
        <h3>Manage Reservation: Table T${tableId}</h3>
        <p>Status: <strong>${activeRes.status.toUpperCase()}</strong></p>
        <p>Name: ${activeRes.name} (Size: ${activeRes.size})</p>
        <p>Date: ${activeRes.date ? activeRes.date.replace('T', ' ') : 'Unknown'}</p>
        <p>Selected Tables: ${activeRes.tables.join(', ')}</p>
        <p>VIP Fee: ${activeRes.isVip ? 'Yes ($250)' : 'No'}</p>
    `;
    
    let buttons = '';
    if (activeRes.status === 'on_hold') {
        buttons = `
            <button class="btn btn-primary" onclick="confirmReservation('${activeRes.docId}')">Confirm (Set Gray)</button>
            <button class="btn btn-danger" onclick="rejectReservation('${activeRes.docId}')">Reject & Free Up</button>
        `;
    } else if (activeRes.status === 'confirmed') {
        buttons = `
            <button class="btn btn-danger" onclick="rejectReservation('${activeRes.docId}')">Delete Confirmation / Free Up</button>
        `;
    }
    
    actionsDiv.innerHTML = resDetails + buttons;
}

function confirmReservation(docId) {
    if (confirm("Are you sure you want to CONFIRM this reservation? The table(s) will be permanently blocked (GRAY).")) {
        db.collection("reservations").doc(docId).update({ status: 'confirmed' })
            .then(() => {
                alert("Reservation confirmed! Table(s) are now Confirmed (Gray).");
                document.getElementById('table-admin-actions').innerHTML = '';
            });
    }
}

function rejectReservation(docId) {
    if (confirm("Are you sure you want to REJECT or DELETE this reservation? The table(s) will be freed up.")) {
        db.collection("reservations").doc(docId).delete()
            .then(() => {
                alert("Reservation deleted. Table(s) are now FREE.");
                document.getElementById('table-admin-actions').innerHTML = '';
            });
    }
}

// === SUPERADMIN: TABLE CONFIGURATION (FOR EASY EDITING) ===

function renderEditTableConfigForm() {
    const container = document.getElementById('table-config-editor');
    container.innerHTML = '<h4>Edit Table Properties:</h4><p>Positions are X/Y percentages from the top-left corner of the map.</p>';
    
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
                X: <input type="number" value="${table.x}" onchange="updateTableConfig(${index}, 'x', parseFloat(this.value))" style="width:60px; display:inline-block;" step="0.01"> %
                Y: <input type="number" value="${table.y}" onchange="updateTableConfig(${index}, 'y', parseFloat(this.value))" style="width:60px; display:inline-block;" step="0.01"> %
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
        // Ensure X/Y values are saved as strings with two decimal places
        const sanitizedConfig = allTablesConfig.map(table => ({
            ...table,
            x: parseFloat(table.x).toFixed(2),
            y: parseFloat(table.y).toFixed(2)
        }));

        db.collection("marina_data").doc("tables").update({ config: sanitizedConfig })
            .then(() => {
                alert("Table configuration updated successfully!");
                // Force reload local config to ensure new precision is used
                allTablesConfig = sanitizedConfig;
            })
            .catch(err => alert("Error saving table configuration: " + err.message));
    }
}

// === ADMIN MENU/FINANCIALS/TEAM (Logic remains the same) ===
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