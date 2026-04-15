// ===== UNIT CONVERSION SYSTEM =====
const unitConversions = {
  // Weight (base: grams)
  'g': { base: 'grams', factor: 1 },
  'kg': { base: 'grams', factor: 1000 },
  'oz': { base: 'grams', factor: 28.3495 },
  'lb': { base: 'grams', factor: 453.592 },
  // Volume (base: milliliters)
  'ml': { base: 'ml', factor: 1 },
  'L': { base: 'ml', factor: 1000 },
  'tsp': { base: 'ml', factor: 4.92892 },
  'tbsp': { base: 'ml', factor: 14.7868 },
  'cup': { base: 'ml', factor: 236.588 },
  // Count (base: pieces)
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
  // Case-insensitive unit lookup
  const findUnit = (unit) => {
    if (!unit) return null;
    const normalizedUnit = unit.toLowerCase();
    for (const [key, value] of Object.entries(unitConversions)) {
      if (key.toLowerCase() === normalizedUnit) {
        return value;
      }
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
const INGREDIENTS_PER_PAGE = 7;
const DASHBOARD_RECIPES_PER_PAGE = 10;
let dashCurrentPage = 1;
let ingCurrentPage = 1;
let editingRecipeId = null;
let viewingRecipeId = null;
let editingIngId = null;
let editingPkgId = null;
let editingCnPackageId = null;
let viewingCnPackageId = null;

// ===== AUTHENTICATION & SESSION =====
const SESSION_PASSWORD = 'fo.support';
const SESSION_DURATION = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
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
  
  // Initialize app after login
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
    if (!checkSessionValidity()) {
      signOutSession();
      return;
    }
  }, 60000); // Check every minute
}

function updateSessionDisplay() {
  // Kept for potential future use but not called
  const remaining = SESSION_DURATION - (Date.now() - sessionStartTime);
  if (remaining <= 0) {
    signOutSession();
  }
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
  if (confirm('Sign out? You\'ll need to log back in.')) {
    signOutSession();
  }
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
    console.log('Save successful to Firestore');
    updateBadges();
  } catch (e) {
    console.error('Save failed', e);
    toast('Save failed!', 'red');
  }
}
async function load() {
  try {
    const doc = await db_firestore.collection('data').doc('db').get();
    if (doc.exists) {
      db = doc.data();
      console.log('Load successful from Firestore', db);
    } else {
      console.log('No data in Firestore, using defaults');
    }
  } catch (e) {
    console.error('Load failed', e);
  }
  // Defaults
  if (!db.settings) db.settings = {};
  const def = {bizName:'My Food Business',currency:'₱',markup:30,targetMargin:30,monthlyBatches:100,vat:12,pricingMethod:'markup',multiplier:3,theme:'light'};
  for (const k in def) if (db.settings[k] === undefined) db.settings[k] = def[k];
  if (!db.recipes) db.recipes = [];
  if (!db.ingredients) db.ingredients = [];
  if (!db.packaging) db.packaging = [];
  if (!db.cnPackages) db.cnPackages = [];
  
  // Normalize units to lowercase for case-insensitive conversion
  db.ingredients.forEach(i => { if (i.unit) i.unit = i.unit.toLowerCase(); });
  db.packaging.forEach(p => { if (p.unit) p.unit = p.unit.toLowerCase(); });
  db.recipes.forEach(r => { if (r.unit) r.unit = r.unit.toLowerCase(); });
  
  // Theme persistence with localStorage fallback
  const savedTheme = localStorage.getItem('theme') || db.settings.theme;
  if (savedTheme === 'light') document.body.classList.add('light-theme');
  updateThemeButton();
  updateBadges();
}
function toggleTheme() {
  const body = document.body;
  const isLight = body.classList.toggle('light-theme');
  db.settings.theme = isLight ? 'light' : 'dark';
  localStorage.setItem('theme', db.settings.theme);
  save();
  updateThemeButton();
}
function updateThemeButton() {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    const isLight = document.body.classList.contains('light-theme');
    btn.textContent = isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme';
  }
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ===== NAV =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => { if (n.getAttribute('onclick') === `showPage('${id}')`) n.classList.add('active'); });
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
  if (id === 'recipe-modal') { if (!editingRecipeId) resetRecipeModal(); }
  if (id === 'cn-package-modal') { if (!editingCnPackageId) resetCnPackageModal(); }
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'recipe-modal') { editingRecipeId = null; resetRecipeModal(); }
  if (id === 'ingredient-modal') { editingIngId = null; resetIngModal(); }
  if (id === 'pkg-modal') { editingPkgId = null; resetPkgModal(); }
  if (id === 'cn-package-modal') { editingCnPackageId = null; resetCnPackageModal(); }
}

