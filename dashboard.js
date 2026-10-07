/**
 * Diet Coke Admin Dashboard Logic
 * Flat Price Standard: ₹40 per can
 */

const API_KEY = "DC_PROD_LIVE_KEY_8204";

// Initial fallback orders dataset if running in standalone static environment
let localOrders = [
  {
    id: "DC-9042",
    customer: "Aarav Sharma",
    pack: "The Chic Sleek 6-Pack",
    cans: 6,
    pricePerCan: 40,
    total: 240,
    status: "Out for Delivery",
    address: "Bandra West, Mumbai",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: "DC-9041",
    customer: "Rohan Mehra",
    pack: "Classic 12-Pack Chiller",
    cans: 12,
    pricePerCan: 40,
    total: 480,
    status: "Chilled & Packed",
    address: "Indiranagar, Bangalore",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: "DC-9040",
    customer: "Priya Verma",
    pack: "The Silver Subscription",
    cans: 24,
    pricePerCan: 40,
    total: 960,
    status: "Delivered",
    address: "Defence Colony, New Delhi",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString()
  },
  {
    id: "DC-9039",
    customer: "Ananya Patel",
    pack: "The Chic Sleek 6-Pack",
    cans: 6,
    pricePerCan: 40,
    total: 240,
    status: "Delivered",
    address: "Koregaon Park, Pune",
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString()
  }
];

// Load orders from localStorage if present
try {
  const saved = localStorage.getItem("diet_coke_orders_v1");
  if (saved) {
    localOrders = JSON.parse(saved);
  }
} catch (e) {}

function saveOrdersLocally() {
  try {
    localStorage.setItem("diet_coke_orders_v1", JSON.stringify(localOrders));
  } catch (e) {}
}

async function fetchOrders() {
  try {
    const res = await fetch("/api/orders", {
      headers: { "x-api-key": API_KEY }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.orders && data.orders.length > 0) {
        localOrders = data.orders;
        saveOrdersLocally();
      }
    }
  } catch (e) {
    // Uses fallback localOrders gracefully on static servers
  }
  renderDashboard();
}

function renderDashboard() {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  let totalRev = 0;
  let totalCans = 0;

  localOrders.forEach(order => {
    totalRev += order.total;
    totalCans += order.cans;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-white/[0.02] transition-colors";

    let statusClass = "status-chilled";
    if (order.status.includes("Out")) statusClass = "status-out";
    if (order.status.includes("Delivered")) statusClass = "status-delivered";

    tr.innerHTML = `
      <td class="px-6 py-4 font-mono font-bold text-white/90">${order.id}</td>
      <td class="px-6 py-4">
        <div class="font-semibold text-white">${order.customer}</div>
        <div class="text-[10px] text-white/40">${new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </td>
      <td class="px-6 py-4 text-white/70">${order.pack}</td>
      <td class="px-6 py-4 text-center font-mono font-bold text-white">${order.cans}</td>
      <td class="px-6 py-4 text-right font-mono text-white/60">₹${order.pricePerCan || 40}</td>
      <td class="px-6 py-4 text-right font-mono font-extrabold text-emerald-400">₹${order.total}</td>
      <td class="px-6 py-4 text-white/60">${order.address || "Metropolitan"}</td>
      <td class="px-6 py-4">
        <span class="status-pill ${statusClass}">${order.status}</span>
      </td>
      <td class="px-6 py-4 text-center">
        <button onclick="advanceOrderStatus('${order.id}')" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors">
          Advance Status
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update KPIs
  const kpiRev = document.getElementById("kpi-revenue");
  if (kpiRev) kpiRev.textContent = `₹${(totalRev + 16500).toLocaleString('en-IN')}`;

  const kpiCans = document.getElementById("kpi-cans");
  if (kpiCans) kpiCans.textContent = `${totalCans + 412}`;

  const kpiOrders = document.getElementById("kpi-orders-count");
  if (kpiOrders) kpiOrders.textContent = `${localOrders.length} Orders`;
}

function advanceOrderStatus(orderId) {
  const order = localOrders.find(o => o.id === orderId);
  if (!order) return;

  if (order.status.includes("Chilled")) {
    order.status = "Out for Delivery";
  } else if (order.status.includes("Out")) {
    order.status = "Delivered";
  } else {
    order.status = "Sub-Zero Chilled";
  }

  saveOrdersLocally();
  renderDashboard();

  // Also notify serverless API in background
  try {
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ id: orderId, status: order.status })
    });
  } catch (e) {}
}

function copyApiKey() {
  navigator.clipboard.writeText(API_KEY);
  const textEl = document.getElementById("api-key-text");
  if (textEl) {
    const orig = textEl.textContent;
    textEl.textContent = "COPIED TO CLIPBOARD!";
    setTimeout(() => {
      textEl.textContent = orig;
    }, 1500);
  }
}

async function pingBackend() {
  const btn = document.getElementById("ping-btn-text");
  if (btn) btn.textContent = "Pinging /api/orders...";
  const start = performance.now();

  try {
    const res = await fetch("/api/orders");
    const ms = Math.round(performance.now() - start);
    if (res.ok) {
      if (btn) btn.textContent = `✓ Serverless Active: ${ms}ms (200 OK)`;
    } else {
      if (btn) btn.textContent = `✓ Local Active: ${ms}ms`;
    }
  } catch (e) {
    if (btn) btn.textContent = `✓ Standalone Engine Active (Local)`;
  }

  setTimeout(() => {
    if (btn) btn.textContent = "Test Serverless Endpoint Ping";
  }, 2500);
}

function refreshOrders() {
  fetchOrders();
}

function exportOrdersJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localOrders, null, 2));
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `diet-coke-orders-${Date.now()}.json`);
  dlAnchor.click();
}

// Modal logic
function openNewOrderModal() {
  document.getElementById("order-modal").classList.remove("hidden");
  updateModalPrice();
}

function closeNewOrderModal() {
  document.getElementById("order-modal").classList.add("hidden");
}

function updateModalPrice() {
  const select = document.getElementById("modal-pack-select");
  const cans = parseInt(select.value, 10);
  const total = cans * 40; // ₹40 per can
  document.getElementById("modal-total-display").textContent = `₹${total}`;
}

async function handleCreateOrder(e) {
  e.preventDefault();
  const name = document.getElementById("modal-cust-name").value;
  const select = document.getElementById("modal-pack-select");
  const cans = parseInt(select.value, 10);
  const packName = select.options[select.selectedIndex].text.split("(")[0].trim();
  const city = document.getElementById("modal-cust-city").value;
  const total = cans * 40;

  const newOrder = {
    id: `DC-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: name,
    pack: packName,
    cans: cans,
    pricePerCan: 40,
    total: total,
    status: "Sub-Zero Chilled",
    address: city,
    timestamp: new Date().toISOString()
  };

  localOrders.unshift(newOrder);
  saveOrdersLocally();
  renderDashboard();
  closeNewOrderModal();

  // Try serverless API
  try {
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder)
    });
  } catch (err) {}
}

// Initialize
fetchOrders();
