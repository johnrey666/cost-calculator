// ===== UNIT CONVERSION SYSTEM =====
const unitConversions = {
  'g': { base: 'grams', factor: 1 },
  'kg': { base: 'grams', factor: 1000 },
  'oz': { base: 'grams', factor: 28.3495 },
  'lb': { base: 'grams', factor: 453.592 },
  'ml': { base: 'ml', factor: 1 },
  'L': { base: 'ml', factor: 1000 },
  'tsp': { base: 'ml', factor: 4.92892 },
  'tbsp': { base: 'ml', factor: 14.7868 },
  'cup': { base: 'ml', factor: 236.588 },
  'pcs': { base: 'pcs', factor: 1 },
  'pack': { base: 'pcs', factor: 1 },
  'bottle': { base: 'pcs', factor: 1 },
  'can': { base: 'pcs', factor: 1 },
  'box': { base: 'pcs', factor: 1 },
  'bag': { base: 'pcs', factor: 1 },
  'roll': { base: 'pcs', factor: 1 },
  'set': { base: 'pcs', factor: 1 }
};

function convertUnit(qty, fromUnit, toUnit) {
  const findUnit = (unit) => {
    if (!unit) return null;
    const n = unit.toLowerCase();
    for (const [key, value] of Object.entries(unitConversions)) {
      if (key.toLowerCase() === n) return value;
    }
    return null;
  };
  const from = findUnit(fromUnit);
  const to = findUnit(toUnit);
  if (!from || !to) return qty;
  if (from.base !== to.base) return qty;
  return qty * (from.factor / to.factor);
}

function calcIngredientCost(recipeQty, recipeUnit, ingName) {
  const ingredient = db.ingredients.find(i => i.name === ingName);
  if (!ingredient) return recipeQty * 0;
  const convertedQty = convertUnit(recipeQty, recipeUnit, ingredient.unit);
  return convertedQty * ingredient.costPerUnit;
}

// ===== DEFAULT PACKAGE TEMPLATES =====
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-wedding',
    name: 'Wedding Package',
    description: 'Elegant full-course dinner for wedding receptions',
    tag: 'Wedding',
    emoji: '💍',
    bannerClass: 'banner-wedding',
    pax: 100,
    contingencyPct: 8,
    wastePct: 5,
    productionPct: 12,
    capexPct: 30,
    vatPct: 12,
    pricingMethod: 'markup',
    pricingValue: 40,
    venueCost: 25000,
    otherExpenses: 5000,
    recipes: []
  },
  {
    id: 'tpl-birthday',
    name: 'Birthday Celebration',
    description: 'Fun and festive buffet spread for birthday parties',
    tag: 'Birthday',
    emoji: '🎂',
    bannerClass: 'banner-birthday',
    pax: 50,
    contingencyPct: 5,
    wastePct: 3,
    productionPct: 10,
    capexPct: 25,
    vatPct: 12,
    pricingMethod: 'markup',
    pricingValue: 35,
    venueCost: 10000,
    otherExpenses: 2000,
    recipes: []
  },
  {
    id: 'tpl-corporate',
    name: 'Corporate Lunch',
    description: 'Professional lunch setup for corporate meetings and events',
    tag: 'Corporate',
    emoji: '🏢',
    bannerClass: 'banner-corporate',
    pax: 30,
    contingencyPct: 5,
    wastePct: 2,
    productionPct: 8,
    capexPct: 20,
    vatPct: 12,
    pricingMethod: 'markup',
    pricingValue: 30,
    venueCost: 5000,
    otherExpenses: 1000,
    recipes: []
  },
  {
    id: 'tpl-fiesta',
    name: 'Fiesta Package',
    description: 'Traditional Filipino fiesta with classic dishes',
    tag: 'Fiesta',
    emoji: '🥳',
    bannerClass: 'banner-fiesta',
    pax: 150,
    contingencyPct: 10,
    wastePct: 7,
    productionPct: 15,
    capexPct: 30,
    vatPct: 12,
    pricingMethod: 'markup',
    pricingValue: 35,
    venueCost: 30000,
    otherExpenses: 8000,
    recipes: []
  },
  {
    id: 'tpl-intimate',
    name: 'Intimate Gathering',
    description: 'Curated menu for small, intimate celebrations',
    tag: 'Private',
    emoji: '🕯️',
    bannerClass: 'banner-intimate',
    pax: 20,
    contingencyPct: 5,
    wastePct: 3,
    productionPct: 10,
    capexPct: 20,
    vatPct: 12,
    pricingMethod: 'margin',
    pricingValue: 30,
    venueCost: 3000,
    otherExpenses: 500,
    recipes: []
  },
  {
    id: 'tpl-debut',
    name: 'Debut Package',
    description: '18 roses, 18 candles, full-course dinner for debut',
    tag: 'Debut',
    emoji: '🌹',
    bannerClass: 'banner-wedding',
    pax: 80,
    contingencyPct: 8,
    wastePct: 4,
    productionPct: 12,
    capexPct: 30,
    vatPct: 12,
    pricingMethod: 'markup',
    pricingValue: 40,
    venueCost: 20000,
    otherExpenses: 5000,
    recipes: []
  }
];

// ===== DATA =====
let db = {
  recipes: [],
  ingredients: [],
  packaging: [],
  cnPackages: [],
  settings: {
    bizName: 'My Food Business',
    currency: '₱',
    markup: 30,
    targetMargin: 30,
    monthlyBatches: 100,
    vat: 12,
    pricingMethod: 'markup',
    multiplier: 3
  }
};
const INGREDIENTS_PER_PAGE = 8;
const DASHBOARD_RECIPES_PER_PAGE = 10;
const RECIPES_PER_PAGE = 10;
const PRICING_PER_PAGE = 12;
let dashCurrentPage = 1;
let ingCurrentPage = 1;
let recipeCurrentPage = 1;
let pricingCurrentPage = 1;
let editingRecipeId = null;
let viewingRecipeId = null;
let editingIngId = null;
let editingPkgId = null;
let editingCnPackageId = null;
let viewingCnPackageId = null;
let currentPkgImageData = null; // base64 image for current modal

// ===== AUTHENTICATION & SESSION =====
const SESSION_PASSWORD = 'fo.support';
const SESSION_DURATION = 10 * 60 * 60 * 1000;
let sessionStartTime = null;
let sessionTimer = null;
let sessionAuthenticated = false;

function checkSessionValidity() {
  const storedTime = sessionStorage.getItem('sessionStartTime');
  if (!storedTime) return false;
  const elapsed = Date.now() - parseInt(storedTime);
  return elapsed < SESSION_DURATION;
}

function initializeSession() {
  if (checkSessionValidity()) {
    sessionStartTime = parseInt(sessionStorage.getItem('sessionStartTime'));
    sessionAuthenticated = true;
    showMainApp();
    startSessionTimer();
    return true;
  }
  return false;
}

function authenticateLogin() {
  const password = document.getElementById('login-password').value;
  if (password !== SESSION_PASSWORD) {
    toast('Invalid password', 'red');
    document.getElementById('login-password').value = '';
    return;
  }
  sessionStartTime = Date.now();
  sessionStorage.setItem('sessionStartTime', sessionStartTime.toString());
  sessionAuthenticated = true;
  document.getElementById('login-password').value = '';
  showMainApp();
  startSessionTimer();
  (async () => {
    await load();
    refreshRecipeNameLists();
    renderDashboard();
    updateBadges();
    toast('Welcome! Session started', 'green');
  })();
}

function startSessionTimer() {
  if (sessionTimer) clearInterval(sessionTimer);
  sessionTimer = setInterval(() => {
    if (!checkSessionValidity()) { signOutSession(); }
  }, 60000);
}

function signOutSession() {
  sessionAuthenticated = false;
  sessionStorage.removeItem('sessionStartTime');
  if (sessionTimer) clearInterval(sessionTimer);
  hideMainApp();
  document.getElementById('login-password').value = '';
  toast('Session ended', 'amber');
}

function confirmSignOut() {
  if (confirm('Sign out? You\'ll need to log back in.')) signOutSession();
}

function showMainApp() {
  document.getElementById('login-modal').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
}

function hideMainApp() {
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-modal').style.display = 'flex';
}

// Firebase init
const firebaseConfig = {
  apiKey: "AIzaSyCvOa44w_Ghf2EYsChwClmzw8ZTuCKeNMk",
  authDomain: "calculator-e4a6b.firebaseapp.com",
  projectId: "calculator-e4a6b",
  storageBucket: "calculator-e4a6b.firebasestorage.app",
  messagingSenderId: "977318599239",
  appId: "1:977318599239:web:bbf7957e2e0d683c332f62",
  measurementId: "G-0C60CYY887"
};
firebase.initializeApp(firebaseConfig);
const db_firestore = firebase.firestore();

// ===== PERSISTENCE =====
async function save() {
  try {
    await db_firestore.collection('data').doc('db').set(db);
    updateBadges();
  } catch (e) {
    console.error('Save failed', e);
    toast('Save failed!', 'red');
  }
}
async function load() {
  try {
    const doc = await db_firestore.collection('data').doc('db').get();
    if (doc.exists) { db = doc.data(); }
  } catch (e) { console.error('Load failed', e); }
  if (!db.settings) db.settings = {};
  const def = { bizName: 'My Food Business', currency: '₱', markup: 30, targetMargin: 30, monthlyBatches: 100, vat: 12, pricingMethod: 'markup', multiplier: 3, theme: 'light' };
  for (const k in def) if (db.settings[k] === undefined) db.settings[k] = def[k];
  if (!db.recipes) db.recipes = [];
  if (!db.ingredients) db.ingredients = [];
  if (!db.packaging) db.packaging = [];
  if (!db.cnPackages) db.cnPackages = [];
  db.ingredients.forEach(i => { if (i.unit) i.unit = i.unit.toLowerCase(); });
  db.packaging.forEach(p => { if (p.unit) p.unit = p.unit.toLowerCase(); });
  db.recipes.forEach(r => { if (r.unit) r.unit = r.unit.toLowerCase(); });
  const savedTheme = localStorage.getItem('theme') || db.settings.theme;
  if (savedTheme === 'dark') document.body.classList.add('dark-theme');
  else document.body.classList.remove('dark-theme');
  updateThemeButton();
  updateBadges();
}
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  db.settings.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', db.settings.theme);
  save(); updateThemeButton();
}
function updateThemeButton() {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = document.body.classList.contains('dark-theme') ? 'Switch to Light Theme' : 'Switch to Dark Theme';
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ===== NAV =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') === `showPage('${id}')`) n.classList.add('active');
  });
  if (id === 'dashboard') renderDashboard();
  if (id === 'recipes') { renderRecipes(); renderRecipeCategoryFilter(); }
  if (id === 'ingredients') { renderIngredients(); renderIngCategoryFilter(); }
  if (id === 'packaging') renderPackaging();
  if (id === 'cn-package') renderCnPackages();
  if (id === 'pricing') renderPricing();
  if (id === 'settings') loadSettings();
}

function updateBadges() {
  document.getElementById('recipe-count-badge').textContent = db.recipes.length;
  document.getElementById('ing-count-badge').textContent = db.ingredients.length;
  document.getElementById('pkg-count-badge').textContent = db.packaging.length;
  document.getElementById('cn-package-count-badge').textContent = db.cnPackages.length;
}

// ===== MODALS =====
function showModal(id) {
  document.getElementById(id).classList.add('open');
  if (id === 'recipe-modal' && !editingRecipeId) resetRecipeModal();
  if (id === 'cn-package-modal' && !editingCnPackageId) resetCnPackageModal();
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'recipe-modal') { editingRecipeId = null; resetRecipeModal(); }
  if (id === 'ingredient-modal') { editingIngId = null; resetIngModal(); }
  if (id === 'pkg-modal') { editingPkgId = null; resetPkgModal(); }
  if (id === 'cn-package-modal') { editingCnPackageId = null; currentPkgImageData = null; resetCnPackageModal(); }
}