// ===== TOAST =====
function toast(msg, type='green') {
  const el = document.getElementById('toast');
  const dot = document.getElementById('toast-dot');
  document.getElementById('toast-msg').textContent = msg;
  dot.className = 'toast-dot ' + type;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function showSnackbar(message, type = 'success') {
  // Map snackbar types to toast types
  const toastType = type === 'success' ? 'green' : type === 'error' ? 'red' : 'amber';
  toast(message, toastType);
}

// ===== CURRENCY =====
function cur(n) { return (db.settings.currency || '₱') + parseFloat(n||0).toFixed(2); }

// ===== RECIPE LOGIC =====
function calcRecipeCosts(recipe) {
  const ingCost = (recipe.ingredients||[]).reduce((s,r) => s + calcIngredientCost(r.qty, r.unit, r.name), 0);
  const pkgCost = (recipe.packaging||[]).reduce((s,r) => s + (parseFloat(r.qty)||0)*(parseFloat(r.costPerUnit)||0), 0);
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
  if (method === 'markup') return baseCost * (1 + val/100);
  if (method === 'margin') return baseCost / (1 - val/100);
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
  ['r-name','r-category','r-unit','r-notes','r-sell-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const batchEl = document.getElementById('r-batch');
  if (batchEl) batchEl.value = 1;
  const opexEl = document.getElementById('r-opex');
  if (opexEl) opexEl.value = 0;
  const laborEl = document.getElementById('r-labor');
  if (laborEl) laborEl.value = 0;
  const pricingValueEl = document.getElementById('r-pricing-value');
  if (pricingValueEl) pricingValueEl.value = db.settings.markup || 30;
  const pricingMethodEl = document.getElementById('r-pricing-method');
  if (pricingMethodEl) pricingMethodEl.value = db.settings.pricingMethod || 'markup';
  const vatCheckbox = document.getElementById('r-include-vat');
  if (vatCheckbox) vatCheckbox.checked = false;
  document.getElementById('recipe-ing-rows').innerHTML = '';
  document.getElementById('recipe-pkg-rows').innerHTML = '';
  updateRecipeCostPreview();
}
function addIngredientRow(data) {
  const tbody = document.getElementById('recipe-ing-rows');
  const row = document.createElement('tr');
  const ingOptions = db.ingredients.map(i => `<option value="${i.name}" data-cost="${i.costPerUnit}" data-unit="${i.unit}">${i.name} (${i.unit})</option>`).join('');
  const unitOptions = ['g', 'kg', 'ml', 'L', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'pcs'].map(u => `<option value="${u}" ${data&&data.unit===u?'selected':''}>${u}</option>`).join('');
  const isExisting = data && db.ingredients.find(i => i.name === data.name);
  const costValue = data && data.costPerUnit ? data.costPerUnit : '';
  
  row.innerHTML = `
    <td><select onchange="fillIngCost(this)" style="min-width:180px">
      <option value="">-- Select or type --</option>
      ${ingOptions}
    </select>
    <input list="recipe-ingredient-list" type="text" placeholder="or type ingredient" style="margin-top:4px;display:block" class="ing-name-input" value="${data&&data.name?data.name:''}" oninput="updateRecipeCostPreview(); updateIngCostEditability(this); filterIngredientOptions(this)"></td>
    <td><input type="number" value="${data&&data.qty?data.qty:''}" step="0.01" min="0" placeholder="0" oninput="updateRecipeCostPreview()" style="width:70px"></td>
    <td><select style="width:70px" onchange="updateRecipeCostPreview()">${unitOptions}</select></td>
    <td><input type="number" class="ing-cost-input" value="${costValue}" step="0.01" min="0" placeholder="0.00" style="width:80px;${isExisting?'background:var(--surface3);color:var(--text3);cursor:not-allowed;':''}font-size:12px" oninput="updateRecipeCostPreview()" ${isExisting?'disabled':''}></td>
    <td class="td-mono subtotal-cell">₱0.00</td>
    <td><button class="remove-row" onclick="this.closest('tr').remove();updateRecipeCostPreview()">✕</button></td>
  `;
  tbody.appendChild(row);
  if (data) updateRecipeCostPreview();
  if (data && data.name) {
    const sel = row.querySelector('select');
    const opt = [...sel.options].find(o => o.value === data.name);
    if (opt) sel.value = data.name;
  }
}
function updateIngCostEditability(input) {
  const ingName = input.value.trim();
  const row = input.closest('tr');
  const costInput = row.querySelector('.ing-cost-input');
  const isExisting = db.ingredients.find(i => i.name === ingName);
  
  if (isExisting) {
    costInput.disabled = true;
    costInput.style.background = 'var(--surface3)';
    costInput.style.color = 'var(--text3)';
    costInput.style.cursor = 'not-allowed';
    costInput.value = isExisting.costPerUnit;
  } else {
    costInput.disabled = false;
    costInput.style.background = '';
    costInput.style.color = '';
    costInput.style.cursor = '';
  }
}
function fillIngCost(sel) {
  const opt = sel.options[sel.selectedIndex];
  const row = sel.closest('tr');
  if (opt.value) {
    const inputs = row.querySelectorAll('input');
    const selects = row.querySelectorAll('select');
    const nameInput = row.querySelector('.ing-name-input');
    nameInput.value = opt.value;
    inputs[1].value = '';
    selects[1].value = opt.dataset.unit || 'g';
    const costInput = row.querySelector('.ing-cost-input');
    costInput.value = opt.dataset.cost || '';
    costInput.disabled = true;
    costInput.style.background = 'var(--surface3)';
    costInput.style.color = 'var(--text3)';
    costInput.style.cursor = 'not-allowed';
  }
  updateRecipeCostPreview();
}
function addPackagingRow(data) {
  const tbody = document.getElementById('recipe-pkg-rows');
  const row = document.createElement('tr');
  const pkgOptions = db.packaging.map(p => `<option value="${p.name}" data-cost="${p.costPerUnit}" data-unit="${p.unit}">${p.name} (${p.unit})</option>`).join('');
  const unitOptions = ['pcs', 'pack', 'roll', 'box', 'set', 'bag'].map(u => `<option value="${u}" ${data&&data.unit===u?'selected':''}>${u}</option>`).join('');
  const isExisting = data && db.packaging.find(p => p.name === data.name);
  const costValue = data && data.costPerUnit ? data.costPerUnit : '';
  
  row.innerHTML = `
    <td><select onchange="fillPkgCost(this)" style="min-width:180px">
      <option value="">-- Select or type --</option>
      ${pkgOptions}
    </select>
    <input list="recipe-packaging-list" type="text" placeholder="or type item" style="margin-top:4px;display:block" class="pkg-name-input" value="${data&&data.name?data.name:''}" oninput="updateRecipeCostPreview(); updatePkgCostEditability(this); filterPackagingOptions(this)"></td>
    <td><input type="number" value="${data&&data.qty?data.qty:''}" step="0.01" min="0" placeholder="0" oninput="updateRecipeCostPreview()" style="width:70px"></td>
    <td><select style="width:80px" onchange="updateRecipeCostPreview()">${unitOptions}</select></td>
    <td><input type="number" class="pkg-cost-input" value="${costValue}" step="0.01" min="0" placeholder="0.00" style="width:80px;${isExisting?'background:var(--surface3);color:var(--text3);cursor:not-allowed;':''}font-size:12px" oninput="updateRecipeCostPreview()" ${isExisting?'disabled':''}></td>
    <td class="td-mono subtotal-cell">₱0.00</td>
    <td><button class="remove-row" onclick="this.closest('tr').remove();updateRecipeCostPreview()">✕</button></td>
  `;
  tbody.appendChild(row);
  if (data) updateRecipeCostPreview();
}
function updatePkgCostEditability(input) {
  const pkgName = input.value.trim();
  const row = input.closest('tr');
  const costInput = row.querySelector('.pkg-cost-input');
  const isExisting = db.packaging.find(p => p.name === pkgName);
  
  if (isExisting) {
    costInput.disabled = true;
    costInput.style.background = 'var(--surface3)';
    costInput.style.color = 'var(--text3)';
    costInput.style.cursor = 'not-allowed';
    costInput.value = isExisting.costPerUnit;
  } else {
    costInput.disabled = false;
    costInput.style.background = '';
    costInput.style.color = '';
    costInput.style.cursor = '';
  }
}
function fillPkgCost(sel) {
  const opt = sel.options[sel.selectedIndex];
  const row = sel.closest('tr');
  if (opt.value) {
    const selects = row.querySelectorAll('select');
    const nameInput = row.querySelector('.pkg-name-input');
    nameInput.value = opt.value;
    const inputs = row.querySelectorAll('input');
    inputs[1].value = '';
    selects[1].value = opt.dataset.unit || 'pcs';
    const costInput = row.querySelector('.pkg-cost-input');
    costInput.value = opt.dataset.cost || '';
    costInput.disabled = true;
    costInput.style.background = 'var(--surface3)';
    costInput.style.color = 'var(--text3)';
    costInput.style.cursor = 'not-allowed';
  }
  updateRecipeCostPreview();
}
function refreshRecipeNameLists() {
  const ingList = document.getElementById('recipe-ingredient-list');
  const pkgList = document.getElementById('recipe-packaging-list');
  if (ingList) {
    ingList.innerHTML = db.ingredients.map(i => `<option value="${i.name}"></option>`).join('');
  }
  if (pkgList) {
    pkgList.innerHTML = db.packaging.map(p => `<option value="${p.name}"></option>`).join('');
  }
}
function filterIngredientOptions(input) {
  const row = input.closest('tr');
  const filter = (input.value||'').toLowerCase();
  const select = row.querySelector('select');
  if (!select) return;
  const options = db.ingredients
    .filter(i => i.name.toLowerCase().includes(filter))
    .map(i => `<option value="${i.name}" data-cost="${i.costPerUnit}" data-unit="${i.unit}">${i.name} (${i.unit})</option>`)
    .join('');
  select.innerHTML = `<option value="">-- Select or type --</option>${options}`;
  const exact = db.ingredients.find(i => i.name.toLowerCase() === filter);
  if (exact) {
    select.value = exact.name;
    const unitSelect = row.querySelectorAll('select')[1];
    if (unitSelect) unitSelect.value = exact.unit || 'g';
    const costInput = row.querySelector('.ing-cost-input');
    if (costInput) {
      costInput.value = exact.costPerUnit || 0;
      costInput.disabled = true;
      costInput.style.background = 'var(--surface3)';
      costInput.style.color = 'var(--text3)';
      costInput.style.cursor = 'not-allowed';
    }
  } else {
    const costInput = row.querySelector('.ing-cost-input');
    if (costInput) {
      costInput.disabled = false;
      costInput.style.background = '';
      costInput.style.color = '';
      costInput.style.cursor = '';
    }
  }
}
function filterPackagingOptions(input) {
  const row = input.closest('tr');
  const filter = (input.value||'').toLowerCase();
  const select = row.querySelector('select');
  if (!select) return;
  const options = db.packaging
    .filter(p => p.name.toLowerCase().includes(filter))
    .map(p => `<option value="${p.name}" data-cost="${p.costPerUnit}" data-unit="${p.unit}">${p.name} (${p.unit})</option>`)
    .join('');
  select.innerHTML = `<option value="">-- Select or type --</option>${options}`;
  const exact = db.packaging.find(p => p.name.toLowerCase() === filter);
  if (exact) {
    select.value = exact.name;
    const unitSelect = row.querySelectorAll('select')[1];
    if (unitSelect) unitSelect.value = exact.unit || 'pcs';
    const costInput = row.querySelector('.pkg-cost-input');
    if (costInput) {
      costInput.value = exact.costPerUnit || 0;
      costInput.disabled = true;
      costInput.style.background = 'var(--surface3)';
      costInput.style.color = 'var(--text3)';
      costInput.style.cursor = 'not-allowed';
    }
  } else {
    const costInput = row.querySelector('.pkg-cost-input');
    if (costInput) {
      costInput.disabled = false;
      costInput.style.background = '';
      costInput.style.color = '';
      costInput.style.cursor = '';
    }
  }
}
function getRowData(tbody, isIngredient = false) {
  return [...tbody.querySelectorAll('tr')].map(row => {
    const inputs = row.querySelectorAll('input');
    const selects = row.querySelectorAll('select');
    const name = inputs[0].value;
    const qty = parseFloat(inputs[1].value)||0;
    
    let unit = '';
    let costPerUnit = 0;
    
    if (isIngredient && selects.length > 1) {
      // Ingredient row with unit dropdown (2nd select)
      unit = selects[selects.length - 1].value;
      const costInput = row.querySelector('.ing-cost-input');
      if (costInput) costPerUnit = parseFloat(costInput.value) || 0;
    } else if (!isIngredient && selects.length > 1) {
      // Packaging row with unit dropdown (2nd select)
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
  
  // Update ingredient subtotals with unit conversion
  [...document.getElementById('recipe-ing-rows').querySelectorAll('tr')].forEach((row, i) => {
    const r = ingRows[i]; if (!r) return;
    const st = row.querySelector('.subtotal-cell');
    if (st) {
      const cost = calcIngredientCost(r.qty, r.unit, r.name);
      st.textContent = cur(cost);
    }
  });
  
  // Update packaging subtotals
  [...document.getElementById('recipe-pkg-rows').querySelectorAll('tr')].forEach((row, i) => {
    const r = pkgRows[i]; if (!r) return;
    const st = row.querySelector('.subtotal-cell');
    if (st) st.textContent = cur(r.qty * r.costPerUnit);
  });
  
  const ingCost = ingRows.reduce((s,r) => s + calcIngredientCost(r.qty, r.unit, r.name), 0);
  const pkgCost = pkgRows.reduce((s,r) => s + r.qty*r.costPerUnit, 0);
  const baseTotal = ingCost + pkgCost;
  const includeVat = document.getElementById('r-include-vat')?.checked;
  const vatCost = includeVat ? baseTotal * 0.12 : 0;
  const total = baseTotal + vatCost;
  
  // Pricing
  const method = document.getElementById('r-pricing-method').value;
  const pval = parseFloat(document.getElementById('r-pricing-value').value)||0;
  const manualPrice = parseFloat(document.getElementById('r-sell-price').value)||0;
  let sellPrice = manualPrice || 0;
  if (!sellPrice) {
    if (method === 'markup') sellPrice = baseTotal * (1 + pval/100);
    else if (method === 'margin') sellPrice = baseTotal > 0 ? baseTotal / (1 - pval/100) : 0;
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
  meter.style.background = margin >= tgt ? 'var(--accent)' : margin >= tgt*0.6 ? 'var(--amber)' : 'var(--red)';
  // Update pricing label
  const labels = {markup:'Markup (%)',margin:'Target Margin (%)',multiplier:'Multiplier (x)',manual:'Manual Price (₱)'};
  document.getElementById('r-pricing-label').textContent = labels[method] || 'Value';
}
async function saveRecipe() {
  const name = document.getElementById('r-name').value.trim();
  if (!name) { toast('Recipe name is required!', 'red'); return; }
  
  const ingredients = getRowData(document.getElementById('recipe-ing-rows'), true);
  const packaging = getRowData(document.getElementById('recipe-pkg-rows'), false);
  
  // Auto-add new ingredients to master list
  ingredients.forEach(ing => {
    if (ing.name && ing.costPerUnit > 0) {
      const exists = db.ingredients.find(i => i.name === ing.name);
      if (!exists) {
        db.ingredients.push({
          id: uid(),
          name: ing.name,
          category: 'Imported from Recipe',
          quantity: ing.qty || 1,
          unit: ing.unit,
          totalCost: ing.costPerUnit * (ing.qty || 1),
          costPerUnit: ing.costPerUnit,
          supplier: ''
        });
        toast(`Added "${ing.name}" to ingredients master list`, 'green');
      }
    }
  });
  
  // Auto-add new packaging to master list
  packaging.forEach(pkg => {
    if (pkg.name && pkg.costPerUnit > 0) {
      const exists = db.packaging.find(p => p.name === pkg.name);
      if (!exists) {
        db.packaging.push({
          id: uid(),
          name: pkg.name,
          type: 'Imported from Recipe',
          unit: pkg.unit,
          costPerUnit: pkg.costPerUnit,
          supplier: ''
        });
        toast(`Added "${pkg.name}" to packaging master list`, 'green');
      }
    }
  });
  
  const recipe = {
    id: editingRecipeId || uid(),
    name, category: document.getElementById('r-category').value.trim(),
    batch: parseInt(document.getElementById('r-batch').value)||1,
    unit: document.getElementById('r-unit').value.trim().toLowerCase(),
    notes: document.getElementById('r-notes').value.trim(),
    ingredients: ingredients,
    packaging: packaging,
    includeVat: document.getElementById('r-include-vat')?.checked || false,
    pricingMethod: document.getElementById('r-pricing-method').value,
    pricingValue: parseFloat(document.getElementById('r-pricing-value').value)||0,
    sellPrice: parseFloat(document.getElementById('r-sell-price').value)||0,
  };
  
  const isNewRecipe = !editingRecipeId;
  
  if (editingRecipeId) {
    const idx = db.recipes.findIndex(r => r.id === editingRecipeId);
    if (idx >= 0) db.recipes[idx] = recipe;
  } else {
    db.recipes.push(recipe);
  }
  
  // Update UI immediately
  renderRecipes(); 
  renderDashboard();
  updateBadges();
  closeModal('recipe-modal');
  
  // Save to database asynchronously
  try {
    await save();
    // Show success message
    if (isNewRecipe) {
      showSnackbar(`Recipe "${name}" added successfully!`, 'success');
    } else {
      toast('Recipe updated!', 'green');
    }
  } catch (error) {
    console.error('Failed to save recipe:', error);
    toast('Failed to save recipe!', 'red');
  }
  
  editingRecipeId = null;
}
function editRecipe(id) {
  const r = db.recipes.find(x => x.id === id);
  if (!r) return;
  editingRecipeId = id;
  document.getElementById('recipe-modal-title').textContent = 'Edit Recipe';
  document.getElementById('r-name').value = r.name;
  document.getElementById('r-category').value = r.category||'';
  document.getElementById('r-batch').value = r.batch||1;
  document.getElementById('r-unit').value = r.unit||'';
  document.getElementById('r-notes').value = r.notes||'';
  document.getElementById('r-pricing-method').value = r.pricingMethod||'markup';
  document.getElementById('r-pricing-value').value = r.pricingValue||30;
  document.getElementById('r-sell-price').value = r.sellPrice||'';
  const vatCheckbox = document.getElementById('r-include-vat');
  if (vatCheckbox) vatCheckbox.checked = !!r.includeVat;
  document.getElementById('recipe-ing-rows').innerHTML = '';
  document.getElementById('recipe-pkg-rows').innerHTML = '';
  (r.ingredients||[]).forEach(i => addIngredientRow(i));
  (r.packaging||[]).forEach(p => addPackagingRow(p));
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
  const r = db.recipes.find(x => x.id === id);
  if (!r) return;
  document.getElementById('view-recipe-title').textContent = r.name;
  document.getElementById('view-recipe-body').innerHTML = `
    <div class="flex-row mb-4" style="gap:16px;flex-wrap:wrap;align-items:center;">
      <span class="tag tag-blue">${r.category||'Uncategorized'}</span>
      <span class="text-sm text-muted">Batch: ${r.batch} ${r.unit||'pcs'}</span>
    </div>
    <div id="view-recipe-details"></div>
  `;
  renderViewRecipeModal();
  showModal('view-recipe-modal');
}

function renderViewRecipeModal() {
  if (!viewingRecipeId) return;
  const r = db.recipes.find(x => x.id === viewingRecipeId);
  if (!r) return;
  const { ingCost, pkgCost, opexCost, laborCost, total, vatCost } = calcRecipeCosts(r);
  const sell = calcSellPrice(r);
  const profit = sell - (r.includeVat ? total - vatCost : total);
  const margin = calcMargin(r);
  const tgt = db.settings.targetMargin || 30;
  const statusColor = margin >= tgt ? 'tag-green' : margin >= tgt*0.6 ? 'tag-amber' : 'tag-red';
  document.getElementById('view-recipe-details').innerHTML = `
    <div class="section-divider">Ingredients</div>
    ${(r.ingredients||[]).map(i => `<div class="view-ingredient-row"><span>${i.name} × ${i.qty} ${i.unit}</span><span class="td-mono">${cur(calcIngredientCost(i.qty, i.unit, i.name))}</span></div>`).join('')}
    <div class="section-divider">Packaging</div>
    ${(r.packaging||[]).map(p => `<div class="view-ingredient-row"><span>${p.name} × ${p.qty} ${p.unit}</span><span class="td-mono">${cur(p.qty*p.costPerUnit)}</span></div>`).join('')}
    <div class="cost-summary mt-4">
      <div class="cost-row"><span class="cost-label">Ingredient Cost</span><span class="cost-val">${cur(ingCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Packaging Cost</span><span class="cost-val">${cur(pkgCost)}</span></div>
      <div class="cost-row"><span class="cost-label">OPEX</span><span class="cost-val">${cur(opexCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Labor</span><span class="cost-val">${cur(laborCost)}</span></div>
      ${r.includeVat ? `<div class="cost-row"><span class="cost-label">VAT Expense (12%)</span><span class="cost-val">${cur(vatCost)}</span></div>` : ''}
      <div class="cost-row total"><span class="cost-label">Total Cost</span><span class="cost-val">${cur(total)}</span></div>
      <div class="cost-row total"><span class="cost-label">Sell Price</span><span class="cost-val">${cur(sell)}</span></div>
      <div class="cost-row total"><span class="cost-label">Gross Profit</span><span class="cost-val">${cur(profit)}</span></div>
      <div class="cost-row total"><span class="cost-label">Margin</span><span class="cost-val ${statusColor}" style="padding:2px 8px;border-radius:20px">${margin.toFixed(1)}%</span></div>
      <div class="margin-meter mt-2"><div class="meter-track"><div class="meter-fill" style="width:${Math.min(100,Math.max(0,margin))}%;background:${margin>=tgt?'var(--accent)':margin>=tgt*0.6?'var(--amber)':'var(--red)'}"></div></div></div>
    </div>
    ${r.notes ? `<div class="mt-4 text-sm text-muted">${r.notes}</div>` : ''}
  `;
}

// ===== VIEW CN PACKAGE =====
function viewCnPackage(id) {
  const pkg = db.cnPackages.find(p => p.id === id);
  if (!pkg) return;
  
  viewingCnPackageId = id;
  
  const pax = pkg.pax || 1;
  const recipes = pkg.recipes || [];
  const baseCost = recipes.reduce((sum, r) => sum + (r.qtyPerPax * r.costPerUnit * pax), 0);
  const contingencyCost = baseCost * ((pkg.contingencyPct || 0) / 100);
  const wasteCost = baseCost * ((pkg.wastePct || 0) / 100);
  const productionCost = baseCost * ((pkg.productionPct || 0) / 100);
  const capexCost = baseCost * ((pkg.capexPct || 0) / 100);
  const venueCost = pkg.venueCost || 0;
  const otherExpenses = pkg.otherExpenses || 0;
  const totalCost = baseCost + contingencyCost + wasteCost + productionCost + capexCost + venueCost + otherExpenses;
  
  // Calculate selling price based on package's pricing method
  const pricingMethod = pkg.pricingMethod || 'markup';
  const pricingValue = pkg.pricingValue ?? 30;
  let sellingPriceExclVat;
  if (pricingMethod === 'markup') {
    sellingPriceExclVat = totalCost * (1 + pricingValue / 100);
  } else if (pricingMethod === 'margin') {
    sellingPriceExclVat = totalCost / (1 - pricingValue / 100);
  } else if (pricingMethod === 'multiplier') {
    sellingPriceExclVat = totalCost * pricingValue;
  } else {
    sellingPriceExclVat = totalCost * 1.3; // fallback
  }
  
  const vatAmount = sellingPriceExclVat * ((pkg.vatPct || 0) / 100);
  const sellingPriceInclVat = sellingPriceExclVat + vatAmount;
  const profit = sellingPriceExclVat - totalCost;
  const margin = totalCost > 0 ? (profit / sellingPriceExclVat) * 100 : 0;
  
  document.getElementById('view-cn-package-title').textContent = pkg.name;
  document.getElementById('view-cn-package-body').innerHTML = `
    <div class="flex-row mb-4">
      <span class="text-sm text-muted">${pax} pax</span>
      ${pkg.venue ? `<span class="text-sm text-muted">Venue: ${pkg.venue}</span>` : ''}
    </div>
    ${pkg.eventDate && pkg.eventTime ? `<div class="mb-4"><strong>Event:</strong> ${new Date(pkg.eventDate + 'T' + pkg.eventTime).toLocaleString()}</div>` : ''}
    ${pkg.eventDate && !pkg.eventTime ? `<div class="mb-4"><strong>Event Date:</strong> ${new Date(pkg.eventDate).toLocaleDateString()}</div>` : ''}
    <div class="section-divider">Recipes</div>
    ${recipes.map(r => `<div class="view-ingredient-row"><span>${r.name} × ${r.qtyPerPax} per pax</span><span class="td-mono">${cur(r.qtyPerPax * r.costPerUnit * pax)}</span></div>`).join('')}
    <div class="cost-summary mt-4">
      <div class="cost-row"><span class="cost-label">Base Recipe Cost</span><span class="cost-val">${cur(baseCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Contingency Cost (${pkg.contingencyPct || 0}%)</span><span class="cost-val">${cur(contingencyCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Waste Cost (${pkg.wastePct || 0}%)</span><span class="cost-val">${cur(wasteCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Production Cost (${pkg.productionPct || 0}%)</span><span class="cost-val">${cur(productionCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Capex (${pkg.capexPct || 0}%)</span><span class="cost-val">${cur(capexCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Venue Cost</span><span class="cost-val">${cur(venueCost)}</span></div>
      <div class="cost-row"><span class="cost-label">Other Expenses</span><span class="cost-val">${cur(otherExpenses)}</span></div>
      <div class="cost-row total"><span class="cost-label">Total Cost</span><span class="cost-val">${cur(totalCost)}</span></div>
      <div class="cost-row"><span class="cost-label">VAT (${pkg.vatPct || 0}%)</span><span class="cost-val">${cur(vatAmount)}</span></div>
      <div class="cost-row"><span class="cost-label">Selling Price (excl. VAT)</span><span class="cost-val">${cur(sellingPriceExclVat)}</span></div>
      <div class="cost-row"><span class="cost-label">Selling Price (incl. VAT)</span><span class="cost-val">${cur(sellingPriceInclVat)}</span></div>
      <div class="cost-row"><span class="cost-label">Profit</span><span class="cost-val">${cur(profit)}</span></div>
      <div class="cost-row"><span class="cost-label">Margin</span><span class="cost-val">${margin.toFixed(1)}%</span></div>
    </div>
  `;
  showModal('view-cn-package-modal');
}

// ===== RENDER RECIPES =====
function renderRecipes() {
  const search = (document.getElementById('recipe-search')?.value||'').toLowerCase();
  const cat = document.getElementById('recipe-filter-cat')?.value||'';
  const sort = document.getElementById('recipe-sort')?.value||'name';
  let list = db.recipes.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search);
    const matchCat = !cat || r.category === cat;
    return matchSearch && matchCat;
  });
  list.sort((a,b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const ca = calcRecipeCosts(a).total, cb = calcRecipeCosts(b).total;
    if (sort === 'cost') return ca - cb;
    if (sort === 'cost-desc') return cb - ca;
    if (sort === 'margin') return calcMargin(a) - calcMargin(b);
    return 0;
  });
  const tbody = document.getElementById('recipe-table-body');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><h3>No recipes yet</h3><p>Click "New Recipe" to add your first recipe</p></div></td></tr>`; return; }
  const tgt = db.settings.targetMargin || 30;
  tbody.innerHTML = list.map(r => {
    const c = calcRecipeCosts(r);
    const sell = calcSellPrice(r);
    const margin = calcMargin(r);
    const statusClass = margin >= tgt ? 'tag-green' : margin >= tgt*0.6 ? 'tag-amber' : 'tag-red';
    return `<tr>
      <td class="td-name">${r.name}</td>
      <td><span class="tag tag-blue">${r.category||'—'}</span></td>
      <td class="td-mono">${r.batch} ${r.unit||'pcs'}</td>
      <td class="td-mono">${cur(c.ingCost)}</td>
      <td class="td-mono">${cur(c.pkgCost)}</td>
      <td class="td-mono" style="font-weight:600;color:var(--text)">${cur(c.total)}</td>
      <td class="td-mono" style="color:var(--accent)">${cur(sell)}</td>
      <td><span class="tag ${statusClass}">${margin.toFixed(1)}%</span></td>
      <td><div class="td-actions">
        <button class="action-btn action-view" onclick="viewRecipe('${r.id}')">View</button>
        <button class="action-btn action-edit" onclick="editRecipe('${r.id}')">Edit</button>
        <button class="action-btn action-del" onclick="deleteRecipe('${r.id}')">Del</button>
      </div></td>
    </tr>`;
  }).join('');
}
function renderRecipeCategoryFilter() {
  const cats = [...new Set(db.recipes.map(r => r.category).filter(Boolean))];
  const sel = document.getElementById('recipe-filter-cat');
  const cur2 = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${c}" ${c===cur2?'selected':''}>${c}</option>`).join('');
}

// ===== DASHBOARD =====
function renderDashboard() {
  const tgt = db.settings.targetMargin || 30;
  const costs = db.recipes.map(r => ({ r, c: calcRecipeCosts(r), sell: calcSellPrice(r), margin: calcMargin(r), profit: calcSellPrice(r) - calcRecipeCosts(r).total }));
  const totalR = db.recipes.length;
  
  if (totalR === 0) {
    // No recipes case
    document.getElementById('dash-highest-profit').textContent = '-';
    document.getElementById('dash-highest-margin').textContent = '-';
    document.getElementById('dash-lowest-profit').textContent = '-';
    document.getElementById('dash-lowest-margin').textContent = '-';
    document.getElementById('dash-total-profit').textContent = '₱0.00';
  } else {
    // Sort by margin to find highest and lowest
    const sortedByMargin = [...costs].sort((a,b) => b.margin - a.margin);
    const highest = sortedByMargin[0];
    const lowest = sortedByMargin[sortedByMargin.length - 1];
    
    // Highest profit product
    document.getElementById('dash-highest-profit').textContent = highest.r.name;
    document.getElementById('dash-highest-margin').textContent = highest.margin.toFixed(1) + '% margin';
    
    // Lowest profit product
    document.getElementById('dash-lowest-profit').textContent = lowest.r.name;
    document.getElementById('dash-lowest-margin').textContent = lowest.margin.toFixed(1) + '% margin';
    
    // Total profit potential (assuming 100 units per recipe per month)
    const totalProfit = costs.reduce((sum, x) => sum + x.profit * 100, 0);
    document.getElementById('dash-total-profit').textContent = cur(totalProfit);
  }
  
  // Upcoming events (always calculate)
  const upcomingEvents = db.cnPackages.filter(pkg => pkg.eventDate && new Date(pkg.eventDate + 'T' + (pkg.eventTime || '00:00')) > new Date()).sort((a,b) => new Date(a.eventDate + 'T' + (a.eventTime || '00:00')) - new Date(b.eventDate + 'T' + (b.eventTime || '00:00')));
  const nextEvent = upcomingEvents[0];
  document.getElementById('dash-upcoming-events').textContent = upcomingEvents.length;
  document.getElementById('dash-next-event').textContent = nextEvent ? `${nextEvent.name} - ${new Date(nextEvent.eventDate + 'T' + (nextEvent.eventTime || '00:00')).toLocaleDateString()} ${nextEvent.eventTime || ''}` : 'No upcoming events';
  
  // Top by cost
  const topCosts = [...costs].sort((a,b) => b.c.total-a.c.total).slice(0,8);
  const maxCost = topCosts[0]?.c.total || 1;
  document.getElementById('dash-top-recipes').innerHTML = topCosts.length ? topCosts.map(x => `
    <div class="bar-item">
      <div class="bar-name" title="${x.r.name}">${x.r.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(x.c.total/maxCost*100).toFixed(1)}%;background:var(--blue)"></div></div>
      <div class="bar-val">${cur(x.c.total)}</div>
    </div>`) .join('') : '<div class="text-muted text-sm">No recipes yet</div>';
  // Margin overview
  const marginList = [...costs].sort((a,b) => b.margin-a.margin).slice(0,8);
  document.getElementById('dash-margin-list').innerHTML = marginList.length ? marginList.map(x => {
    const color = x.margin>=tgt?'var(--accent)':x.margin>=tgt*0.6?'var(--amber)':'var(--red)';
    return `<div class="bar-item">
      <div class="bar-name" title="${x.r.name}">${x.r.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,Math.max(0,x.margin)).toFixed(1)}%;background:${color}"></div></div>
      <div class="bar-val" style="color:${color}">${x.margin.toFixed(1)}%</div>
    </div>`;
  }).join('') : '<div class="text-muted text-sm">No recipes yet</div>';
  // Summary table
  const search = (document.getElementById('dash-search')?.value || '').toLowerCase().trim();
  const filtered = costs.filter(x => {
    if (!search) return true;
    return x.r.name.toLowerCase().includes(search) || (x.r.category||'').toLowerCase().includes(search);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / DASHBOARD_RECIPES_PER_PAGE));
  if (dashCurrentPage > totalPages) dashCurrentPage = totalPages;
  const beginIndex = (dashCurrentPage - 1) * DASHBOARD_RECIPES_PER_PAGE;
  const pageItems = filtered.slice(beginIndex, beginIndex + DASHBOARD_RECIPES_PER_PAGE);
  const tbody = document.getElementById('dash-table-body');
  if (!pageItems.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state" style="padding:40px"><h3>No recipes match your search</h3><p>Try a different term or clear the search box.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(x => {
      const sClass = x.margin>=tgt?'tag-green':x.margin>=tgt*0.6?'tag-amber':'tag-red';
      return `<tr>
        <td class="td-name">${x.r.name}</td>
        <td><span class="tag tag-blue">${x.r.category||'—'}</span></td>
        <td>${x.r.batch} ${x.r.unit||'pcs'}</td>
        <td class="td-mono">${cur(x.c.ingCost)}</td>
        <td class="td-mono">${cur(x.c.pkgCost)}</td>
        <td class="td-mono" style="font-weight:600">${cur(x.c.total)}</td>
        <td class="td-mono" style="color:var(--accent)">${cur(x.sell)}</td>
        <td><span class="tag ${sClass}">${x.margin.toFixed(1)}%</span></td>
        <td><span class="tag ${sClass}">${x.margin>=tgt?'✓ Target Met':'✗ Below Target'}</span></td>
      </tr>`;
    }).join('');
  }
  const pagination = document.getElementById('dash-pagination');
  if (pagination) {
    if (filtered.length <= DASHBOARD_RECIPES_PER_PAGE) {
      pagination.innerHTML = `<div class="page-info">Showing ${filtered.length} of ${filtered.length} recipes</div>`;
    } else {
      pagination.innerHTML = `
        <button class="page-btn" ${dashCurrentPage === 1 ? 'disabled' : ''} onclick="setDashPage(${dashCurrentPage - 1})">&lt; Prev</button>
        <div class="page-info">Page ${dashCurrentPage} of ${totalPages}</div>
        <button class="page-btn" ${dashCurrentPage === totalPages ? 'disabled' : ''} onclick="setDashPage(${dashCurrentPage + 1})">Next &gt;</button>
      `;
    }
  }
}

