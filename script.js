/* ================= FIREBASE CONFIG ================= */
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
} else { console.error("Firebase SDK missing."); var db = null; }

/* ================= GLOBALS ================= */
const WEBHOOK_RES = "https://discord.com/api/webhooks/1449134540730929187/OfaO8GcR1_JZgpswRh0sPbMYS19wQYDGn0Y1FdrhqaWieItAuLaUoGBcHxSlhTMijsvh";
let reservations = [];
let allTablesConfig = [];
let selectedTables = [];
let currentUserRole = null;

// --- INITIAL DEFAULT MAP (If Database is empty) ---
// Coords are percentages (X, Y) relative to the image
const DEFAULT_TABLES_CONFIG = [
    // Top-Left (Balcony)
    { id: 14, capacity: 4, isVIP: false, x: 2, y: 48 },
    { id: 15, capacity: 4, isVIP: false, x: 2, y: 28 },
    { id: 16, capacity: 4, isVIP: false, x: 12, y: 28 },
    { id: 17, capacity: 4, isVIP: false, x: 22, y: 28 },
    { id: 18, capacity: 4, isVIP: false, x: 32, y: 28 },
    // Top-Middle
    { id: 19, capacity: 2, isVIP: false, x: 42, y: 15 },
    { id: 20, capacity: 2, isVIP: false, x: 46, y: 15 },
    // Middle (Normal)
    { id: 2, capacity: 4, isVIP: false, x: 50, y: 20 },
    { id: 3, capacity: 4, isVIP: false, x: 60, y: 20 },
    { id: 1, capacity: 4, isVIP: false, x: 50, y: 45 },
    { id: 4, capacity: 4, isVIP: false, x: 60, y: 45 },
    // Right (VIP)
    { id: 5, capacity: 4, isVIP: true, x: 75, y: 45 },
    { id: 6, capacity: 4, isVIP: true, x: 75, y: 65 },
    { id: 7, capacity: 4, isVIP: true, x: 88, y: 45 },
    { id: 8, capacity: 4, isVIP: true, x: 88, y: 65 },
    // Bottom Left
    { id: 13, capacity: 4, isVIP: false, x: 12, y: 65 },
    { id: 12, capacity: 4, isVIP: false, x: 22, y: 65 },
    { id: 11, capacity: 4, isVIP: false, x: 32, y: 65 },
    { id: 10, capacity: 4, isVIP: false, x: 42, y: 65 }
];

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', () => {
    if (!db) return;

    // Load Tables
    db.collection("marina_data").doc("tables").onSnapshot((doc) => {
        if (doc.exists && doc.data().config) {
            allTablesConfig = doc.data().config;
        } else {
            allTablesConfig = DEFAULT_TABLES_CONFIG;
            db.collection("marina_data").doc("tables").set({ config: DEFAULT_TABLES_CONFIG });
        }
        renderMap('map-container', true);
    });

    // Load Reservations
    db.collection("reservations").onSnapshot((snapshot) => {
        reservations = [];
        snapshot.forEach(doc => {
            let data = doc.data(); data.docId = doc.id;
            reservations.push(data);
        });
        renderMap('map-container', true);
        if (currentUserRole) renderAdminReservations();
    });
});

/* ================= MAP LOGIC ================= */
function getTableStatus(id) {
    const res = reservations.find(r => r.tables.includes(id) && (r.status === 'on_hold' || r.status === 'confirmed'));
    return res ? res.status : 'free';
}

function renderMap(containerId, isCustomerView) {
    const layout = document.getElementById(`${containerId}-layout`);
    if (!layout || allTablesConfig.length === 0) return;
    
    layout.innerHTML = ''; // Clear existing

    allTablesConfig.forEach(table => {
        const status = getTableStatus(table.id);
        const isSelected = selectedTables.includes(table.id);
        const isDraggable = (!isCustomerView && currentUserRole === 'superadmin');
        const canClick = isCustomerView && status === 'free';

        // Wrapper for positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'table-element-wrapper';
        wrapper.style.left = `${table.x}%`;
        wrapper.style.top = `${table.y}%`;
        
        // Table Element
        const el = document.createElement('div');
        el.className = `table-element table-${table.capacity} status-${status} ${table.isVIP ? 'table-vip' : ''} ${isSelected ? 'selected' : ''}`;
        el.innerHTML = `T${table.id}`;
        
        if (canClick) el.onclick = () => toggleTableSelection(table.id);
        if (!isCustomerView && status !== 'free') el.onclick = () => alert("Table " + table.id + " is " + status);

        if (isDraggable) {
            el.draggable = true;
            el.ondragstart = (e) => handleDragStart(e, table.id);
            // Wrapper needs to allow dragover
            document.getElementById(`${containerId}`).ondragover = (e) => e.preventDefault();
            document.getElementById(`${containerId}`).ondrop = (e) => handleDrop(e, containerId);
        }

        wrapper.appendChild(el);
        layout.appendChild(wrapper);
    });
    
    if(isCustomerView) updateSubmitButton();
}

/* ================= DRAG & DROP (SADMIN) ================= */
let draggedId = null;

function handleDragStart(e, id) {
    draggedId = id;
    e.dataTransfer.setData('text/plain', id);
}