// ===== TOAST =====
function toast(msg, type = 'green') {
  const el = document.getElementById('toast');
  const dot = document.getElementById('toast-dot');
  document.getElementById('toast-msg').textContent = msg;
  dot.className = 'toast-dot ' + type;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function showSnackbar(message, type = 'success') {
  toast(message, type === 'success' ? 'green' : type === 'error' ? 'red' : 'amber');
}

// ===== CURRENCY =====
function cur(n) { return (db.settings.currency || '₱') + parseFloat(n || 0).toFixed(2); }
function compactCur(n) {
  n = parseFloat(n) || 0;
  const sym = db.settings.currency || '₱';
  const abs = Math.abs(n);
  if (abs >= 1e6) return sym + (n / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return sym + (n / 1e3).toFixed(1) + 'k';
  return sym + n.toFixed(0);
}

// ===== SVG DONUT CHART =====
function renderDonut(containerId, segments, centerVal, centerLabel) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const total = segments.reduce((s, x) => s + (x.value > 0 ? x.value : 0), 0);
  const size = 124, stroke = 17, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let offset = 0, segs = '';
  if (total > 0) {
    segments.forEach(s => {
      if (s.value <= 0) return;
      const dash = (s.value / total) * c;
      segs += `<circle class="donut-seg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${(c - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"></circle>`;
      offset += dash;
    });
  }
  const legend = segments.map(s => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${s.color}"></span>
      <span class="legend-label">${s.label}</span>
      <span class="legend-val">${s.display !== undefined ? s.display : s.value}</span>
    </div>`).join('');
  el.innerHTML = `
    <div class="donut-center-wrap" style="width:${size}px;height:${size}px">
      <svg class="donut-svg" width="${size}" height="${size}">
        <circle class="donut-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"></circle>
        ${segs}
      </svg>
      <div class="donut-center">
        <div class="donut-center-val">${centerVal}</div>
        <div class="donut-center-label">${centerLabel}</div>
      </div>
    </div>
    <div class="donut-legend">${legend}</div>`;
}

// ===== UNIFIED PAGINATION BUILDER =====
function buildPagination(current, totalPages, fnName, totalItems, perPage, noun) {
  noun = noun || 'items';
  if (totalItems === 0) return `<div class="page-info">No ${noun}</div>`;
  const start = (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, totalItems);
  const info = `<div class="page-info">${start}–${end} of ${totalItems} ${noun}</div>`;
  if (totalPages <= 1) return info;
  const pages = [];
  const add = p => pages.push(p);
  add(1);
  let lo = Math.max(2, current - 1), hi = Math.min(totalPages - 1, current + 1);
  if (lo > 2) add('...');
  for (let p = lo; p <= hi; p++) add(p);
  if (hi < totalPages - 1) add('...');
  if (totalPages > 1) add(totalPages);
  const numBtns = pages.map(p => p === '...'
    ? `<span class="page-ellipsis">…</span>`
    : `<button class="page-btn ${p === current ? 'active' : ''}" onclick="${fnName}(${p})">${p}</button>`).join('');
  const controls = `<div class="page-controls">
    <button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="${fnName}(${current - 1})">‹</button>
    ${numBtns}
    <button class="page-btn" ${current === totalPages ? 'disabled' : ''} onclick="${fnName}(${current + 1})">›</button>
  </div>`;
  return info + controls;
}

// ===== RECIPE LOGIC =====
function calcRecipeCosts(recipe) {
  const ingCost = (recipe.ingredients || []).reduce((s, r) => s + calcIngredientCost(r.qty, r.unit, r.name), 0);
  const pkgCost = (recipe.packaging || []).reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.costPerUnit) || 0), 0);
  const baseCost = ingCost + pkgCost;
  const vatCost = recipe.includeVat ? baseCost * 0.12 : 0;
  const total = baseCost + vatCost;
  return { ingCost, pkgCost, baseCost, vatCost, total };
}
function calcSellPrice(recipe) {
  const { baseCost } = calcRecipeCosts(recipe);
  if (recipe.sellPrice) return parseFloat(recipe.sellPrice);
  const method = recipe.pricingMethod || db.settings.pricingMethod || 'markup';
  const val = parseFloat(recipe.pricingValue || 30);
  if (method === 'markup') return baseCost * (1 + val / 100);
  if (method === 'margin') return baseCost / (1 - val / 100);
  if (method === 'multiplier') return baseCost * val;
  return baseCost * 1.3;
}
function calcMargin(recipe) {
  const { baseCost } = calcRecipeCosts(recipe);
  const sell = calcSellPrice(recipe);
  if (!sell) return 0;
  return ((sell - baseCost) / sell) * 100;
}

// ===== RECIPE MODAL =====
function resetRecipeModal() {
  document.getElementById('recipe-modal-title').textContent = 'New Recipe';
  ['r-name', 'r-category', 'r-unit', 'r-notes', 'r-sell-price'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const b = document.getElementById('r-batch'); if (b) b.value = 1;
  const pv = document.getElementById('r-pricing-value'); if (pv) pv.value = db.settings.markup || 30;
  const pm = document.getElementById('r-pricing-method'); if (pm) pm.value = db.settings.pricingMethod || 'markup';
  const vat = document.getElementById('r-include-vat'); if (vat) vat.checked = false;
  document.getElementById('recipe-ing-rows').innerHTML = '';
  document.getElementById('recipe-pkg-rows').innerHTML = '';
  updateRecipeCostPreview();
}
function addIngredientRow(data) {
  const tbody = document.getElementById('recipe-ing-rows');
  const row = document.createElement('tr');
  const ingOptions = db.ingredients.map(i => `<option value="${i.name}" data-cost="${i.costPerUnit}" data-unit="${i.unit}">${i.name} (${i.unit})</option>`).join('');
  const unitOptions = ['g', 'kg', 'ml', 'L', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'pcs'].map(u => `<option value="${u}" ${data && data.unit === u ? 'selected' : ''}>${u}</option>`).join('');
  const isExisting = data && db.ingredients.find(i => i.name === data.name);
  const costValue = data && data.costPerUnit ? data.costPerUnit : '';
  row.innerHTML = `
    <td><select onchange="fillIngCost(this)" style="min-width:180px">
      <option value="">-- Select or type --</option>${ingOptions}
    </select>
    <input list="recipe-ingredient-list" type="text" placeholder="or type ingredient" style="margin-top:4px;display:block" class="ing-name-input" value="${data && data.name ? data.name : ''}" oninput="updateRecipeCostPreview(); updateIngCostEditability(this); filterIngredientOptions(this)"></td>
    <td><input type="number" value="${data && data.qty ? data.qty : ''}" step="0.01" min="0" placeholder="0" oninput="updateRecipeCostPreview()" style="width:70px"></td>
    <td><select style="width:70px" onchange="updateRecipeCostPreview()">${unitOptions}</select></td>
    <td><input type="number" class="ing-cost-input" value="${costValue}" step="0.01" min="0" placeholder="0.00" style="width:80px;${isExisting ? 'background:var(--surface3);color:var(--text3);cursor:not-allowed;' : ''}font-size:12px" oninput="updateRecipeCostPreview()" ${isExisting ? 'disabled' : ''}></td>
    <td class="td-mono subtotal-cell">₱0.00</td>
    <td><button class="remove-row" onclick="this.closest('tr').remove();updateRecipeCostPreview()">✕</button></td>`;
  tbody.appendChild(row);
  if (data) { updateRecipeCostPreview(); }
  if (data && data.name) {
    const sel = row.querySelector('select');
    const opt = [...sel.options].find(o => o.value === data.name);
    if (opt) sel.value = data.name;
  }
}
function updateIngCostEditability(input) {
  const row = input.closest('tr');
  const costInput = row.querySelector('.ing-cost-input');
  const isExisting = db.ingredients.find(i => i.name === input.value.trim());
  if (isExisting) {
    costInput.disabled = true; costInput.style.background = 'var(--surface3)'; costInput.style.color = 'var(--text3)'; costInput.style.cursor = 'not-allowed'; costInput.value = isExisting.costPerUnit;
  } else {
    costInput.disabled = false; costInput.style.background = ''; costInput.style.color = ''; costInput.style.cursor = '';
  }
}
function fillIngCost(sel) {
  const opt = sel.options[sel.selectedIndex];
  const row = sel.closest('tr');
  if (opt.value) {
    row.querySelector('.ing-name-input').value = opt.value;
    row.querySelectorAll('input')[1].value = '';
    row.querySelectorAll('select')[1].value = opt.dataset.unit || 'g';
    const costInput = row.querySelector('.ing-cost-input');
    costInput.value = opt.dataset.cost || '';
    costInput.disabled = true; costInput.style.background = 'var(--surface3)'; costInput.style.color = 'var(--text3)'; costInput.style.cursor = 'not-allowed';
  }
  updateRecipeCostPreview();
}
function addPackagingRow(data) {
  const tbody = document.getElementById('recipe-pkg-rows');
  const row = document.createElement('tr');
  const pkgOptions = db.packaging.map(p => `<option value="${p.name}" data-cost="${p.costPerUnit}" data-unit="${p.unit}">${p.name} (${p.unit})</option>`).join('');
  const unitOptions = ['pcs', 'pack', 'roll', 'box', 'set', 'bag'].map(u => `<option value="${u}" ${data && data.unit === u ? 'selected' : ''}>${u}</option>`).join('');
  const isExisting = data && db.packaging.find(p => p.name === data.name);
  const costValue = data && data.costPerUnit ? data.costPerUnit : '';
  row.innerHTML = `
    <td><select onchange="fillPkgCost(this)" style="min-width:180px">
      <option value="">-- Select or type --</option>${pkgOptions}
    </select>
    <input list="recipe-packaging-list" type="text" placeholder="or type item" style="margin-top:4px;display:block" class="pkg-name-input" value="${data && data.name ? data.name : ''}" oninput="updateRecipeCostPreview(); updatePkgCostEditability(this); filterPackagingOptions(this)"></td>
    <td><input type="number" value="${data && data.qty ? data.qty : ''}" step="0.01" min="0" placeholder="0" oninput="updateRecipeCostPreview()" style="width:70px"></td>
    <td><select style="width:80px" onchange="updateRecipeCostPreview()">${unitOptions}</select></td>
    <td><input type="number" class="pkg-cost-input" value="${costValue}" step="0.01" min="0" placeholder="0.00" style="width:80px;${isExisting ? 'background:var(--surface3);color:var(--text3);cursor:not-allowed;' : ''}font-size:12px" oninput="updateRecipeCostPreview()" ${isExisting ? 'disabled' : ''}></td>
    <td class="td-mono subtotal-cell">₱0.00</td>
    <td><button class="remove-row" onclick="this.closest('tr').remove();updateRecipeCostPreview()">✕</button></td>`;
  tbody.appendChild(row);
  if (data) updateRecipeCostPreview();
}
function updatePkgCostEditability(input) {
  const row = input.closest('tr');
  const costInput = row.querySelector('.pkg-cost-input');
  const isExisting = db.packaging.find(p => p.name === input.value.trim());
  if (isExisting) {
    costInput.disabled = true; costInput.style.background = 'var(--surface3)'; costInput.style.color = 'var(--text3)'; costInput.style.cursor = 'not-allowed'; costInput.value = isExisting.costPerUnit;
  } else {
    costInput.disabled = false; costInput.style.background = ''; costInput.style.color = ''; costInput.style.cursor = '';
  }
}
function fillPkgCost(sel) {
  const opt = sel.options[sel.selectedIndex];
  const row = sel.closest('tr');
  if (opt.value) {
    row.querySelector('.pkg-name-input').value = opt.value;
    row.querySelectorAll('input')[1].value = '';
    row.querySelectorAll('select')[1].value = opt.dataset.unit || 'pcs';
    const costInput = row.querySelector('.pkg-cost-input');
    costInput.value = opt.dataset.cost || '';
    costInput.disabled = true; costInput.style.background = 'var(--surface3)'; costInput.style.color = 'var(--text3)'; costInput.style.cursor = 'not-allowed';
  }
  updateRecipeCostPreview();
}
function refreshRecipeNameLists() {
  const ingList = document.getElementById('recipe-ingredient-list');
  const pkgList = document.getElementById('recipe-packaging-list');
  if (ingList) ingList.innerHTML = db.ingredients.map(i => `<option value="${i.name}"></option>`).join('');
  if (pkgList) pkgList.innerHTML = db.packaging.map(p => `<option value="${p.name}"></option>`).join('');
}
function filterIngredientOptions(input) {
  const row = input.closest('tr');
  const filter = (input.value || '').toLowerCase();
  const select = row.querySelector('select');
  if (!select) return;
  const options = db.ingredients.filter(i => i.name.toLowerCase().includes(filter)).map(i => `<option value="${i.name}" data-cost="${i.costPerUnit}" data-unit="${i.unit}">${i.name} (${i.unit})</option>`).join('');
  select.innerHTML = `<option value="">-- Select or type --</option>${options}`;
  const exact = db.ingredients.find(i => i.name.toLowerCase() === filter);
  if (exact) {
    select.value = exact.name;
    const unitSelect = row.querySelectorAll('select')[1];
    if (unitSelect) unitSelect.value = exact.unit || 'g';
    const costInput = row.querySelector('.ing-cost-input');
    if (costInput) { costInput.value = exact.costPerUnit || 0; costInput.disabled = true; costInput.style.background = 'var(--surface3)'; costInput.style.color = 'var(--text3)'; costInput.style.cursor = 'not-allowed'; }
  } else {
    const costInput = row.querySelector('.ing-cost-input');
    if (costInput) { costInput.disabled = false; costInput.style.background = ''; costInput.style.color = ''; costInput.style.cursor = ''; }
  }
}
function filterPackagingOptions(input) {
  const row = input.closest('tr');
  const filter = (input.value || '').toLowerCase();
  const select = row.querySelector('select');
  if (!select) return;
  const options = db.packaging.filter(p => p.name.toLowerCase().includes(filter)).map(p => `<option value="${p.name}" data-cost="${p.costPerUnit}" data-unit="${p.unit}">${p.name} (${p.unit})</option>`).join('');
  select.innerHTML = `<option value="">-- Select or type --</option>${options}`;
  const exact = db.packaging.find(p => p.name.toLowerCase() === filter);
  if (exact) {
    select.value = exact.name;
    const unitSelect = row.querySelectorAll('select')[1];
    if (unitSelect) unitSelect.value = exact.unit || 'pcs';
    const costInput = row.querySelector('.pkg-cost-input');
    if (costInput) { costInput.value = exact.costPerUnit || 0; costInput.disabled = true; costInput.style.background = 'var(--surface3)'; costInput.style.color = 'var(--text3)'; costInput.style.cursor = 'not-allowed'; }
  } else {
    const costInput = row.querySelector('.pkg-cost-input');
    if (costInput) { costInput.disabled = false; costInput.style.background = ''; costInput.style.color = ''; costInput.style.cursor = ''; }
  }
}
function getRowData(tbody, isIngredient = false) {
  return [...tbody.querySelectorAll('tr')].map(row => {
    const inputs = row.querySelectorAll('input');
    const selects = row.querySelectorAll('select');
    const name = inputs[0].value;
    const qty = parseFloat(inputs[1].value) || 0;
    let unit = '', costPerUnit = 0;
    if (isIngredient && selects.length > 1) {
      unit = selects[selects.length - 1].value;
      const costInput = row.querySelector('.ing-cost-input');
      if (costInput) costPerUnit = parseFloat(costInput.value) || 0;
    } else if (!isIngredient && selects.length > 1) {
      unit = selects[selects.length - 1].value;
      const costInput = row.querySelector('.pkg-cost-input');
      if (costInput) costPerUnit = parseFloat(costInput.value) || 0;
    }
    return { name, qty, unit, costPerUnit };
  }).filter(r => r.name || r.qty);
}
function updateRecipeCostPreview() {
  const ingRows = getRowData(document.getElementById('recipe-ing-rows'), true);
  const pkgRows = getRowData(document.getElementById('recipe-pkg-rows'), false);
  [...document.getElementById('recipe-ing-rows').querySelectorAll('tr')].forEach((row, i) => {
    const r = ingRows[i]; if (!r) return;
    const st = row.querySelector('.subtotal-cell');
    if (st) st.textContent = cur(calcIngredientCost(r.qty, r.unit, r.name));
  });
  [...document.getElementById('recipe-pkg-rows').querySelectorAll('tr')].forEach((row, i) => {
    const r = pkgRows[i]; if (!r) return;
    const st = row.querySelector('.subtotal-cell');
    if (st) st.textContent = cur(r.qty * r.costPerUnit);
  });
  const ingCost = ingRows.reduce((s, r) => s + calcIngredientCost(r.qty, r.unit, r.name), 0);
  const pkgCost = pkgRows.reduce((s, r) => s + r.qty * r.costPerUnit, 0);
  const baseTotal = ingCost + pkgCost;
  const includeVat = document.getElementById('r-include-vat')?.checked;
  const vatCost = includeVat ? baseTotal * 0.12 : 0;
  const total = baseTotal + vatCost;
  const method = document.getElementById('r-pricing-method').value;
  const pval = parseFloat(document.getElementById('r-pricing-value').value) || 0;
  const manualPrice = parseFloat(document.getElementById('r-sell-price').value) || 0;
  let sellPrice = manualPrice || 0;
  if (!sellPrice) {
    if (method === 'markup') sellPrice = baseTotal * (1 + pval / 100);
    else if (method === 'margin') sellPrice = baseTotal > 0 ? baseTotal / (1 - pval / 100) : 0;
    else if (method === 'multiplier') sellPrice = baseTotal * pval;
  }
  const margin = sellPrice > 0 ? ((sellPrice - baseTotal) / sellPrice * 100) : 0;
  document.getElementById('prev-ing').textContent = cur(ingCost);
  document.getElementById('prev-pkg').textContent = cur(pkgCost);
  document.getElementById('prev-vat').textContent = cur(vatCost);
  document.getElementById('prev-vat-row').style.display = includeVat ? 'flex' : 'none';
  document.getElementById('prev-total').textContent = cur(total);
  document.getElementById('prev-price').textContent = cur(sellPrice);
  document.getElementById('prev-margin').textContent = margin.toFixed(1) + '%';
  const meter = document.getElementById('prev-meter');
  meter.style.width = Math.min(100, Math.max(0, margin)) + '%';
  const tgt = db.settings.targetMargin || 30;
  meter.style.background = margin >= tgt ? 'var(--accent)' : margin >= tgt * 0.6 ? 'var(--amber)' : 'var(--red)';
  const labels = { markup: 'Markup (%)', margin: 'Target Margin (%)', multiplier: 'Multiplier (x)', manual: 'Manual Price (₱)' };
  document.getElementById('r-pricing-label').textContent = labels[method] || 'Value';
}
async function saveRecipe() {
  const name = document.getElementById('r-name').value.trim();
  if (!name) { toast('Recipe name is required!', 'red'); return; }
  const ingredients = getRowData(document.getElementById('recipe-ing-rows'), true);
  const packaging = getRowData(document.getElementById('recipe-pkg-rows'), false);
  ingredients.forEach(ing => {
    if (ing.name && ing.costPerUnit > 0 && !db.ingredients.find(i => i.name === ing.name)) {
      db.ingredients.push({ id: uid(), name: ing.name, category: 'Imported from Recipe', quantity: ing.qty || 1, unit: ing.unit, totalCost: ing.costPerUnit * (ing.qty || 1), costPerUnit: ing.costPerUnit, supplier: '' });
    }
  });
  packaging.forEach(pkg => {
    if (pkg.name && pkg.costPerUnit > 0 && !db.packaging.find(p => p.name === pkg.name)) {
      db.packaging.push({ id: uid(), name: pkg.name, type: 'Imported from Recipe', unit: pkg.unit, costPerUnit: pkg.costPerUnit, supplier: '' });
    }
  });
  const recipe = {
    id: editingRecipeId || uid(),
    name, category: document.getElementById('r-category').value.trim(),
    batch: parseInt(document.getElementById('r-batch').value) || 1,
    unit: document.getElementById('r-unit').value.trim().toLowerCase(),
    notes: document.getElementById('r-notes').value.trim(),
    ingredients, packaging,
    includeVat: document.getElementById('r-include-vat')?.checked || false,
    pricingMethod: document.getElementById('r-pricing-method').value,
    pricingValue: parseFloat(document.getElementById('r-pricing-value').value) || 0,
    sellPrice: parseFloat(document.getElementById('r-sell-price').value) || 0,
  };
  const isNew = !editingRecipeId;
  if (editingRecipeId) {
    const idx = db.recipes.findIndex(r => r.id === editingRecipeId);
    if (idx >= 0) db.recipes[idx] = recipe;
  } else { db.recipes.push(recipe); }
  renderRecipes(); renderDashboard(); updateBadges();
  closeModal('recipe-modal');
  try {
    await save();
    showSnackbar(isNew ? `Recipe "${name}" added successfully!` : 'Recipe updated!', 'success');
  } catch { toast('Failed to save recipe!', 'red'); }
  editingRecipeId = null;
}
function editRecipe(id) {
  const r = db.recipes.find(x => x.id === id); if (!r) return;
  editingRecipeId = id;
  document.getElementById('recipe-modal-title').textContent = 'Edit Recipe';
  document.getElementById('r-name').value = r.name;
  document.getElementById('r-category').value = r.category || '';
  document.getElementById('r-batch').value = r.batch || 1;
  document.getElementById('r-unit').value = r.unit || '';
  document.getElementById('r-notes').value = r.notes || '';
  document.getElementById('r-pricing-method').value = r.pricingMethod || 'markup';
  document.getElementById('r-pricing-value').value = r.pricingValue || 30;
  document.getElementById('r-sell-price').value = r.sellPrice || '';
  const vat = document.getElementById('r-include-vat'); if (vat) vat.checked = !!r.includeVat;
  document.getElementById('recipe-ing-rows').innerHTML = '';
  document.getElementById('recipe-pkg-rows').innerHTML = '';
  (r.ingredients || []).forEach(i => addIngredientRow(i));
  (r.packaging || []).forEach(p => addPackagingRow(p));
  updateRecipeCostPreview();
  showModal('recipe-modal');
}
function deleteRecipe(id) {
  if (!confirm('Delete this recipe?')) return;
  db.recipes = db.recipes.filter(r => r.id !== id);
  save(); renderRecipes(); renderDashboard();
  toast('Recipe deleted.', 'red');
}
function viewRecipe(id) {
  viewingRecipeId = id;
  const r = db.recipes.find(x => x.id === id); if (!r) return;
  document.getElementById('view-recipe-title').textContent = r.name;
  document.getElementById('view-recipe-body').innerHTML = `
    <div class="flex-row mb-4" style="gap:16px;flex-wrap:wrap;align-items:center;">
      <span class="tag tag-blue">${r.category || 'Uncategorized'}</span>
      <span class="text-sm text-muted">Batch: ${r.batch} ${r.unit || 'pcs'}</span>
    </div>
    <div id="view-recipe-details"></div>`;
  renderViewRecipeModal();
  showModal('view-recipe-modal');
}
function renderViewRecipeModal() {
  if (!viewingRecipeId) return;
  const r = db.recipes.find(x => x.id === viewingRecipeId); if (!r) return;
  const { ingCost, pkgCost, total, vatCost } = calcRecipeCosts(r);
  const sell = calcSellPrice(r);
  const profit = sell - (r.includeVat ? total - vatCost : total);
  const margin = calcMargin(r);
  const tgt = db.settings.targetMargin || 30;
  const statusColor = margin >= tgt ? 'tag-green' : margin >= tgt * 0.6 ? 'tag-amber' : 'tag-red';
  document.getElementById('view-recipe-details').innerHTML = `
    <div class="section-divider">Ingredients</div>
    ${(r.ingredients || []).map(i => `<div class="view-ingredient-row"><span>${i.name} × ${i.qty} ${i.unit}</span><span class="td-mono">${cur(calcIngredientCost(i.qty, i.unit, i.name))}</span></div>`).join('')}
    <div class="section-divider">Packaging</div>
    ${(r.packaging || []).map(p => `<div class="view-ingredient-row"><span>${p.name} × ${p.qty} ${p.unit}</span><span class="td-mono">${cur(p.qty * p.costPerUnit)}</span></div>`).join('')}
    <div class="cost-summary mt-4">
      <div class="cost-row"><span class="cost-label">Ingredient Cost</span><span class="cost-val">${cur(ingCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Packaging Cost</span><span class="cost-val">${cur(pkgCost)}</span></div>
      ${r.includeVat ? `<div class="cost-row"><span class="cost-label">VAT (12%)</span><span class="cost-val">${cur(vatCost)}</span></div>` : ''}
      <div class="cost-row total"><span class="cost-label">Total Cost</span><span class="cost-val">${cur(total)}</span></div>
      <div class="cost-row total"><span class="cost-label">Sell Price</span><span class="cost-val">${cur(sell)}</span></div>
      <div class="cost-row total"><span class="cost-label">Gross Profit</span><span class="cost-val">${cur(profit)}</span></div>
      <div class="cost-row total"><span class="cost-label">Margin</span><span class="cost-val ${statusColor}" style="padding:2px 8px;border-radius:20px">${margin.toFixed(1)}%</span></div>
      <div class="margin-meter mt-2"><div class="meter-track"><div class="meter-fill" style="width:${Math.min(100, Math.max(0, margin))}%;background:${margin >= tgt ? 'var(--accent)' : margin >= tgt * 0.6 ? 'var(--amber)' : 'var(--red)'}"></div></div></div>
    </div>
    ${r.notes ? `<div class="mt-4 text-sm text-muted">${r.notes}</div>` : ''}`;
}

// ===== RENDER RECIPES =====
function renderRecipes() {
  const search = (document.getElementById('recipe-search')?.value || '').toLowerCase();
  const cat = document.getElementById('recipe-filter-cat')?.value || '';
  const sort = document.getElementById('recipe-sort')?.value || 'name';
  let list = db.recipes.filter(r => r.name.toLowerCase().includes(search) && (!cat || r.category === cat));
  list.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const ca = calcRecipeCosts(a).total, cb = calcRecipeCosts(b).total;
    if (sort === 'cost') return ca - cb;
    if (sort === 'cost-desc') return cb - ca;
    if (sort === 'margin') return calcMargin(a) - calcMargin(b);
    return 0;
  });
  const tbody = document.getElementById('recipe-table-body');
  const paginationEl = document.getElementById('recipe-pagination');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><h3>No recipes yet</h3><p>Click "New Recipe" to add your first recipe</p></div></td></tr>`;
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }
  const tgt = db.settings.targetMargin || 30;
  const totalPages = Math.max(1, Math.ceil(list.length / RECIPES_PER_PAGE));
  if (recipeCurrentPage > totalPages) recipeCurrentPage = totalPages;
  const fullList = list;
  list = list.slice((recipeCurrentPage - 1) * RECIPES_PER_PAGE, recipeCurrentPage * RECIPES_PER_PAGE);
  tbody.innerHTML = list.map(r => {
    const c = calcRecipeCosts(r);
    const sell = calcSellPrice(r);
    const margin = calcMargin(r);
    const sClass = margin >= tgt ? 'tag-green' : margin >= tgt * 0.6 ? 'tag-amber' : 'tag-red';
    return `<tr>
      <td class="td-name">${r.name}</td>
      <td><span class="tag tag-blue">${r.category || '—'}</span></td>
      <td class="td-mono">${r.batch} ${r.unit || 'pcs'}</td>
      <td class="td-mono">${cur(c.ingCost)}</td>
      <td class="td-mono">${cur(c.pkgCost)}</td>
      <td class="td-mono" style="font-weight:600;color:var(--text)">${cur(c.total)}</td>
      <td class="td-mono" style="color:var(--accent)">${cur(sell)}</td>
      <td><span class="tag ${sClass}">${margin.toFixed(1)}%</span></td>
      <td><div class="td-actions">
        <button class="action-btn action-view" onclick="viewRecipe('${r.id}')">View</button>
        <button class="action-btn action-edit" onclick="editRecipe('${r.id}')">Edit</button>
        <button class="action-btn action-del" onclick="deleteRecipe('${r.id}')">Del</button>
      </div></td>
    </tr>`;
  }).join('');
  if (paginationEl) paginationEl.innerHTML = buildPagination(recipeCurrentPage, totalPages, 'setRecipePage', fullList.length, RECIPES_PER_PAGE, 'recipes');
}
function setRecipePage(page) { recipeCurrentPage = Math.max(1, page); renderRecipes(); }
function renderRecipeCategoryFilter() {
  const cats = [...new Set(db.recipes.map(r => r.category).filter(Boolean))];
  const sel = document.getElementById('recipe-filter-cat');
  const cur2 = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${c}" ${c === cur2 ? 'selected' : ''}>${c}</option>`).join('');
}

// ===== DASHBOARD =====
function renderDashboard() {
  const tgt = db.settings.targetMargin || 30;
  const costs = db.recipes.map(r => ({ r, c: calcRecipeCosts(r), sell: calcSellPrice(r), margin: calcMargin(r), profit: calcSellPrice(r) - calcRecipeCosts(r).total }));
  if (costs.length === 0) {
    document.getElementById('dash-highest-profit').textContent = '-';
    document.getElementById('dash-highest-margin').textContent = '-';
    document.getElementById('dash-lowest-profit').textContent = '-';
    document.getElementById('dash-lowest-margin').textContent = '-';
    document.getElementById('dash-total-profit').textContent = '₱0.00';
  } else {
    const sorted = [...costs].sort((a, b) => b.margin - a.margin);
    document.getElementById('dash-highest-profit').textContent = sorted[0].r.name;
    document.getElementById('dash-highest-margin').textContent = sorted[0].margin.toFixed(1) + '% margin';
    document.getElementById('dash-lowest-profit').textContent = sorted[sorted.length - 1].r.name;
    document.getElementById('dash-lowest-margin').textContent = sorted[sorted.length - 1].margin.toFixed(1) + '% margin';
    document.getElementById('dash-total-profit').textContent = cur(costs.reduce((s, x) => s + x.profit * 100, 0));
  }
  const upcoming = db.cnPackages.filter(p => p.eventDate && new Date(p.eventDate + 'T' + (p.eventTime || '00:00')) > new Date()).sort((a, b) => new Date(a.eventDate + 'T' + (a.eventTime || '00:00')) - new Date(b.eventDate + 'T' + (b.eventTime || '00:00')));
  const next = upcoming[0];
  document.getElementById('dash-upcoming-events').textContent = upcoming.length;
  document.getElementById('dash-next-event').textContent = next ? `${next.name} - ${new Date(next.eventDate + 'T' + (next.eventTime || '00:00')).toLocaleDateString()} ${next.eventTime || ''}` : 'No upcoming events';
  const topCosts = [...costs].sort((a, b) => b.c.total - a.c.total).slice(0, 8);
  const maxCost = topCosts[0]?.c.total || 1;
  document.getElementById('dash-top-recipes').innerHTML = topCosts.length ? topCosts.map(x => `
    <div class="bar-item"><div class="bar-name" title="${x.r.name}">${x.r.name}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${(x.c.total / maxCost * 100).toFixed(1)}%;background:var(--blue)"></div></div>
    <div class="bar-val">${cur(x.c.total)}</div></div>`).join('') : '<div class="text-muted text-sm">No recipes yet</div>';
  const marginList = [...costs].sort((a, b) => b.margin - a.margin).slice(0, 8);
  document.getElementById('dash-margin-list').innerHTML = marginList.length ? marginList.map(x => {
    const color = x.margin >= tgt ? 'var(--accent)' : x.margin >= tgt * 0.6 ? 'var(--amber)' : 'var(--red)';
    return `<div class="bar-item"><div class="bar-name" title="${x.r.name}">${x.r.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, Math.max(0, x.margin)).toFixed(1)}%;background:${color}"></div></div>
      <div class="bar-val" style="color:${color}">${x.margin.toFixed(1)}%</div></div>`;
  }).join('') : '<div class="text-muted text-sm">No recipes yet</div>';

  // ── Donut: Margin Health ──
  const healthGreen = costs.filter(x => x.margin >= tgt).length;
  const healthAmber = costs.filter(x => x.margin >= tgt * 0.6 && x.margin < tgt).length;
  const healthRed = costs.filter(x => x.margin < tgt * 0.6).length;
  renderDonut('dash-margin-health', [
    { label: 'On / above target', value: healthGreen, color: 'var(--green)' },
    { label: 'Near target', value: healthAmber, color: 'var(--amber)' },
    { label: 'Below target', value: healthRed, color: 'var(--red)' }
  ], costs.length, costs.length === 1 ? 'Recipe' : 'Recipes');

  // ── Donut: Cost Composition ──
  const totIng = costs.reduce((s, x) => s + x.c.ingCost, 0);
  const totPkg = costs.reduce((s, x) => s + x.c.pkgCost, 0);
  const totVat = costs.reduce((s, x) => s + (x.c.vatCost || 0), 0);
  renderDonut('dash-cost-composition', [
    { label: 'Ingredients', value: totIng, color: 'var(--blue)', display: cur(totIng) },
    { label: 'Packaging', value: totPkg, color: 'var(--purple)', display: cur(totPkg) },
    { label: 'VAT', value: totVat, color: 'var(--amber)', display: cur(totVat) }
  ], compactCur(totIng + totPkg + totVat), 'Total');

  const search = (document.getElementById('dash-search')?.value || '').toLowerCase().trim();
  const filtered = costs.filter(x => !search || x.r.name.toLowerCase().includes(search) || (x.r.category || '').toLowerCase().includes(search));
  const totalPages = Math.max(1, Math.ceil(filtered.length / DASHBOARD_RECIPES_PER_PAGE));
  if (dashCurrentPage > totalPages) dashCurrentPage = totalPages;
  const pageItems = filtered.slice((dashCurrentPage - 1) * DASHBOARD_RECIPES_PER_PAGE, dashCurrentPage * DASHBOARD_RECIPES_PER_PAGE);
  const tbody = document.getElementById('dash-table-body');
  if (!pageItems.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state" style="padding:40px"><h3>No recipes match your search</h3></div></td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(x => {
      const sClass = x.margin >= tgt ? 'tag-green' : x.margin >= tgt * 0.6 ? 'tag-amber' : 'tag-red';
      return `<tr><td class="td-name">${x.r.name}</td>
        <td><span class="tag tag-blue">${x.r.category || '—'}</span></td>
        <td>${x.r.batch} ${x.r.unit || 'pcs'}</td>
        <td class="td-mono">${cur(x.c.ingCost)}</td>
        <td class="td-mono">${cur(x.c.pkgCost)}</td>
        <td class="td-mono" style="font-weight:600">${cur(x.c.total)}</td>
        <td class="td-mono" style="color:var(--accent)">${cur(x.sell)}</td>
        <td><span class="tag ${sClass}">${x.margin.toFixed(1)}%</span></td>
        <td><span class="tag ${sClass}">${x.margin >= tgt ? '✓ Target Met' : '✗ Below Target'}</span></td></tr>`;
    }).join('');
  }
  const pagination = document.getElementById('dash-pagination');
  if (pagination) {
    pagination.innerHTML = buildPagination(dashCurrentPage, totalPages, 'setDashPage', filtered.length, DASHBOARD_RECIPES_PER_PAGE, 'recipes');
  }
}
function setDashPage(page) { dashCurrentPage = Math.max(1, page); renderDashboard(); }

// ===== INGREDIENTS =====
function resetIngModal() {
  document.getElementById('ing-modal-title').textContent = 'Add Ingredient';
  ['ing-name', 'ing-sku', 'ing-cat', 'ing-supplier'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ing-qty').value = 1;
  document.getElementById('ing-unit').value = 'g';
  document.getElementById('ing-cost').value = 0;
  document.getElementById('ing-unit-cost').value = 0;
  document.getElementById('ing-cost').oninput = calculateIngUnitCost;
  document.getElementById('ing-qty').oninput = calculateIngUnitCost;
}
function calculateIngUnitCost() {
  const qty = parseFloat(document.getElementById('ing-qty').value) || 1;
  const totalCost = parseFloat(document.getElementById('ing-cost').value) || 0;
  document.getElementById('ing-unit-cost').value = (qty > 0 ? totalCost / qty : 0).toFixed(2);
}
function saveIngredient() {
  const name = document.getElementById('ing-name').value.trim();
  if (!name) { toast('Name is required!', 'red'); return; }
  const qty = parseFloat(document.getElementById('ing-qty').value) || 1;
  const totalCost = parseFloat(document.getElementById('ing-cost').value) || 0;
  const ing = { id: editingIngId || uid(), sku: document.getElementById('ing-sku').value.trim(), name, category: document.getElementById('ing-cat').value.trim(), quantity: qty, unit: document.getElementById('ing-unit').value.toLowerCase(), totalCost, costPerUnit: qty > 0 ? totalCost / qty : 0, supplier: document.getElementById('ing-supplier').value.trim() };
  if (editingIngId) { const idx = db.ingredients.findIndex(i => i.id === editingIngId); if (idx >= 0) db.ingredients[idx] = ing; }
  else db.ingredients.push(ing);
  save(); closeModal('ingredient-modal'); renderIngredients(); renderIngCategoryFilter(); refreshRecipeNameLists();
  toast(editingIngId ? 'Ingredient updated!' : 'Ingredient saved!');
  editingIngId = null;
}
function editIngredient(id) {
  const i = db.ingredients.find(x => x.id === id); if (!i) return;
  editingIngId = id;
  document.getElementById('ing-modal-title').textContent = 'Edit Ingredient';
  document.getElementById('ing-name').value = i.name;
  document.getElementById('ing-sku').value = i.sku || '';
  document.getElementById('ing-cat').value = i.category || '';
  document.getElementById('ing-qty').value = i.quantity || 1;
  document.getElementById('ing-unit').value = i.unit;
  document.getElementById('ing-cost').value = i.totalCost || (i.costPerUnit * (i.quantity || 1));
  document.getElementById('ing-unit-cost').value = i.costPerUnit || 0;
  document.getElementById('ing-supplier').value = i.supplier || '';
  document.getElementById('ing-cost').oninput = calculateIngUnitCost;
  document.getElementById('ing-qty').oninput = calculateIngUnitCost;
  showModal('ingredient-modal');
}
function deleteIngredient(id) {
  if (!confirm('Delete this ingredient?')) return;
  db.ingredients = db.ingredients.filter(i => i.id !== id);
  save(); renderIngredients(); toast('Deleted.', 'red');
}
function setIngPage(page) { ingCurrentPage = Math.max(1, page); }
function renderIngredients() {
  const search = (document.getElementById('ing-search')?.value || '').toLowerCase();
  const cat = document.getElementById('ing-filter-cat')?.value || '';
  let list = db.ingredients.filter(i => i.name.toLowerCase().includes(search) && (!cat || i.category === cat));
  const tbody = document.getElementById('ing-table-body');
  const paginationEl = document.getElementById('ing-pagination');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h3>No ingredients yet</h3><p>Add ingredients to use them in recipes</p></div></td></tr>`; if (paginationEl) paginationEl.innerHTML = ''; return; }
  const totalPages = Math.max(1, Math.ceil(list.length / INGREDIENTS_PER_PAGE));
  if (ingCurrentPage > totalPages) ingCurrentPage = totalPages;
  const pagedList = list.slice((ingCurrentPage - 1) * INGREDIENTS_PER_PAGE, ingCurrentPage * INGREDIENTS_PER_PAGE);
  tbody.innerHTML = pagedList.map(i => {
    const usedIn = db.recipes.filter(r => r.ingredients?.some(x => x.name === i.name)).length;
    return `<tr>
      <td>${i.sku ? `${i.sku} — ` : ''}<span class="td-name">${i.name}</span></td>
      <td><span class="tag tag-purple">${i.category || '—'}</span></td>
      <td class="td-mono">${i.quantity || 1}</td>
      <td>${i.unit}</td>
      <td class="td-mono" style="color:var(--amber)">${cur(i.costPerUnit)}</td>
      <td>${i.supplier || '—'}</td>
      <td><span class="tag ${usedIn ? 'tag-green' : 'tag-blue'}">${usedIn} recipe${usedIn !== 1 ? 's' : ''}</span></td>
      <td><div class="td-actions">
        <button class="action-btn action-edit" onclick="editIngredient('${i.id}')">Edit</button>
        <button class="action-btn action-del" onclick="deleteIngredient('${i.id}')">Del</button>
      </div></td></tr>`;
  }).join('');
  if (paginationEl) {
    paginationEl.innerHTML = buildPagination(ingCurrentPage, totalPages, 'gotoIngPage', list.length, INGREDIENTS_PER_PAGE, 'ingredients');
  }
}
function gotoIngPage(page) { setIngPage(page); renderIngredients(); }
function renderIngCategoryFilter() {
  const cats = [...new Set(db.ingredients.map(i => i.category).filter(Boolean))];
  const sel = document.getElementById('ing-filter-cat'); if (!sel) return;
  const cur2 = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${c}" ${c === cur2 ? 'selected' : ''}>${c}</option>`).join('');
}

// ===== PACKAGING =====
function resetPkgModal() {
  document.getElementById('pkg-modal-title').textContent = 'Add Packaging';
  ['pkg-name', 'pkg-sku', 'pkg-type', 'pkg-supplier'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pkg-cost').value = 0;
  document.getElementById('pkg-unit').value = 'pcs';
}
function savePackaging() {
  const name = document.getElementById('pkg-name').value.trim();
  if (!name) { toast('Name is required!', 'red'); return; }
  const pkg = { id: editingPkgId || uid(), sku: document.getElementById('pkg-sku').value.trim(), name, type: document.getElementById('pkg-type').value.trim(), unit: document.getElementById('pkg-unit').value.toLowerCase(), costPerUnit: parseFloat(document.getElementById('pkg-cost').value) || 0, supplier: document.getElementById('pkg-supplier').value.trim() };
  if (editingPkgId) { const idx = db.packaging.findIndex(p => p.id === editingPkgId); if (idx >= 0) db.packaging[idx] = pkg; }
  else db.packaging.push(pkg);
  save(); closeModal('pkg-modal'); renderPackaging(); refreshRecipeNameLists();
  toast(editingPkgId ? 'Updated!' : 'Packaging saved!');
  editingPkgId = null;
}
function editPackaging(id) {
  const p = db.packaging.find(x => x.id === id); if (!p) return;
  editingPkgId = id;
  document.getElementById('pkg-modal-title').textContent = 'Edit Packaging';
  document.getElementById('pkg-sku').value = p.sku || '';
  document.getElementById('pkg-name').value = p.name;
  document.getElementById('pkg-type').value = p.type || '';
  document.getElementById('pkg-unit').value = p.unit;
  document.getElementById('pkg-cost').value = p.costPerUnit;
  document.getElementById('pkg-supplier').value = p.supplier || '';
  showModal('pkg-modal');
}
function deletePackaging(id) {
  if (!confirm('Delete this packaging?')) return;
  db.packaging = db.packaging.filter(p => p.id !== id);
  save(); renderPackaging(); toast('Deleted.', 'red');
}
function renderPackaging() {
  const tbody = document.getElementById('pkg-table-body');
  if (!db.packaging.length) { tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><h3>No packaging yet</h3><p>Add packaging materials used in your recipes</p></div></td></tr>`; return; }
  tbody.innerHTML = db.packaging.map(p => `<tr>
    <td>${p.sku ? `${p.sku} — ` : ''}<span class="td-name">${p.name}</span></td>
    <td><span class="tag tag-purple">${p.type || '—'}</span></td>
    <td>${p.unit}</td>
    <td class="td-mono" style="color:var(--amber)">${cur(p.costPerUnit)}</td>
    <td>${p.supplier || '—'}</td>
    <td><div class="td-actions">
      <button class="action-btn action-edit" onclick="editPackaging('${p.id}')">Edit</button>
      <button class="action-btn action-del" onclick="deletePackaging('${p.id}')">Del</button>
    </div></td></tr>`).join('');
}

// ===== PRICING REPORT =====
function setPricingPage(page) { pricingCurrentPage = Math.max(1, page); renderPricing(); }
function renderPricing() {
  const tgt = db.settings.targetMargin || 30;
  const tbody = document.getElementById('pricing-table-body');
  const paginationEl = document.getElementById('pricing-pagination');
  if (!db.recipes.length) {
    tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><h3>No recipes</h3></div></td></tr>`;
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }
  const totalPages = Math.max(1, Math.ceil(db.recipes.length / PRICING_PER_PAGE));
  if (pricingCurrentPage > totalPages) pricingCurrentPage = totalPages;
  const startIdx = (pricingCurrentPage - 1) * PRICING_PER_PAGE;
  const pageRecipes = db.recipes.slice(startIdx, startIdx + PRICING_PER_PAGE);
  tbody.innerHTML = pageRecipes.map((r, idx) => {
    const i = startIdx + idx;
    const c = calcRecipeCosts(r);
    const sell = calcSellPrice(r);
    const gross = sell - c.total;
    const margin = calcMargin(r);
    const sClass = margin >= tgt ? 'tag-green' : margin >= tgt * 0.6 ? 'tag-amber' : 'tag-red';
    const multiplier = c.total > 0 ? (sell / c.total).toFixed(2) : '—';
    return `<tr>
      <td style="color:var(--text3);font-family:'DM Mono',monospace;font-size:11px">${i + 1}</td>
      <td class="td-name">${r.name}</td>
      <td><span class="tag tag-blue">${r.category || '—'}</span></td>
      <td>${r.batch} ${r.unit || 'pcs'}</td>
      <td class="td-mono">${cur(c.ingCost)}</td>
      <td class="td-mono">${cur(c.pkgCost)}</td>
      <td class="td-mono">—</td>
      <td class="td-mono" style="font-weight:600">${cur(c.total)}</td>
      <td class="td-mono">${multiplier}x</td>
      <td class="td-mono" style="color:var(--accent);font-weight:600">${cur(sell)}</td>
      <td class="td-mono" style="color:${gross >= 0 ? 'var(--accent)' : 'var(--red)'}">${cur(gross)}</td>
      <td><span class="tag ${sClass}">${margin.toFixed(1)}%</span></td>
      <td><span class="tag ${margin >= tgt ? 'tag-green' : 'tag-red'}">${margin >= tgt ? '✓ Yes' : '✗ No'}</span></td></tr>`;
  }).join('');
  if (paginationEl) paginationEl.innerHTML = buildPagination(pricingCurrentPage, totalPages, 'setPricingPage', db.recipes.length, PRICING_PER_PAGE, 'recipes');
}

// ===== SETTINGS =====
function loadSettings() {
  const s = db.settings;
  document.getElementById('set-biz-name').value = s.bizName || '';
  document.getElementById('set-currency').value = s.currency || '₱';
  document.getElementById('set-markup').value = s.markup || 30;
  document.getElementById('set-target-margin').value = s.targetMargin || 30;
  document.getElementById('set-monthly-batches').value = s.monthlyBatches || 100;
  document.getElementById('set-vat').value = s.vat || 12;
  document.getElementById('set-pricing-method').value = s.pricingMethod || 'markup';
  document.getElementById('set-multiplier').value = s.multiplier || 3;
  updateThemeButton();
}
function saveSettings() {
  db.settings.bizName = document.getElementById('set-biz-name').value;
  db.settings.currency = document.getElementById('set-currency').value || '₱';
  db.settings.markup = parseFloat(document.getElementById('set-markup').value) || 30;
  db.settings.targetMargin = parseFloat(document.getElementById('set-target-margin').value) || 30;
  db.settings.monthlyBatches = parseInt(document.getElementById('set-monthly-batches').value) || 100;
  db.settings.vat = parseFloat(document.getElementById('set-vat').value) || 0;
  db.settings.pricingMethod = document.getElementById('set-pricing-method').value;
  db.settings.multiplier = parseFloat(document.getElementById('set-multiplier').value) || 3;
  save(); toast('Settings saved!'); renderDashboard();
}
function clearAllData() {
  if (!confirm('Are you sure? This will delete ALL data permanently!')) return;
  if (!confirm('This action cannot be undone. Continue?')) return;
  db = { recipes: [], ingredients: [], packaging: [], cnPackages: [], settings: { bizName: 'My Food Business', currency: '₱', markup: 30, targetMargin: 30, monthlyBatches: 100, vat: 12, pricingMethod: 'markup', multiplier: 3 } };
  save(); showPage('dashboard'); toast('All data cleared.', 'red');
}

// ===== EXPORT / IMPORT =====
function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'recipecost_backup.json'; a.click();
  toast('Data exported!');
}
function importData() { document.getElementById('import-file').click(); }
function handleImport(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (parsed.recipes !== undefined) { db = parsed; save(); showPage('dashboard'); renderDashboard(); updateBadges(); toast('Data imported successfully!'); }
      else toast('Invalid file format!', 'red');
    } catch { toast('Failed to parse file!', 'red'); }
  };
  reader.readAsText(file); e.target.value = '';
}
function importIngredientsExcel() { document.getElementById('ingredient-xlsx-file').click(); }
function handleIngredientUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  if (typeof XLSX === 'undefined') { toast('Excel parser not loaded!', 'red'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const workbook = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (!rawRows.length) { toast('Excel contains no rows.', 'red'); return; }
      const normalizeKey = key => String(key || '').trim().toLowerCase();
      const rows = rawRows.map(raw => {
        const row = {}; Object.keys(raw).forEach(key => row[normalizeKey(key)] = raw[key]);
        const quantity = parseFloat(row['quantity'] || row['qty'] || 1) || 1;
        const totalCost = parseFloat(row['unit cost'] || row['unitcost'] || row['cost per unit'] || row['cost'] || 0) || 0;
        const unit = String(row['unit of measurement'] || row['unit'] || row['uom'] || 'pcs').trim() || 'pcs';
        return { sku: String(row['sku'] || '').trim(), name: String(row['ingredient name'] || row['ingredient'] || row['name'] || '').trim(), quantity, unit, totalCost, costPerUnit: quantity > 0 ? totalCost / quantity : 0, supplier: String(row['supplier'] || '').trim(), category: String(row['category'] || '').trim() };
      }).filter(item => item.name);
      if (!rows.length) { toast('No valid ingredient rows found.', 'red'); return; }
      let added = 0, updated = 0;
      rows.forEach(item => {
        const existing = db.ingredients.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (existing) { Object.assign(existing, { sku: existing.sku || item.sku, category: existing.category || item.category, supplier: existing.supplier || item.supplier, quantity: item.quantity || existing.quantity || 1, unit: item.unit || existing.unit || 'pcs', ...(item.totalCost ? { totalCost: item.totalCost, costPerUnit: item.costPerUnit } : {}) }); updated++; }
        else { db.ingredients.push({ id: uid(), ...item }); added++; }
      });
      save(); renderIngredients(); renderIngCategoryFilter(); refreshRecipeNameLists(); updateBadges();
      toast(`Imported ${added} ingredients${updated ? `, updated ${updated}` : ''}.`);
    } catch (err) { console.error(err); toast('Unable to parse Excel file.', 'red'); }
  };
  reader.readAsArrayBuffer(file); e.target.value = '';
}