function setDashPage(page) {
  dashCurrentPage = Math.max(1, page);
  renderDashboard();
}

// ===== INGREDIENTS =====
function resetIngModal() {
  document.getElementById('ing-modal-title').textContent = 'Add Ingredient';
  ['ing-name','ing-sku','ing-cat','ing-supplier'].forEach(id => document.getElementById(id).value = '');
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
  const unitCost = qty > 0 ? totalCost / qty : 0;
  document.getElementById('ing-unit-cost').value = unitCost.toFixed(2);
}
function saveIngredient() {
  const name = document.getElementById('ing-name').value.trim();
  if (!name) { toast('Name is required!','red'); return; }
  const qty = parseFloat(document.getElementById('ing-qty').value) || 1;
  const totalCost = parseFloat(document.getElementById('ing-cost').value) || 0;
  const costPerUnit = qty > 0 ? totalCost / qty : 0;
  const ing = { 
    id: editingIngId||uid(), 
    sku: document.getElementById('ing-sku').value.trim(),
    name, 
    category: document.getElementById('ing-cat').value.trim(), 
    quantity: qty,
    unit: document.getElementById('ing-unit').value.toLowerCase(), 
    totalCost: totalCost,
    costPerUnit: costPerUnit, 
    supplier: document.getElementById('ing-supplier').value.trim() 
  };
  if (editingIngId) { const idx = db.ingredients.findIndex(i => i.id===editingIngId); if (idx>=0) db.ingredients[idx]=ing; }
  else db.ingredients.push(ing);
  save(); closeModal('ingredient-modal'); renderIngredients(); renderIngCategoryFilter(); refreshRecipeNameLists();
  toast(editingIngId?'Ingredient updated!':'Ingredient saved!');
  editingIngId = null;
}
function editIngredient(id) {
  const i = db.ingredients.find(x=>x.id===id); if (!i) return;
  editingIngId = id;
  document.getElementById('ing-modal-title').textContent = 'Edit Ingredient';
  document.getElementById('ing-name').value = i.name;
  document.getElementById('ing-sku').value = i.sku||'';
  document.getElementById('ing-cat').value = i.category||'';
  document.getElementById('ing-qty').value = i.quantity || 1;
  document.getElementById('ing-unit').value = i.unit;
  document.getElementById('ing-cost').value = i.totalCost || (i.costPerUnit * (i.quantity || 1));
  document.getElementById('ing-unit-cost').value = i.costPerUnit || 0;
  document.getElementById('ing-supplier').value = i.supplier||'';
  document.getElementById('ing-cost').oninput = calculateIngUnitCost;
  document.getElementById('ing-qty').oninput = calculateIngUnitCost;
  showModal('ingredient-modal');
}
function deleteIngredient(id) {
  if (!confirm('Delete this ingredient?')) return;
  db.ingredients = db.ingredients.filter(i=>i.id!==id);
  save(); renderIngredients(); toast('Deleted.','red');
}
function setIngPage(page) {
  ingCurrentPage = Math.max(1, page);
}