function handleDrop(e, containerId) {
    e.preventDefault();
    if (draggedId === null) return;

    const container = document.getElementById(containerId);
    const rect = container.getBoundingClientRect();
    
    // Calculate new X/Y percentages based on mouse drop position relative to container
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Update Config
    const tableIndex = allTablesConfig.findIndex(t => t.id === draggedId);
    if (tableIndex > -1) {
        allTablesConfig[tableIndex].x = Math.max(0, Math.min(95, x)); // Clamp to bounds
        allTablesConfig[tableIndex].y = Math.max(0, Math.min(95, y));
        
        renderMap('admin-map-container', false); // Redraw immediately
        // Auto-save logic could go here or via button
    }
    draggedId = null;
}

function saveTableConfiguration() {
    if(confirm("Save new table layout?")) {
        db.collection("marina_data").doc("tables").update({ config: allTablesConfig });
        alert("Saved!");
    }
}

/* ================= RESERVATION LOGIC ================= */
function toggleTableSelection(id) {
    if (selectedTables.includes(id)) {
        selectedTables = selectedTables.filter(t => t !== id);
    } else {
        selectedTables.push(id);
    }
    renderMap('map-container', true);
}

function updateRequiredTables() {
    // FIX: Handle empty input to prevent NaN
    const inputVal = document.getElementById('res-size').value;
    const size = parseInt(inputVal) || 0; // Default to 0 if empty
    
    const reqText = document.getElementById('table-requirements');
    
    if (size < 2) {
        reqText.innerText = "Enter group size (min 2).";
        return;
    }
    
    // Simple logic: assume max capacity per table is 4
    const tablesNeeded = Math.ceil(size / 4);
    reqText.innerText = `Required: Approx ${tablesNeeded} tables for ${size} people.`;
    
    selectedTables = []; // Reset selection on size change
    renderMap('map-container', true);
}

function updateSubmitButton() {
    const size = parseInt(document.getElementById('res-size').value) || 0;
    const btn = document.getElementById('submit-reservation-btn');
    
    // Calculate selected capacity
    let cap = 0;
    selectedTables.forEach(id => {
        const t = allTablesConfig.find(tbl => tbl.id === id);
        if(t) cap += t.capacity;
    });

    if (size > 0 && cap >= size) {
        btn.disabled = false;
        btn.innerText = "Confirm Reservation";
        document.getElementById('capacity-warning').style.display = 'none';
    } else {
        btn.disabled = true;
        btn.innerText = `Select Tables (Cap: ${cap}/${size})`;
        document.getElementById('capacity-warning').style.display = size > 0 ? 'block' : 'none';
    }
    
    // VIP Warning
    const hasVip = selectedTables.some(id => {
        const t = allTablesConfig.find(tbl => tbl.id === id);
        return t && t.isVIP;
    });
    document.getElementById('vip-warning').style.display = hasVip ? 'block' : 'none';
}

document.getElementById('reservation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newRes = {
        name: document.getElementById('res-name').value,
        phone: document.getElementById('res-phone').value,
        date: document.getElementById('res-date').value,
        size: parseInt(document.getElementById('res-size').value),
        tables: selectedTables,
        status: 'on_hold',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection("reservations").add(newRes);
    
    // Send to Discord
    fetch(WEBHOOK_RES, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title: "New Reservation", description: `${newRes.name} (${newRes.size} ppl) on tables ${newRes.tables}`, color: 15844367 }] })
    });

    alert("Reservation Sent!");
    closeModal('reservation-modal');
    e.target.reset();
    selectedTables = [];
});

/* ================= UI HELPERS ================= */
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function attemptLogin() {
    const code = document.getElementById('admin-code').value;
    if (code === 'marinA25') {
        currentUserRole = 'superadmin';
        document.querySelectorAll('.super-only').forEach(el => el.style.display = 'block');
    } else if (code === 'marina25') {
        currentUserRole = 'admin';
        document.querySelectorAll('.super-only').forEach(el => el.style.display = 'none');
    } else {
        document.getElementById('login-error').innerText = "Invalid Code";
        return;
    }
    closeModal('login-modal');
    openModal('admin-panel');
    setupAdminPanel();
}

function logout() { currentUserRole = null; closeModal('admin-panel'); }

function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    event.target.classList.add('active');
    
    if(id === 'tab-tables') renderMap('admin-map-container', false);
}

function setupAdminPanel() { renderAdminReservations(); renderMap('admin-map-container', false); }

function renderAdminReservations() {
    const tbody = document.getElementById('admin-res-body-onhold');
    tbody.innerHTML = '';
    reservations.filter(r => r.status === 'on_hold').forEach(r => {
        tbody.innerHTML += `<tr><td>${r.name}</td><td>${r.date}</td><td>${r.size}</td><td>${r.tables}</td><td>
        <button onclick="updateStatus('${r.docId}','confirmed')">Confirm</button>
        <button onclick="deleteRes('${r.docId}')">Reject</button>
        </td></tr>`;
    });
}

function updateStatus(id, status) { db.collection("reservations").doc(id).update({status: status}); }
function deleteRes(id) { db.collection("reservations").doc(id).delete(); }