// ===== CN PACKAGE IMAGE HANDLING =====
function triggerImageUpload() {
  document.getElementById('pkg-image-upload').click();
}
function handlePkgImageUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    currentPkgImageData = ev.target.result;
    const img = document.getElementById('pkg-img-preview');
    const placeholder = document.getElementById('pkg-img-placeholder');
    img.src = currentPkgImageData;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file); e.target.value = '';
}
function updateEmojiPreview() {
  const emoji = document.getElementById('cn-pkg-emoji').value;
  if (emoji) {
    const img = document.getElementById('pkg-img-preview');
    const placeholder = document.getElementById('pkg-img-placeholder');
    if (!currentPkgImageData) {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    }
  }
}

// ===== CN PACKAGE CALCULATIONS =====
function calcCnPackageTotals(pkg) {
  const pax = pkg.pax || 1;
  const recipes = pkg.recipes || [];
  const baseCost = recipes.reduce((sum, r) => sum + (r.qtyPerPax * r.costPerUnit * pax), 0);
  const contingencyCost = baseCost * ((pkg.contingencyPct || 0) / 100);
  const wasteCost = baseCost * ((pkg.wastePct || 0) / 100);
  const productionCost = baseCost * ((pkg.productionPct || 0) / 100);
  const capexCost = baseCost * ((pkg.capexPct || 0) / 100);
  const venueCost = pkg.venueCost || 0;
  const manpowerCost = (pkg.manpowerCount || 0) * (pkg.manpowerHours || 0) * (455 / 8);
  const otherExpenses = Array.isArray(pkg.otherExpenses) ? pkg.otherExpenses.reduce((sum, exp) => sum + (exp.cost || 0), 0) : (pkg.otherExpenses || 0);
  const totalCost = baseCost + contingencyCost + wasteCost + productionCost + capexCost + venueCost + manpowerCost + otherExpenses;
  const pricingMethod = pkg.pricingMethod || 'markup';
  const pricingValue = pkg.pricingValue ?? 30;
  let sellingPriceExclVat;
  if (pricingMethod === 'markup') sellingPriceExclVat = totalCost * (1 + pricingValue / 100);
  else if (pricingMethod === 'margin') sellingPriceExclVat = totalCost > 0 ? totalCost / (1 - pricingValue / 100) : 0;
  else sellingPriceExclVat = totalCost * 1.3;
  const vatAmount = sellingPriceExclVat * ((pkg.vatPct || 0) / 100);
  const sellingPriceInclVat = sellingPriceExclVat + vatAmount;
  const profit = sellingPriceExclVat - totalCost;
  const margin = totalCost > 0 ? (profit / sellingPriceExclVat) * 100 : 0;
  return { baseCost, contingencyCost, wasteCost, productionCost, capexCost, venueCost, otherExpenses, totalCost, vatAmount, sellingPriceExclVat, sellingPriceInclVat, profit, margin };
}