function renderIngredients() {
  const search = (document.getElementById('ing-search')?.value||'').toLowerCase();
  const cat = document.getElementById('ing-filter-cat')?.value||'';
  let list = db.ingredients.filter(i => i.name.toLowerCase().includes(search) && (!cat || i.category===cat));
  const tbody = document.getElementById('ing-table-body');
  const paginationEl = document.getElementById('ing-pagination');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h3>No ingredients yet</h3><p>Add ingredients to use them in recipes</p></div></td></tr>`;
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(list.length / INGREDIENTS_PER_PAGE));
  if (ingCurrentPage > totalPages) ingCurrentPage = totalPages;
  const startIndex = (ingCurrentPage - 1) * INGREDIENTS_PER_PAGE;
  const pagedList = list.slice(startIndex, startIndex + INGREDIENTS_PER_PAGE);

  tbody.innerHTML = pagedList.map(i => {
    const usedIn = db.recipes.filter(r => r.ingredients?.some(x=>x.name===i.name)).length;
    const qty = i.quantity || 1;
    return `<tr>
      <td>${i.sku?`${i.sku} — `:''}<span class="td-name">${i.name}</span></td>
      <td><span class="tag tag-purple">${i.category||'—'}</span></td>
      <td class="td-mono">${qty}</td>
      <td>${i.unit}</td>
      <td class="td-mono" style="color:var(--amber)">${cur(i.costPerUnit)}</td>
      <td>${i.supplier||'—'}</td>
      <td><span class="tag ${usedIn?'tag-green':'tag-blue'}">${usedIn} recipe${usedIn!==1?'s':''}</span></td>
      <td><div class="td-actions">
        <button class="action-btn action-edit" onclick="editIngredient('${i.id}')">Edit</button>
        <button class="action-btn action-del" onclick="deleteIngredient('${i.id}')">Del</button>
      </div></td>
    </tr>`;
  }).join('');

  if (paginationEl) {
    let controls = '';
    if (totalPages > 1) {
      controls = `
        <button class="page-btn" onclick="setIngPage(${Math.max(1, ingCurrentPage-1)});renderIngredients()" ${ingCurrentPage===1?'disabled':''}>Prev</button>
        <span class="page-info">Page ${ingCurrentPage} of ${totalPages}</span>
        <button class="page-btn" onclick="setIngPage(${Math.min(totalPages, ingCurrentPage+1)});renderIngredients()" ${ingCurrentPage===totalPages?'disabled':''}>Next</button>
      `;
    }
    paginationEl.innerHTML = controls;
  }
}
function renderIngCategoryFilter() {
  const cats = [...new Set(db.ingredients.map(i=>i.category).filter(Boolean))];
  const sel = document.getElementById('ing-filter-cat');
  if (!sel) return;
  const cur2 = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>' + cats.map(c=>`<option value="${c}" ${c===cur2?'selected':''}>${c}</option>`).join('');
}

// ===== PACKAGING =====
function resetPkgModal() {
  document.getElementById('pkg-modal-title').textContent = 'Add Packaging';
  ['pkg-name','pkg-sku','pkg-type','pkg-supplier'].forEach(id => document.getElementById(id).value='');
  document.getElementById('pkg-cost').value=0;
  document.getElementById('pkg-unit').value='pcs';
}
function savePackaging() {
  const name = document.getElementById('pkg-name').value.trim();
  if (!name) { toast('Name is required!','red'); return; }
  const pkg = { id: editingPkgId||uid(), sku: document.getElementById('pkg-sku').value.trim(), name, type: document.getElementById('pkg-type').value.trim(), unit: document.getElementById('pkg-unit').value.toLowerCase(), costPerUnit: parseFloat(document.getElementById('pkg-cost').value)||0, supplier: document.getElementById('pkg-supplier').value.trim() };
  if (editingPkgId) { const idx = db.packaging.findIndex(p=>p.id===editingPkgId); if (idx>=0) db.packaging[idx]=pkg; }
  else db.packaging.push(pkg);
  save(); closeModal('pkg-modal'); renderPackaging(); refreshRecipeNameLists();
  toast(editingPkgId?'Updated!':'Packaging saved!');
  editingPkgId = null;
}
function editPackaging(id) {
  const p = db.packaging.find(x=>x.id===id); if (!p) return;
  editingPkgId = id;
  document.getElementById('pkg-modal-title').textContent = 'Edit Packaging';
  document.getElementById('pkg-sku').value = p.sku||'';
  document.getElementById('pkg-name').value = p.name;
  document.getElementById('pkg-type').value = p.type||'';
  document.getElementById('pkg-unit').value = p.unit;
  document.getElementById('pkg-cost').value = p.costPerUnit;
  document.getElementById('pkg-supplier').value = p.supplier||'';
  showModal('pkg-modal');
}
function deletePackaging(id) {
  if (!confirm('Delete this packaging?')) return;
  db.packaging = db.packaging.filter(p=>p.id!==id);
  save(); renderPackaging(); toast('Deleted.','red');
}
function renderPackaging() {
  const tbody = document.getElementById('pkg-table-body');
  if (!db.packaging.length) { tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><h3>No packaging yet</h3><p>Add packaging materials used in your recipes</p></div></td></tr>`; return; }
  tbody.innerHTML = db.packaging.map(p => `<tr>
    <td>${p.sku?`${p.sku} — `:''}<span class="td-name">${p.name}</span></td>
    <td><span class="tag tag-purple">${p.type||'—'}</span></td>
    <td>${p.unit}</td>
    <td class="td-mono" style="color:var(--amber)">${cur(p.costPerUnit)}</td>
    <td>${p.supplier||'—'}</td>
    <td><div class="td-actions">
      <button class="action-btn action-edit" onclick="editPackaging('${p.id}')">Edit</button>
      <button class="action-btn action-del" onclick="deletePackaging('${p.id}')">Del</button>
    </div></td>
  </tr>`).join('');
}

// ===== OPEX =====
function resetOpexModal() {
  document.getElementById('opex-modal-title').textContent='Add OPEX Item';
  document.getElementById('opex-name').value='';
  document.getElementById('opex-amount').value=0;
  document.getElementById('opex-cat').value='Utilities';
  document.getElementById('opex-freq').value='monthly';
}
function getMonthlyAmount(item) {
  const a = parseFloat(item.amount)||0;
  if (item.frequency==='weekly') return a*4.33;
  if (item.frequency==='daily') return a*30;
  if (item.frequency==='annual') return a/12;
  return a;
}
function saveOpex() {
  const name = document.getElementById('opex-name').value.trim();
  if (!name) { toast('Name is required!','red'); return; }
  const item = { id: editingOpexId||uid(), name, category: document.getElementById('opex-cat').value, frequency: document.getElementById('opex-freq').value, amount: parseFloat(document.getElementById('opex-amount').value)||0 };
  if (editingOpexId) { const idx = db.opex.findIndex(o=>o.id===editingOpexId); if (idx>=0) db.opex[idx]=item; }
  else db.opex.push(item);
  save(); closeModal('opex-modal'); renderOpex();
  toast(editingOpexId?'Updated!':'OPEX saved!');
  editingOpexId = null;
}
function editOpex(id) {
  const o = db.opex.find(x=>x.id===id); if (!o) return;
  editingOpexId = id;
  document.getElementById('opex-modal-title').textContent='Edit OPEX Item';
  document.getElementById('opex-name').value=o.name;
  document.getElementById('opex-cat').value=o.category;
  document.getElementById('opex-freq').value=o.frequency;
  document.getElementById('opex-amount').value=o.amount;
  showModal('opex-modal');
}
function deleteOpex(id) {
  if (!confirm('Delete this item?')) return;
  db.opex = db.opex.filter(o=>o.id!==id);
  save(); renderOpex(); toast('Deleted.','red');
}
function renderOpex() {
  const monthlyTotal = db.opex.reduce((s,o) => s+getMonthlyAmount(o), 0);
  const batches = parseInt(db.settings.monthlyBatches)||100;
  const perBatch = batches ? monthlyTotal/batches : 0;
  document.getElementById('opex-monthly-total').textContent = cur(monthlyTotal);
  document.getElementById('opex-per-batch').textContent = cur(perBatch);
  document.getElementById('opex-batches-display').textContent = batches;
  const tbody = document.getElementById('opex-table-body');
  if (!db.opex.length) { tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><h3>No OPEX items yet</h3><p>Add overhead costs like electricity, rent, labor, etc.</p></div></td></tr>`; return; }
  tbody.innerHTML = db.opex.map(o => {
    const monthly = getMonthlyAmount(o);
    const cats = {Utilities:'tag-blue',Labor:'tag-amber',Rent:'tag-purple',Transportation:'tag-green',Marketing:'tag-red',Equipment:'tag-amber',Supplies:'tag-green',Other:'tag-blue'};
    return `<tr>
      <td class="td-name">${o.name}</td>
      <td><span class="tag ${cats[o.category]||'tag-blue'}">${o.category}</span></td>
      <td style="text-transform:capitalize">${o.frequency}</td>
      <td class="td-mono">${cur(o.amount)}</td>
      <td class="td-mono" style="color:var(--amber)">${cur(monthly)}/mo</td>
      <td><div class="td-actions">
        <button class="action-btn action-edit" onclick="editOpex('${o.id}')">Edit</button>
        <button class="action-btn action-del" onclick="deleteOpex('${o.id}')">Del</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ===== PRICING REPORT =====
function renderPricing() {
  const tgt = db.settings.targetMargin || 30;
  const tbody = document.getElementById('pricing-table-body');
  if (!db.recipes.length) { tbody.innerHTML=`<tr><td colspan="13"><div class="empty-state"><h3>No recipes</h3></div></td></tr>`; return; }
  tbody.innerHTML = db.recipes.map((r,i) => {
    const c = calcRecipeCosts(r);
    const sell = calcSellPrice(r);
    const gross = sell - c.total;
    const margin = calcMargin(r);
    const sClass = margin>=tgt?'tag-green':margin>=tgt*0.6?'tag-amber':'tag-red';
    const multiplier = c.total > 0 ? (sell/c.total).toFixed(2) : '—';
    return `<tr>
      <td style="color:var(--text3);font-family:'DM Mono',monospace;font-size:11px">${i+1}</td>
      <td class="td-name">${r.name}</td>
      <td><span class="tag tag-blue">${r.category||'—'}</span></td>
      <td>${r.batch} ${r.unit||'pcs'}</td>
      <td class="td-mono">${cur(c.ingCost)}</td>
      <td class="td-mono">${cur(c.pkgCost)}</td>
      <td class="td-mono">${cur(c.opexCost)}</td>
      <td class="td-mono" style="font-weight:600">${cur(c.total)}</td>
      <td class="td-mono">${multiplier}x</td>
      <td class="td-mono" style="color:var(--accent);font-weight:600">${cur(sell)}</td>
      <td class="td-mono" style="color:${gross>=0?'var(--accent)':'var(--red)'}">${cur(gross)}</td>
      <td><span class="tag ${sClass}">${margin.toFixed(1)}%</span></td>
      <td><span class="tag ${margin>=tgt?'tag-green':'tag-red'}">${margin>=tgt?'✓ Yes':'✗ No'}</span></td>
    </tr>`;
  }).join('');
}

// ===== SETTINGS =====
function loadSettings() {
  const s = db.settings;
  document.getElementById('set-biz-name').value = s.bizName||'';
  document.getElementById('set-currency').value = s.currency||'₱';
  document.getElementById('set-markup').value = s.markup||30;
  document.getElementById('set-target-margin').value = s.targetMargin||30;
  document.getElementById('set-monthly-batches').value = s.monthlyBatches||100;
  document.getElementById('set-vat').value = s.vat||12;
  document.getElementById('set-pricing-method').value = s.pricingMethod||'markup';
  document.getElementById('set-multiplier').value = s.multiplier||3;
  updateThemeButton();
}
function saveSettings() {
  db.settings.bizName = document.getElementById('set-biz-name').value;
  db.settings.currency = document.getElementById('set-currency').value||'₱';
  db.settings.markup = parseFloat(document.getElementById('set-markup').value)||30;
  db.settings.targetMargin = parseFloat(document.getElementById('set-target-margin').value)||30;
  db.settings.monthlyBatches = parseInt(document.getElementById('set-monthly-batches').value)||100;
  db.settings.vat = parseFloat(document.getElementById('set-vat').value)||0;
  db.settings.pricingMethod = document.getElementById('set-pricing-method').value;
  db.settings.multiplier = parseFloat(document.getElementById('set-multiplier').value)||3;
  save(); toast('Settings saved!'); renderDashboard();
}
function clearAllData() {
  if (!confirm('Are you sure? This will delete ALL data permanently!')) return;
  if (!confirm('This action cannot be undone. Continue?')) return;
  localStorage.removeItem('recipecost_db');
  db = { recipes:[], ingredients:[], packaging:[], cnPackages:[], opex:[], settings:{bizName:'My Food Business',currency:'₱',markup:30,targetMargin:30,monthlyBatches:100,vat:12,pricingMethod:'markup',multiplier:3} };
  save(); showPage('dashboard'); toast('All data cleared.','red');
}

// ===== EXPORT / IMPORT =====
function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'recipecost_backup.json';
  a.click();
  toast('Data exported!');
}
function importData() { document.getElementById('import-file').click(); }
function handleImport(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (parsed.recipes !== undefined) {
        db = parsed; save(); showPage('dashboard'); renderDashboard(); updateBadges();
        toast('Data imported successfully!');
      } else { toast('Invalid file format!','red'); }
    } catch { toast('Failed to parse file!','red'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}
function importIngredientsExcel() {
  document.getElementById('ingredient-xlsx-file').click();
}
function handleIngredientUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (typeof XLSX === 'undefined') {
    toast('Excel parser not loaded!','red');
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const workbook = XLSX.read(new Uint8Array(ev.target.result), {type:'array'});
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, {defval:''});
      if (!rawRows.length) {
        toast('Excel contains no rows.','red');
        return;
      }

      const normalizeKey = key => String(key||'').trim().toLowerCase();
      const rows = rawRows.map(raw => {
        const row = {};
        Object.keys(raw).forEach(key => row[normalizeKey(key)] = raw[key]);
        const quantity = parseFloat(row['quantity'] || row['qty'] || 1) || 1;
        const totalCost = parseFloat(row['unit cost'] || row['unitcost'] || row['cost per unit'] || row['cost'] || 0) || 0;
        const unit = String(row['unit of measurement'] || row['unit'] || row['uom'] || 'pcs').trim() || 'pcs';
        return {
          sku: String(row['sku'] || '').trim(),
          name: String(row['ingredient name'] || row['ingredient'] || row['name'] || '').trim(),
          quantity,
          unit,
          totalCost,
          costPerUnit: quantity > 0 ? totalCost / quantity : 0,
          supplier: String(row['supplier'] || '').trim(),
          category: String(row['category'] || '').trim()
        };
      }).filter(item => item.name);

      if (!rows.length) {
        toast('No valid ingredient rows found.','red');
        return;
      }

      let added = 0;
      let updated = 0;
      rows.forEach(item => {
        const existing = db.ingredients.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
          existing.sku = existing.sku || item.sku;
          existing.category = existing.category || item.category;
          existing.supplier = existing.supplier || item.supplier;
          existing.quantity = item.quantity || existing.quantity || 1;
          existing.unit = item.unit || existing.unit || 'pcs';
          if (item.totalCost) {
            existing.totalCost = item.totalCost;
            existing.costPerUnit = item.costPerUnit;
          }
          updated++;
        } else {
          db.ingredients.push({
            id: uid(),
            sku: item.sku,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            totalCost: item.totalCost,
            costPerUnit: item.costPerUnit,
            supplier: item.supplier
          });
          added++;
        }
      });

      save();
      renderIngredients();
      renderIngCategoryFilter();
      refreshRecipeNameLists();
      updateBadges();
      toast(`Imported ${added} ingredients${updated ? `, updated ${updated}` : ''}.`);
    } catch (err) {
      console.error(err);
      toast('Unable to parse Excel file.','red');
    }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = '';
}