// ===== CN PACKAGE MODAL =====
function resetCnPackageModal() {
  const titleEl = document.getElementById('cn-package-modal-title');
  if (titleEl) titleEl.textContent = 'New Package';
  const fields = [
    { id: 'cn-pkg-name', value: '' }, { id: 'cn-pkg-desc', value: '' }, { id: 'cn-pkg-tag', value: '' },
    { id: 'cn-pkg-emoji', value: '' }, { id: 'cn-pkg-pax', value: 50 },
    { id: 'cn-pkg-contingency', value: 5 }, { id: 'cn-pkg-waste', value: 3 },
    { id: 'cn-pkg-production', value: 10 }, { id: 'cn-pkg-capex', value: 30 },
    { id: 'cn-pkg-venue', value: '' }, { id: 'cn-pkg-venue-cost', value: 0 },
    { id: 'cn-pkg-manpower-count', value: 0 }, { id: 'cn-pkg-manpower-hours', value: 0 },
    { id: 'cn-pkg-event-date', value: '' }, { id: 'cn-pkg-event-time', value: '' },
    { id: 'cn-pkg-vat', value: 12 }, { id: 'cn-pkg-pricing-value', value: 30 }
  ];
  fields.forEach(({ id, value }) => { const el = document.getElementById(id); if (el) el.value = value; });
  const recipeRowsEl = document.getElementById('cn-package-recipe-rows');
  if (recipeRowsEl) recipeRowsEl.innerHTML = '';
  const otherExpensesEl = document.getElementById('cn-other-expenses-list');
  if (otherExpensesEl) otherExpensesEl.innerHTML = '';
  // Reset image
  currentPkgImageData = null;
  const img = document.getElementById('pkg-img-preview');
  const placeholder = document.getElementById('pkg-img-placeholder');
  if (img) { img.src = ''; img.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'flex';
  updateCnPackageCostPreview();
}

function addCnPackageRecipeRow(data) {
  const tbody = document.getElementById('cn-package-recipe-rows');
  const row = document.createElement('tr');
  const recipeOptions = db.recipes.map(r => `<option value="${r.name}" data-id="${r.id}">${r.name}</option>`).join('');
  row.innerHTML = `
    <td><select onchange="fillCnPackageRecipeCost(this)" style="min-width:200px">
      <option value="">-- Select Recipe --</option>${recipeOptions}
    </select></td>
    <td><input type="number" value="${data && data.qtyPerPax ? data.qtyPerPax : ''}" step="0.01" min="0" placeholder="0" oninput="updateCnPackageCostPreview()" style="width:80px"></td>
    <td><span class="unit-cell">—</span></td>
    <td class="td-mono cost-cell">₱0.00</td>
    <td class="td-mono subtotal-cell">₱0.00</td>
    <td><button class="remove-row" onclick="this.closest('tr').remove();updateCnPackageCostPreview()">✕</button></td>`;
  tbody.appendChild(row);
  if (data) {
    const sel = row.querySelector('select');
    const opt = [...sel.options].find(o => o.value === data.name);
    if (opt) { sel.value = data.name; fillCnPackageRecipeCost(sel); }
    row.querySelector('input').value = data.qtyPerPax || '';
    updateCnPackageCostPreview();
  }
}

function addOtherExpenseRow(data) {
  const container = document.getElementById('cn-other-expenses-list');
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.marginBottom = '8px';
  row.style.alignItems = 'center';
  row.innerHTML = `
    <input type="text" placeholder="Expense on" value="${data ? data.description : ''}" oninput="updateCnPackageCostPreview()" style="flex:1">
    <input type="number" placeholder="Cost" value="${data ? data.cost : ''}" step="0.01" min="0" oninput="updateCnPackageCostPreview()" style="width:120px">
    <button class="remove-row" onclick="this.closest('div').remove();updateCnPackageCostPreview()" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">✕</button>`;
  container.appendChild(row);
  updateCnPackageCostPreview();
}

function fillCnPackageRecipeCost(sel) {
  const row = sel.closest('tr');
  const recipe = db.recipes.find(r => r.name === sel.value);
  if (recipe) {
    row.querySelector('.unit-cell').textContent = recipe.unit || 'pcs';
    row.querySelector('.cost-cell').textContent = cur(calcSellPrice(recipe));
    if (!row.querySelector('input').value) row.querySelector('input').value = 1;
  } else {
    row.querySelector('.unit-cell').textContent = '—';
    row.querySelector('.cost-cell').textContent = '₱0.00';
  }
  updateCnPackageCostPreview();
}

function updateCnPackageCostPreview() {
  const pax = parseFloat(document.getElementById('cn-pkg-pax').value) || 1;
  const contingencyPct = parseFloat(document.getElementById('cn-pkg-contingency').value) || 0;
  const wastePct = parseFloat(document.getElementById('cn-pkg-waste').value) || 0;
  const productionPct = parseFloat(document.getElementById('cn-pkg-production').value) || 0;
  const capexPct = parseFloat(document.getElementById('cn-pkg-capex').value) || 0;
  const vatPct = parseFloat(document.getElementById('cn-pkg-vat').value) || 0;
  const pricingMethod = document.getElementById('cn-pkg-pricing-method').value || 'markup';
  let pricingValue = parseFloat(document.getElementById('cn-pkg-pricing-value').value);
  if (isNaN(pricingValue)) pricingValue = 30;
  const venueCost = parseFloat(document.getElementById('cn-pkg-venue-cost').value) || 0;
  const manpowerCount = parseFloat(document.getElementById('cn-pkg-manpower-count').value) || 0;
  const manpowerHours = parseFloat(document.getElementById('cn-pkg-manpower-hours').value) || 0;
  const manpowerCost = manpowerCount * manpowerHours * (455 / 8);
  let otherExpenses = 0;
  [...document.getElementById('cn-other-expenses-list').querySelectorAll('.form-grid-2')].forEach(row => {
    const costInput = row.querySelector('input[type="number"]');
    otherExpenses += parseFloat(costInput?.value) || 0;
  });
  let baseCost = 0;
  [...document.getElementById('cn-package-recipe-rows').querySelectorAll('tr')].forEach(row => {
    const qty = parseFloat(row.querySelector('input').value) || 0;
    const costPerUnit = parseFloat(row.querySelector('.cost-cell').textContent.replace(/[^\d.-]/g, '')) || 0;
    const subtotal = qty * costPerUnit * pax;
    row.querySelector('.subtotal-cell').textContent = cur(subtotal);
    baseCost += subtotal;
  });
  const contingencyCost = baseCost * (contingencyPct / 100);
  const wasteCost = baseCost * (wastePct / 100);
  const productionCost = baseCost * (productionPct / 100);
  const capexCost = baseCost * (capexPct / 100);
  const totalCost = baseCost + contingencyCost + wasteCost + productionCost + capexCost + venueCost + otherExpenses + manpowerCost;
  let sellingPriceExclVat;
  if (pricingMethod === 'markup') sellingPriceExclVat = totalCost * (1 + pricingValue / 100);
  else if (pricingMethod === 'margin') sellingPriceExclVat = totalCost > 0 ? totalCost / (1 - pricingValue / 100) : 0;
  else sellingPriceExclVat = totalCost * 1.3;
  const vatAmount = sellingPriceExclVat * (vatPct / 100);
  const sellingPriceInclVat = sellingPriceExclVat + vatAmount;
  const profit = sellingPriceExclVat - totalCost;
  const margin = totalCost > 0 ? (profit / sellingPriceExclVat) * 100 : 0;
  document.getElementById('cn-base-cost').textContent = cur(baseCost);
  document.getElementById('cn-contingency-cost').textContent = cur(contingencyCost);
  document.getElementById('cn-waste-cost').textContent = cur(wasteCost);
  document.getElementById('cn-production-cost').textContent = cur(productionCost);
  document.getElementById('cn-capex-cost').textContent = cur(capexCost);
  document.getElementById('cn-venue-cost').textContent = cur(venueCost);
  document.getElementById('cn-manpower-cost').textContent = cur(manpowerCost);
  document.getElementById('cn-other-expenses-cost').textContent = cur(otherExpenses);
  document.getElementById('cn-total-cost').textContent = cur(totalCost);
  document.getElementById('cn-vat-cost').textContent = cur(vatAmount);
  document.getElementById('cn-selling-price').textContent = cur(sellingPriceExclVat);
  document.getElementById('cn-selling-price-vat').textContent = cur(sellingPriceInclVat);
  document.getElementById('cn-profit').textContent = cur(profit);
  document.getElementById('cn-margin').textContent = margin.toFixed(1) + '%';
}

function saveCnPackage() {
  const name = document.getElementById('cn-pkg-name')?.value?.trim();
  if (!name) { toast('Package name is required!', 'red'); return; }
  const recipes = [...(document.getElementById('cn-package-recipe-rows')?.querySelectorAll('tr') || [])].map(row => {
    const sel = row.querySelector('select');
    const qtyInput = row.querySelector('input');
    const recipeName = sel?.value || '';
    const qtyPerPax = parseFloat(qtyInput?.value) || 0;
    const recipe = db.recipes.find(r => r.name === recipeName);
    return { name: recipeName, qtyPerPax, unit: recipe ? recipe.unit : '', costPerUnit: recipe ? calcSellPrice(recipe) : 0 };
  }).filter(r => r.name && r.qtyPerPax > 0);

  const cnPackage = {
    id: editingCnPackageId || uid(),
    name,
    description: document.getElementById('cn-pkg-desc')?.value?.trim() || '',
    tag: document.getElementById('cn-pkg-tag')?.value?.trim() || '',
    emoji: document.getElementById('cn-pkg-emoji')?.value?.trim() || '',
    image: currentPkgImageData || null,
    pax: parseFloat(document.getElementById('cn-pkg-pax')?.value) || 1,
    contingencyPct: parseFloat(document.getElementById('cn-pkg-contingency')?.value) || 0,
    wastePct: parseFloat(document.getElementById('cn-pkg-waste')?.value) || 0,
    productionPct: parseFloat(document.getElementById('cn-pkg-production')?.value) || 0,
    capexPct: parseFloat(document.getElementById('cn-pkg-capex')?.value) || 0,
    vatPct: parseFloat(document.getElementById('cn-pkg-vat')?.value) || 0,
    pricingMethod: document.getElementById('cn-pkg-pricing-method')?.value || 'markup',
    pricingValue: parseFloat(document.getElementById('cn-pkg-pricing-value')?.value) ?? 30,
    venue: document.getElementById('cn-pkg-venue')?.value?.trim() || '',
    venueCost: parseFloat(document.getElementById('cn-pkg-venue-cost')?.value) || 0,
    manpowerCount: parseFloat(document.getElementById('cn-pkg-manpower-count')?.value) || 0,
    manpowerHours: parseFloat(document.getElementById('cn-pkg-manpower-hours')?.value) || 0,
    otherExpenses: [...document.getElementById('cn-other-expenses-list').children].map(row => ({
      description: row.querySelector('input[type="text"]')?.value?.trim() || '',
      cost: parseFloat(row.querySelector('input[type="number"]')?.value) || 0
    })).filter(exp => exp.description || exp.cost > 0),
    eventDate: document.getElementById('cn-pkg-event-date')?.value || '',
    eventTime: document.getElementById('cn-pkg-event-time')?.value || '',
    isCustom: true,
    recipes
  };

  if (editingCnPackageId) {
    const idx = db.cnPackages.findIndex(p => p.id === editingCnPackageId);
    if (idx >= 0) db.cnPackages[idx] = cnPackage;
  } else { db.cnPackages.push(cnPackage); }

  save(); closeModal('cn-package-modal'); renderCnPackages(); updateBadges();
  toast(editingCnPackageId ? 'Package updated!' : 'Package saved!');
  editingCnPackageId = null;
}

function editCnPackage(id) {
  const pkg = db.cnPackages.find(p => p.id === id); if (!pkg) return;
  editingCnPackageId = id;
  document.getElementById('cn-package-modal-title').textContent = 'Edit Package';
  const fields = [
    { id: 'cn-pkg-name', value: pkg.name },
    { id: 'cn-pkg-desc', value: pkg.description ?? '' },
    { id: 'cn-pkg-tag', value: pkg.tag ?? '' },
    { id: 'cn-pkg-emoji', value: pkg.emoji ?? '' },
    { id: 'cn-pkg-pax', value: pkg.pax ?? 50 },
    { id: 'cn-pkg-contingency', value: pkg.contingencyPct ?? 5 },
    { id: 'cn-pkg-waste', value: pkg.wastePct ?? 3 },
    { id: 'cn-pkg-production', value: pkg.productionPct ?? 10 },
    { id: 'cn-pkg-capex', value: pkg.capexPct ?? 30 },
    { id: 'cn-pkg-vat', value: pkg.vatPct ?? 12 },
    { id: 'cn-pkg-pricing-method', value: pkg.pricingMethod ?? 'markup' },
    { id: 'cn-pkg-pricing-value', value: pkg.pricingValue ?? 30 },
    { id: 'cn-pkg-venue', value: pkg.venue ?? '' },
    { id: 'cn-pkg-venue-cost', value: pkg.venueCost ?? 0 },
    { id: 'cn-pkg-manpower-count', value: pkg.manpowerCount ?? 0 },
    { id: 'cn-pkg-manpower-hours', value: pkg.manpowerHours ?? 0 },
    { id: 'cn-pkg-event-date', value: pkg.eventDate ?? '' },
    { id: 'cn-pkg-event-time', value: pkg.eventTime ?? '' }
  ];
  fields.forEach(({ id, value }) => { const el = document.getElementById(id); if (el) el.value = value; });
  // Populate other expenses
  const otherExpensesList = document.getElementById('cn-other-expenses-list');
  otherExpensesList.innerHTML = '';
  if (pkg.otherExpenses && Array.isArray(pkg.otherExpenses)) {
    pkg.otherExpenses.forEach(exp => addOtherExpenseRow(exp));
  }
  // Restore image
  currentPkgImageData = pkg.image || null;
  const img = document.getElementById('pkg-img-preview');
  const placeholder = document.getElementById('pkg-img-placeholder');
  if (pkg.image) { img.src = pkg.image; img.style.display = 'block'; placeholder.style.display = 'none'; }
  else { img.src = ''; img.style.display = 'none'; placeholder.style.display = 'flex'; }
  const recipeRowsEl = document.getElementById('cn-package-recipe-rows');
  if (recipeRowsEl) recipeRowsEl.innerHTML = '';
  (pkg.recipes || []).forEach(recipe => addCnPackageRecipeRow(recipe));
  updateCnPackageCostPreview();
  showModal('cn-package-modal');
}

function deleteCnPackage(id) {
  if (!confirm('Delete this package?')) return;
  db.cnPackages = db.cnPackages.filter(p => p.id !== id);
  save(); renderCnPackages(); updateBadges();
  toast('Package deleted.', 'red');
}

function editCnPackageFromView() {
  if (!viewingCnPackageId) return;
  closeModal('view-cn-package-modal');
  editCnPackage(viewingCnPackageId);
}

function copyCnPackageFromView() {
  if (!viewingCnPackageId) return;
  copyCnPackage(viewingCnPackageId);
  closeModal('view-cn-package-modal');
}

function copyCnPackage(id) {
  const pkg = db.cnPackages.find(p => p.id === id); if (!pkg) return;
  editingCnPackageId = null;
  document.getElementById('cn-package-modal-title').textContent = 'New Package (Copy)';
  const fields = [
    { id: 'cn-pkg-name', value: 'Copy of ' + pkg.name },
    { id: 'cn-pkg-desc', value: pkg.description ?? '' },
    { id: 'cn-pkg-tag', value: pkg.tag ?? '' },
    { id: 'cn-pkg-emoji', value: pkg.emoji ?? '' },
    { id: 'cn-pkg-pax', value: pkg.pax ?? 50 },
    { id: 'cn-pkg-contingency', value: pkg.contingencyPct ?? 5 },
    { id: 'cn-pkg-waste', value: pkg.wastePct ?? 3 },
    { id: 'cn-pkg-production', value: pkg.productionPct ?? 10 },
    { id: 'cn-pkg-capex', value: pkg.capexPct ?? 30 },
    { id: 'cn-pkg-vat', value: pkg.vatPct ?? 12 },
    { id: 'cn-pkg-pricing-method', value: pkg.pricingMethod ?? 'markup' },
    { id: 'cn-pkg-pricing-value', value: pkg.pricingValue ?? 30 },
    { id: 'cn-pkg-venue', value: pkg.venue ?? '' },
    { id: 'cn-pkg-venue-cost', value: pkg.venueCost ?? 0 },
    { id: 'cn-pkg-other-expenses', value: pkg.otherExpenses ?? 0 },
    { id: 'cn-pkg-event-date', value: '' },
    { id: 'cn-pkg-event-time', value: '' }
  ];
  fields.forEach(({ id, value }) => { const el = document.getElementById(id); if (el) el.value = value; });
  currentPkgImageData = pkg.image || null;
  const img = document.getElementById('pkg-img-preview');
  const placeholder = document.getElementById('pkg-img-placeholder');
  if (pkg.image) { img.src = pkg.image; img.style.display = 'block'; placeholder.style.display = 'none'; }
  else { img.src = ''; img.style.display = 'none'; placeholder.style.display = 'flex'; }
  const recipeRowsEl = document.getElementById('cn-package-recipe-rows');
  if (recipeRowsEl) recipeRowsEl.innerHTML = '';
  (pkg.recipes || []).forEach(recipe => addCnPackageRecipeRow(recipe));
  updateCnPackageCostPreview();
  showModal('cn-package-modal');
}

// ===== DEFAULT TEMPLATES =====
function showDefaultTemplates() {
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = DEFAULT_TEMPLATES.map(tpl => `
    <div class="template-card" onclick="useTemplate('${tpl.id}')">
      <div class="template-card-banner ${tpl.bannerClass}">
        <span style="font-size:52px">${tpl.emoji}</span>
      </div>
      <div class="template-card-body">
        <div class="template-card-name">${tpl.name}</div>
        <div class="template-card-desc">${tpl.description}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="tag tag-amber" style="font-size:10px">${tpl.tag}</span>
          <span class="tag tag-blue" style="font-size:10px">${tpl.pax} pax default</span>
        </div>
      </div>
      <div class="template-card-footer">
        <span>Markup: ${tpl.pricingValue}%</span>
        <span style="color:var(--accent);font-weight:600;font-size:12px">Use Template →</span>
      </div>
    </div>`).join('');
  showModal('default-templates-modal');
}

function useTemplate(tplId) {
  const tpl = DEFAULT_TEMPLATES.find(t => t.id === tplId);
  if (!tpl) return;
  closeModal('default-templates-modal');
  editingCnPackageId = null;
  document.getElementById('cn-package-modal-title').textContent = 'New Package from Template';
  const fields = [
    { id: 'cn-pkg-name', value: tpl.name },
    { id: 'cn-pkg-desc', value: tpl.description },
    { id: 'cn-pkg-tag', value: tpl.tag },
    { id: 'cn-pkg-emoji', value: tpl.emoji },
    { id: 'cn-pkg-pax', value: tpl.pax },
    { id: 'cn-pkg-contingency', value: tpl.contingencyPct },
    { id: 'cn-pkg-waste', value: tpl.wastePct },
    { id: 'cn-pkg-production', value: tpl.productionPct },
    { id: 'cn-pkg-capex', value: tpl.capexPct },
    { id: 'cn-pkg-vat', value: tpl.vatPct },
    { id: 'cn-pkg-pricing-method', value: tpl.pricingMethod },
    { id: 'cn-pkg-pricing-value', value: tpl.pricingValue },
    { id: 'cn-pkg-venue', value: '' },
    { id: 'cn-pkg-venue-cost', value: tpl.venueCost },
    { id: 'cn-pkg-manpower-count', value: 0 },
    { id: 'cn-pkg-manpower-hours', value: 0 },
    { id: 'cn-pkg-event-date', value: '' },
    { id: 'cn-pkg-event-time', value: '' }
  ];
  fields.forEach(({ id, value }) => { const el = document.getElementById(id); if (el) el.value = value; });
  // Clear other expenses for templates
  const otherExpensesList = document.getElementById('cn-other-expenses-list');
  otherExpensesList.innerHTML = '';
  currentPkgImageData = null;
  const img = document.getElementById('pkg-img-preview');
  const placeholder = document.getElementById('pkg-img-placeholder');
  if (img) { img.src = ''; img.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'flex';
  const recipeRowsEl = document.getElementById('cn-package-recipe-rows');
  if (recipeRowsEl) recipeRowsEl.innerHTML = '';
  updateCnPackageCostPreview();
  showModal('cn-package-modal');
  toast(`Template "${tpl.name}" loaded! Add recipes and customize.`, 'amber');
}

// ===== VIEW CN PACKAGE =====
function viewCnPackage(id) {
  const pkg = db.cnPackages.find(p => p.id === id); if (!pkg) return;
  viewingCnPackageId = id;
  const t = calcCnPackageTotals(pkg);

  // Update banner
  const banner = document.getElementById('view-pkg-banner');
  const emojiEl = document.getElementById('view-pkg-emoji-large');
  emojiEl.textContent = pkg.emoji || '🍽️';

  if (pkg.image) {
    let heroImg = banner.querySelector('.pkg-hero-img');
    if (!heroImg) { heroImg = document.createElement('img'); heroImg.className = 'pkg-hero-img'; banner.insertBefore(heroImg, banner.firstChild); }
    heroImg.src = pkg.image;
  } else {
    const heroImg = banner.querySelector('.pkg-hero-img');
    if (heroImg) heroImg.remove();
  }

  // Tag badge
  const tagEl = document.getElementById('view-pkg-tag-badge');
  tagEl.innerHTML = pkg.tag ? `<span class="tag tag-amber" style="font-size:11px">${pkg.tag}</span>` : '';

  document.getElementById('view-cn-package-title').textContent = pkg.name;
  document.getElementById('view-pkg-desc').textContent = pkg.description || '';

  // Event info
  let eventHtml = '';
  if (pkg.eventDate) {
    const dateStr = new Date(pkg.eventDate + 'T' + (pkg.eventTime || '00:00')).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = pkg.eventTime || '';
    eventHtml = `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--blue);margin-top:6px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      ${dateStr}${timeStr ? ' at ' + timeStr : ''}</div>`;
  }

  const marginColor = t.margin >= 30 ? 'var(--accent)' : t.margin >= 18 ? 'var(--amber)' : 'var(--red)';
  const marginTagClass = t.margin >= 30 ? 'tag-green' : t.margin >= 18 ? 'tag-amber' : 'tag-red';

  document.getElementById('view-cn-package-body').innerHTML = `
    ${eventHtml}
    <div class="view-pkg-stat-row" style="margin-top:16px">
      <div class="view-pkg-stat">
        <div class="view-pkg-stat-label">Pax</div>
        <div class="view-pkg-stat-val">${pkg.pax || 1}</div>
      </div>
      <div class="view-pkg-stat">
        <div class="view-pkg-stat-label">Total Cost</div>
        <div class="view-pkg-stat-val">${cur(t.totalCost)}</div>
      </div>
      <div class="view-pkg-stat">
        <div class="view-pkg-stat-label">Selling Price</div>
        <div class="view-pkg-stat-val" style="color:var(--accent)">${cur(t.sellingPriceInclVat)}</div>
      </div>
    </div>

    ${pkg.venue ? `<div class="view-pkg-detail-grid">
      <div class="view-pkg-detail-item"><div class="view-pkg-detail-label">Venue</div><div class="view-pkg-detail-val">${pkg.venue}</div></div>
      <div class="view-pkg-detail-item"><div class="view-pkg-detail-label">Venue Cost</div><div class="view-pkg-detail-val">${cur(pkg.venueCost || 0)}</div></div>
    </div>` : ''}

    <div class="section-divider">Recipes Included</div>
    ${(pkg.recipes || []).length ? (pkg.recipes || []).map(r => `
      <div class="view-pkg-recipe-row">
        <div>
          <div style="font-weight:500;color:var(--text);font-size:13px">${r.name}</div>
          <div style="font-size:11px;color:var(--text3)">${r.qtyPerPax} × ${r.unit || 'pcs'} per pax</div>
        </div>
        <div style="text-align:right">
          <div class="td-mono" style="color:var(--accent)">${cur(r.qtyPerPax * r.costPerUnit * (pkg.pax || 1))}</div>
          <div style="font-size:10px;color:var(--text3)">${cur(r.costPerUnit)}/unit</div>
        </div>
      </div>`).join('') : '<div style="color:var(--text3);font-size:13px;padding:12px 0">No recipes added yet</div>'}

    ${(pkg.otherExpenses && Array.isArray(pkg.otherExpenses) && pkg.otherExpenses.length) ? `
    <div class="section-divider">Other Expenses Breakdown</div>
    ${pkg.otherExpenses.map(exp => `
      <div class="view-pkg-recipe-row">
        <div style="font-weight:500;color:var(--text);font-size:13px">${exp.description || 'Unnamed'}</div>
        <div class="td-mono" style="color:var(--accent)">${cur(exp.cost || 0)}</div>
      </div>`).join('')}` : ''}

    <div class="section-divider">Cost Breakdown</div>
    <div class="cost-summary" style="margin-top:0">
      <div class="cost-row"><span class="cost-label">Base Recipe Cost</span><span class="cost-val">${cur(t.baseCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Contingency (${pkg.contingencyPct || 0}%)</span><span class="cost-val">${cur(t.contingencyCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Waste (${pkg.wastePct || 0}%)</span><span class="cost-val">${cur(t.wasteCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Production (${pkg.productionPct || 0}%)</span><span class="cost-val">${cur(t.productionCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Capex (${pkg.capexPct || 0}%)</span><span class="cost-val">${cur(t.capexCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Venue</span><span class="cost-val">${cur(t.venueCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Manpower</span><span class="cost-val">${cur((pkg.manpowerCount || 0) * (pkg.manpowerHours || 0) * (455 / 8))}</span></div>
      <div class="cost-row"><span class="cost-label">Other Expenses</span><span class="cost-val">${cur(t.otherExpenses)}</span></div>
      <div class="cost-row total"><span class="cost-label">Total Cost</span><span class="cost-val">${cur(t.totalCost)}</span></div>
      <div class="cost-row"><span class="cost-label">VAT (${pkg.vatPct || 0}%)</span><span class="cost-val">${cur(t.vatAmount)}</span></div>
      <div class="cost-row"><span class="cost-label">Selling Price (excl. VAT)</span><span class="cost-val">${cur(t.sellingPriceExclVat)}</span></div>
      <div class="cost-row"><span class="cost-label">Selling Price (incl. VAT)</span><span class="cost-val" style="color:var(--accent)">${cur(t.sellingPriceInclVat)}</span></div>
      <div class="cost-row"><span class="cost-label">Profit</span><span class="cost-val" style="color:${t.profit >= 0 ? 'var(--accent)' : 'var(--red)'}">${cur(t.profit)}</span></div>
      <div class="cost-row"><span class="cost-label">Margin</span>
        <span class="cost-val"><span class="tag ${marginTagClass}">${t.margin.toFixed(1)}%</span></span>
      </div>
    </div>`;

  showModal('view-cn-package-modal');
}

// ===== RENDER CN PACKAGES (Cards) =====
function renderCnPackages() {
  const grid = document.getElementById('cn-package-cards');
  if (!grid) return;
  const search = (document.getElementById('cn-search')?.value || '').toLowerCase();
  const filterType = document.getElementById('cn-filter-type')?.value || '';
  let list = db.cnPackages.filter(pkg => {
    const matchSearch = pkg.name.toLowerCase().includes(search) || (pkg.tag || '').toLowerCase().includes(search);
    const matchType = !filterType || (filterType === 'custom' && pkg.isCustom) || (filterType === 'template' && !pkg.isCustom);
    return matchSearch && matchType;
  });

  if (!list.length) {
    grid.innerHTML = `<div class="pkg-empty-state">
      <div class="big-icon">📦</div>
      <h3>No packages yet</h3>
      <p>Create your first package or start from a template</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:8px">
        <button class="btn btn-ghost" onclick="showDefaultTemplates()">Browse Templates</button>
        <button class="btn btn-primary" onclick="showModal('cn-package-modal')">+ New Package</button>
      </div>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(pkg => {
    const t = calcCnPackageTotals(pkg);
    const marginClass = t.margin >= 30 ? 'tag-green' : t.margin >= 18 ? 'tag-amber' : 'tag-red';
    const bannerClass = getBannerClass(pkg);

    let bannerHtml = '';
    if (pkg.image) {
      bannerHtml = `<img src="${pkg.image}" class="pkg-card-img" alt="${pkg.name}">`;
    } else {
      bannerHtml = `<div class="pkg-card-banner ${bannerClass}">
        <span>${pkg.emoji || '🍽️'}</span>
      </div>`;
    }

    const isUpcoming = pkg.eventDate && new Date(pkg.eventDate + 'T' + (pkg.eventTime || '00:00')) > new Date();
    const eventBadge = isUpcoming ? `<div style="position:absolute;top:12px;right:12px;background:var(--blue);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;z-index:2">Upcoming</div>` : '';

    return `<div class="pkg-card" onclick="viewCnPackage('${pkg.id}')">
      <div style="position:relative">
        ${bannerHtml}
        ${eventBadge}
      </div>
      <div class="pkg-card-body">
        ${pkg.tag ? `<div class="pkg-card-tag">${pkg.tag}</div>` : ''}
        <div class="pkg-card-name">${pkg.name}</div>
        ${pkg.description ? `<div class="pkg-card-desc">${pkg.description}</div>` : ''}
        <div class="pkg-card-meta">
          <div class="pkg-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${pkg.pax || 1} pax
          </div>
          <div class="pkg-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg>
            ${(pkg.recipes || []).length} dish${(pkg.recipes || []).length !== 1 ? 'es' : ''}
          </div>
          ${pkg.eventDate ? `<div class="pkg-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${new Date(pkg.eventDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>` : ''}
        </div>
      </div>
      <div class="pkg-card-footer">
        <div>
          <span class="pkg-card-price-label">Selling Price</span>
          <span class="pkg-card-price">${cur(t.sellingPriceInclVat)}</span>
        </div>
        <span class="tag ${marginClass} pkg-card-margin">${t.margin.toFixed(1)}%</span>
      </div>
      <div class="pkg-card-actions" onclick="event.stopPropagation()">
        <button class="action-btn action-view" onclick="viewCnPackage('${pkg.id}')">View</button>
        <button class="action-btn action-edit" onclick="editCnPackage('${pkg.id}')">Edit</button>
        <button class="action-btn action-view" onclick="copyCnPackage('${pkg.id}')">Copy</button>
        <button class="action-btn action-del" onclick="deleteCnPackage('${pkg.id}')">Del</button>
      </div>
    </div>`;
  }).join('');
}

function getBannerClass(pkg) {
  const tag = (pkg.tag || '').toLowerCase();
  if (tag.includes('wedding') || tag.includes('debut')) return 'banner-wedding';
  if (tag.includes('birthday') || tag.includes('bday')) return 'banner-birthday';
  if (tag.includes('corporate') || tag.includes('office')) return 'banner-corporate';
  if (tag.includes('fiesta') || tag.includes('holiday')) return 'banner-fiesta';
  if (tag.includes('intimate') || tag.includes('private')) return 'banner-intimate';
  return 'banner-default';
}

// ===== UI EVENT LISTENERS & INIT =====
let _initialized = false;
function performInitialization() {
  if (_initialized) return;
  _initialized = true;
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') document.body.classList.add('dark-theme');
  const loginInput = document.getElementById('login-password');
  if (loginInput) loginInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') authenticateLogin(); });
  if (!initializeSession()) { hideMainApp(); return; }
  (async () => {
    await load();
    refreshRecipeNameLists();
    renderDashboard();
    updateBadges();
  })();
}

document.addEventListener('DOMContentLoaded', performInitialization);
if (document.readyState !== 'loading') performInitialization();