// ===== CN PACKAGE =====
function resetCnPackageModal() {
  const titleEl = document.getElementById('cn-package-modal-title');
  if (titleEl) titleEl.textContent = 'New Package';
  
  const fields = [
    { id: 'cn-pkg-name', value: '' },
    { id: 'cn-pkg-pax', value: 50 },
    { id: 'cn-pkg-contingency', value: 5 },
    { id: 'cn-pkg-waste', value: 3 },
    { id: 'cn-pkg-production', value: 10 },
    { id: 'cn-pkg-capex', value: 30 },
    { id: 'cn-pkg-venue', value: '' },
    { id: 'cn-pkg-venue-cost', value: 0 },
    { id: 'cn-pkg-other-expenses', value: 0 },
    { id: 'cn-pkg-event-date', value: '' },
    { id: 'cn-pkg-event-time', value: '' }
  ];
  
  fields.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  
  const recipeRowsEl = document.getElementById('cn-package-recipe-rows');
  if (recipeRowsEl) recipeRowsEl.innerHTML = '';
  
  updateCnPackageCostPreview();
}

function addCnPackageRecipeRow(data) {
  const tbody = document.getElementById('cn-package-recipe-rows');
  const row = document.createElement('tr');
  const recipeOptions = db.recipes.map(r => `<option value="${r.name}" data-id="${r.id}">${r.name}</option>`).join('');
  
  row.innerHTML = `
    <td><select onchange="fillCnPackageRecipeCost(this)" style="min-width:200px">
      <option value="">-- Select Recipe --</option>
      ${recipeOptions}
    </select></td>
    <td><input type="number" value="${data&&data.qtyPerPax?data.qtyPerPax:''}" step="0.01" min="0" placeholder="0" oninput="updateCnPackageCostPreview()" style="width:80px"></td>
    <td><span class="unit-cell">—</span></td>
    <td class="td-mono cost-cell">₱0.00</td>
    <td class="td-mono subtotal-cell">₱0.00</td>
  `;
  tbody.appendChild(row);
  if (data) {
    const sel = row.querySelector('select');
    const opt = [...sel.options].find(o => o.value === data.name);
    if (opt) {
      sel.value = data.name;
      fillCnPackageRecipeCost(sel);
    }
    const qtyInput = row.querySelector('input');
    qtyInput.value = data.qtyPerPax || '';
    updateCnPackageCostPreview();
  }
}

function fillCnPackageRecipeCost(sel) {
  const row = sel.closest('tr');
  const recipeName = sel.value;
  const recipe = db.recipes.find(r => r.name === recipeName);
  
  if (recipe) {
    const unitCell = row.querySelector('.unit-cell');
    const costCell = row.querySelector('.cost-cell');
    const qtyInput = row.querySelector('input');
    
    unitCell.textContent = recipe.unit || 'pcs';
    const costPerUnit = calcSellPrice(recipe);
    costCell.textContent = cur(costPerUnit);
    
    if (!qtyInput.value) qtyInput.value = 1;
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
  const otherExpenses = parseFloat(document.getElementById('cn-pkg-other-expenses').value) || 0;
  
  let baseCost = 0;
  [...document.getElementById('cn-package-recipe-rows').querySelectorAll('tr')].forEach(row => {
    const qtyInput = row.querySelector('input');
    const costCell = row.querySelector('.cost-cell');
    const qty = parseFloat(qtyInput.value) || 0;
    const costPerUnit = parseFloat(costCell.textContent.replace(/[^\d.-]/g, '')) || 0;
    const subtotal = qty * costPerUnit * pax;
    row.querySelector('.subtotal-cell').textContent = cur(subtotal);
    baseCost += subtotal;
  });
  
  const contingencyCost = baseCost * (contingencyPct / 100);
  const wasteCost = baseCost * (wastePct / 100);
  const productionCost = baseCost * (productionPct / 100);
  const capexCost = baseCost * (capexPct / 100);
  const totalCost = baseCost + contingencyCost + wasteCost + productionCost + capexCost + venueCost + otherExpenses;
  
  // Calculate selling price based on pricing method
  let sellingPriceExclVat;
  if (pricingMethod === 'markup') {
    sellingPriceExclVat = totalCost * (1 + pricingValue / 100);
  } else if (pricingMethod === 'margin') {
    sellingPriceExclVat = totalCost / (1 - pricingValue / 100);
  } else if (pricingMethod === 'multiplier') {
    sellingPriceExclVat = totalCost * pricingValue;
  } else {
    sellingPriceExclVat = totalCost * 1.3; // fallback
  }
  
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
  
  const pax = parseFloat(document.getElementById('cn-pkg-pax')?.value) || 1;
  const contingencyPct = parseFloat(document.getElementById('cn-pkg-contingency')?.value) || 0;
  const wastePct = parseFloat(document.getElementById('cn-pkg-waste')?.value) || 0;
  const productionPct = parseFloat(document.getElementById('cn-pkg-production')?.value) || 0;
  const capexPct = parseFloat(document.getElementById('cn-pkg-capex')?.value) || 0;
  const vatPct = parseFloat(document.getElementById('cn-pkg-vat')?.value) || 0;
  const pricingMethod = document.getElementById('cn-pkg-pricing-method')?.value || 'markup';
  let pricingValue = parseFloat(document.getElementById('cn-pkg-pricing-value')?.value);
  if (isNaN(pricingValue)) pricingValue = 30;
  const venue = document.getElementById('cn-pkg-venue')?.value?.trim() || '';
  const venueCost = parseFloat(document.getElementById('cn-pkg-venue-cost')?.value) || 0;
  const otherExpenses = parseFloat(document.getElementById('cn-pkg-other-expenses')?.value) || 0;
  const eventDate = document.getElementById('cn-pkg-event-date')?.value || '';
  const eventTime = document.getElementById('cn-pkg-event-time')?.value || '';
  
  const recipes = [...(document.getElementById('cn-package-recipe-rows')?.querySelectorAll('tr') || [])].map(row => {
    const sel = row.querySelector('select');
    const qtyInput = row.querySelector('input');
    const recipeName = sel?.value || '';
    const qtyPerPax = parseFloat(qtyInput?.value) || 0;
    const recipe = db.recipes.find(r => r.name === recipeName);
    return {
      name: recipeName,
      qtyPerPax,
      unit: recipe ? recipe.unit : '',
      costPerUnit: recipe ? calcSellPrice(recipe) : 0
    };
  }).filter(r => r.name && r.qtyPerPax > 0);
  
  const cnPackage = {
    id: editingCnPackageId || uid(),
    name,
    pax,
    contingencyPct,
    wastePct,
    productionPct,
    capexPct,
    vatPct,
    pricingMethod,
    pricingValue,
    venue,
    venueCost,
    otherExpenses,
    eventDate,
    eventTime,
    recipes
  };
  
  if (editingCnPackageId) {
    const idx = db.cnPackages.findIndex(p => p.id === editingCnPackageId);
    if (idx >= 0) db.cnPackages[idx] = cnPackage;
  } else {
    db.cnPackages.push(cnPackage);
  }
  
  save(); closeModal('cn-package-modal');
  renderCnPackages(); updateBadges();
  toast(editingCnPackageId ? 'Package updated!' : 'Package saved!');
  editingCnPackageId = null;
}

function editCnPackage(id) {
  const pkg = db.cnPackages.find(p => p.id === id);
  if (!pkg) return;
  
  editingCnPackageId = id;
  const titleEl = document.getElementById('cn-package-modal-title');
  if (titleEl) titleEl.textContent = 'Edit Package';
  
  const fields = [
    { id: 'cn-pkg-name', value: pkg.name },
    { id: 'cn-pkg-pax', value: pkg.pax ?? 50 },
    { id: 'cn-pkg-contingency', value: pkg.contingencyPct ?? 5 },
    { id: 'cn-pkg-waste', value: pkg.wastePct ?? 3 },
    { id: 'cn-pkg-production', value: pkg.productionPct ?? 10 },
    { id: 'cn-pkg-capex', value: pkg.capexPct ?? 30 },
    { id: 'cn-pkg-vat', value: pkg.vatPct ?? 0 },
    { id: 'cn-pkg-pricing-method', value: pkg.pricingMethod ?? 'markup' },
    { id: 'cn-pkg-pricing-value', value: pkg.pricingValue ?? 30 },
    { id: 'cn-pkg-venue', value: pkg.venue ?? '' },
    { id: 'cn-pkg-venue-cost', value: pkg.venueCost ?? 0 },
    { id: 'cn-pkg-other-expenses', value: pkg.otherExpenses ?? 0 },
    { id: 'cn-pkg-event-date', value: pkg.eventDate ?? '' },
    { id: 'cn-pkg-event-time', value: pkg.eventTime ?? '' }
  ];
  
  fields.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  
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

function copyCnPackageFromView() {
  if (!viewingCnPackageId) return;
  copyCnPackage(viewingCnPackageId);
  closeModal('view-cn-package-modal');
}

function copyCnPackage(id) {
  const pkg = db.cnPackages.find(p => p.id === id);
  if (!pkg) return;
  
  editingCnPackageId = null;
  const titleEl = document.getElementById('cn-package-modal-title');
  if (titleEl) titleEl.textContent = 'New Package';
  
  const fields = [
    { id: 'cn-pkg-name', value: 'Copy of ' + pkg.name },
    { id: 'cn-pkg-pax', value: pkg.pax ?? 50 },
    { id: 'cn-pkg-contingency', value: pkg.contingencyPct ?? 5 },
    { id: 'cn-pkg-waste', value: pkg.wastePct ?? 3 },
    { id: 'cn-pkg-production', value: pkg.productionPct ?? 10 },
    { id: 'cn-pkg-capex', value: pkg.capexPct ?? 30 },
    { id: 'cn-pkg-vat', value: pkg.vatPct ?? 0 },
    { id: 'cn-pkg-pricing-method', value: pkg.pricingMethod ?? 'markup' },
    { id: 'cn-pkg-pricing-value', value: pkg.pricingValue ?? 30 },
    { id: 'cn-pkg-venue', value: pkg.venue ?? '' },
    { id: 'cn-pkg-venue-cost', value: pkg.venueCost ?? 0 },
    { id: 'cn-pkg-other-expenses', value: pkg.otherExpenses ?? 0 },
    { id: 'cn-pkg-event-date', value: pkg.eventDate ?? '' },
    { id: 'cn-pkg-event-time', value: pkg.eventTime ?? '' }
  ];


  fields.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  
  const recipeRowsEl = document.getElementById('cn-package-recipe-rows');
  if (recipeRowsEl) recipeRowsEl.innerHTML = '';
  
  (pkg.recipes || []).forEach(recipe => addCnPackageRecipeRow(recipe));
  
  updateCnPackageCostPreview();
  showModal('cn-package-modal');
}

function renderCnPackages() {
  const tbody = document.getElementById('cn-package-table-body');
  if (!db.cnPackages.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h3>No packages yet</h3><p>Create your first catering package</p></div></td></tr>`;
    return;
  }
  
  tbody.innerHTML = db.cnPackages.map(pkg => {
    const pax = pkg.pax || 1;
    const recipes = pkg.recipes || [];
    const baseCost = recipes.reduce((sum, r) => sum + (r.qtyPerPax * r.costPerUnit * pax), 0);
    const contingencyCost = baseCost * ((pkg.contingencyPct || 0) / 100);
    const wasteCost = baseCost * ((pkg.wastePct || 0) / 100);
    const productionCost = baseCost * ((pkg.productionPct || 0) / 100);
    const capexCost = baseCost * ((pkg.capexPct || 0) / 100);
    const venueCost = pkg.venueCost || 0;
    const otherExpenses = pkg.otherExpenses || 0;
    const totalCost = baseCost + contingencyCost + wasteCost + productionCost + capexCost + venueCost + otherExpenses;
    
    // Calculate selling price based on package's pricing method
    const pricingMethod = pkg.pricingMethod || 'markup';
    const pricingValue = pkg.pricingValue ?? 30;
    let sellingPriceExclVat;
    if (pricingMethod === 'markup') {
      sellingPriceExclVat = totalCost * (1 + pricingValue / 100);
    } else if (pricingMethod === 'margin') {
      sellingPriceExclVat = totalCost / (1 - pricingValue / 100);
    } else if (pricingMethod === 'multiplier') {
      sellingPriceExclVat = totalCost * pricingValue;
    } else {
      sellingPriceExclVat = totalCost * 1.3; // fallback
    }
    
    const vatAmount = sellingPriceExclVat * ((pkg.vatPct || 0) / 100);
    const sellingPriceInclVat = sellingPriceExclVat + vatAmount;
    const profit = sellingPriceExclVat - totalCost;
    const margin = totalCost > 0 ? (profit / sellingPriceExclVat) * 100 : 0;
    
    return `<tr>
      <td><span class="td-name">${pkg.name}</span></td>
      <td>${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}</td>
      <td class="td-mono">${pax}</td>
      <td class="td-mono">${cur(totalCost)}</td>
      <td class="td-mono">${cur(sellingPriceInclVat)}</td>
      <td class="td-mono" style="color:var(--accent)">${cur(profit)}</td>
      <td><span class="tag ${margin >= 20 ? 'tag-green' : margin >= 10 ? 'tag-amber' : 'tag-red'}">${margin.toFixed(1)}%</span></td>
      <td><div class="td-actions">
        <button class="action-btn action-view" onclick="viewCnPackage('${pkg.id}')">View</button>
        <button class="action-btn action-edit" onclick="editCnPackage('${pkg.id}')">Edit</button>
        <button class="action-btn action-del" onclick="deleteCnPackage('${pkg.id}')">Del</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ===== SEED DATA =====
// ===== UI EVENT LISTENERS & INIT =====
function performInitialization() {
  // Apply theme early, even before authentication
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'light') document.body.classList.add('light-theme');
  
  if (!initializeSession()) {
    hideMainApp();
    return;
  }
  (async () => {
    await load();
    refreshRecipeNameLists();
    renderDashboard();
    updateBadges();
  })();
}

document.addEventListener('DOMContentLoaded', () => {
  const loginInput = document.getElementById('login-password');
  if (loginInput) {
    loginInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') authenticateLogin();
    });
  }
  performInitialization();
});

// Fallback in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
  // DOM is still loading
} else {
  // DOM is already loaded
  performInitialization();
}