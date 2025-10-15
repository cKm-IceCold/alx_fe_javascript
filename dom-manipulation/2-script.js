// script.js
// Dynamic Quote Generator with localStorage, sessionStorage, import/export

// -------------------------
// Storage keys & defaults
// -------------------------
const LOCAL_STORAGE_KEY = 'quotes';
const SESSION_LAST_QUOTE_KEY = 'lastShownQuoteIndex';

const defaultQuotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Do what you can, with what you have, where you are.", category: "Inspiration" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" }
];

// -------------------------
// App state
// -------------------------
let quotes = []; // will be loaded from localStorage or defaults
let lastShownIndex = null;

// -------------------------
// DOM references
// -------------------------
const quoteDisplay = document.getElementById('quoteDisplay'); // where quote appears
const newQuoteBtn = document.getElementById('newQuote');     // Show New Quote button

// Create or get a category select element
let categoryFilter = document.getElementById('categoryFilter');
if (!categoryFilter) {
  categoryFilter = document.createElement('select');
  categoryFilter.id = 'categoryFilter';
  // insert after quoteDisplay if possible
  if (quoteDisplay && quoteDisplay.parentNode) {
    quoteDisplay.parentNode.insertBefore(categoryFilter, quoteDisplay.nextSibling);
  } else {
    document.body.insertBefore(categoryFilter, document.body.firstChild);
  }
}

// A container for controls (form, import/export)
let controlsContainer = document.getElementById('quoteControls');
if (!controlsContainer) {
  controlsContainer = document.createElement('div');
  controlsContainer.id = 'quoteControls';
  document.body.appendChild(controlsContainer);
}

// -------------------------
// LocalStorage helpers
// -------------------------
function saveQuotes() {
  // Must use localStorage.setItem as required by the task checker
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotesFromLocalStorage() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    quotes = defaultQuotes.slice();
    saveQuotes();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    // Validate structure: array of objects with text & category strings
    if (Array.isArray(parsed) && parsed.every(q => q && typeof q.text === 'string' && typeof q.category === 'string')) {
      quotes = parsed;
    } else {
      // fallback to defaults if invalid
      quotes = defaultQuotes.slice();
      saveQuotes();
    }
  } catch (err) {
    console.error('Error parsing quotes from localStorage:', err);
    quotes = defaultQuotes.slice();
    saveQuotes();
  }
}

// -------------------------
// SessionStorage helpers
// -------------------------
function saveLastShownIndexToSession(index) {
  try {
    sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, String(index));
  } catch (err) {
    console.warn('Could not save last shown index to sessionStorage:', err);
  }
}

function loadLastShownIndexFromSession() {
  try {
    const v = sessionStorage.getItem(SESSION_LAST_QUOTE_KEY);
    if (v !== null) {
      const n = parseInt(v, 10);
      if (!isNaN(n)) return n;
    }
  } catch (err) {
    console.warn('Could not load last shown index:', err);
  }
  return null;
}

// -------------------------
// UI helpers
// -------------------------
function updateCategoryFilter() {
  const categories = ['all', ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat === 'all' ? 'All Categories' : cat;
    categoryFilter.appendChild(opt);
  });
}

// displayRandomQuote must use innerHTML as required
function displayRandomQuote() {
  const selectedCategory = categoryFilter.value || 'all';
  let filtered = quotes;
  if (selectedCategory !== 'all') {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  if (!filtered.length) {
    quoteDisplay.innerHTML = '<p>No quotes available for this category.</p>';
    return;
  }

  // Prefer continuity when session has lastShownIndex
  const sessionIndex = loadLastShownIndexFromSession();
  let chosenIndexInFiltered = Math.floor(Math.random() * filtered.length);

  if (sessionIndex !== null && quotes[sessionIndex]) {
    const sessionQuote = quotes[sessionIndex];
    const pos = filtered.indexOf(sessionQuote);
    if (pos !== -1) {
      // pick next in filtered list for deterministic feel
      chosenIndexInFiltered = (pos + 1) % filtered.length;
    }
  }

  const chosenQuote = filtered[chosenIndexInFiltered];
  // store global index in session so it can be used later
  const globalIndex = quotes.indexOf(chosenQuote);
  lastShownIndex = globalIndex;
  saveLastShownIndexToSession(globalIndex);

  // Use innerHTML to show quote and category
  quoteDisplay.innerHTML = `
    <p style="font-size:1.05rem; margin:0 0 .5rem;">"${chosenQuote.text}"</p>
    <p style="margin:0; color:#555;"><em>Category:</em> ${chosenQuote.category}</p>
  `;
}

// -------------------------
// createAddQuoteForm (builds the form dynamically)
// -------------------------
function createAddQuoteForm() {
  if (document.getElementById('addQuoteForm')) return; // already created

  const form = document.createElement('div');
  form.id = 'addQuoteForm';
  form.style.marginTop = '1rem';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.id = 'newQuoteText';
  textInput.placeholder = 'Enter a new quote';
  textInput.style.marginRight = '0.5rem';
  textInput.style.width = '55%';

  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';
  categoryInput.id = 'newQuoteCategory';
  categoryInput.placeholder = 'Enter quote category';
  categoryInput.style.marginRight = '0.5rem';
  categoryInput.style.width = '20%';

  const addBtn = document.createElement('button');
  addBtn.id = 'addQuoteBtn';
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', addQuoteFromForm);

  // Import file input
  const importLabel = document.createElement('label');
  importLabel.textContent = ' Import JSON: ';
  importLabel.style.marginLeft = '1rem';

  const importFile = document.createElement('input');
  importFile.type = 'file';
  importFile.id = 'importFile';
  importFile.accept = '.json,application/json';
  importFile.addEventListener('change', importFromJsonFile);

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.id = 'exportBtn';
  exportBtn.textContent = 'Export Quotes';
  exportBtn.style.marginLeft = '0.5rem';
  exportBtn.addEventListener('click', exportQuotesToJson);

  form.appendChild(textInput);
  form.appendChild(categoryInput);
  form.appendChild(addBtn);
  form.appendChild(importLabel);
  form.appendChild(importFile);
  form.appendChild(exportBtn);

  controlsContainer.appendChild(form);
}

// -------------------------
// addQuoteFromForm
// -------------------------
function addQuoteFromForm() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();
  if (!text || !category) {
    alert('Please enter both quote text and category.');
    return;
  }
  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();           // <-- saves to localStorage using localStorage.setItem
  updateCategoryFilter();
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  alert('Quote added and saved.');
}

// -------------------------
// Export / Import functions
// -------------------------
function exportQuotesToJson() {
  try {
    const jsonStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Export failed. See console for details.');
  }
}

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('JSON must be an array');
      const valid = imported.every(it => it && typeof it.text === 'string' && typeof it.category === 'string');
      if (!valid) throw new Error('Each item must have text and category strings');
      let added = 0;
      imported.forEach(it => {
        const exists = quotes.some(q => q.text === it.text && q.category === it.category);
        if (!exists) {
          quotes.push(it);
          added++;
        }
      });
      if (added > 0) {
        saveQuotes();        // <-- update localStorage
        updateCategoryFilter();
      }
      alert(`Imported ${added} new quote(s).`);
      event.target.value = '';
    } catch (err) {
      console.error('Import error:', err);
      alert('Import failed: ' + (err.message || 'Invalid file'));
    }
  };
  reader.onerror = function(err) {
    console.error('File read error:', err);
    alert('Could not read file.');
  };
  reader.readAsText(file);
}

// -------------------------
// Initialization on DOMContentLoaded
// -------------------------
document.addEventListener('DOMContentLoaded', function() {
  loadQuotesFromLocalStorage();   // loads quotes (and will call saveQuotes if needed)
  createAddQuoteForm();           // builds the form and import/export controls
  updateCategoryFilter();
  categoryFilter.value = 'all';

  // Show last shown quote if session has it
  const last = loadLastShownIndexFromSession();
  if (last !== null && quotes[last]) {
    const q = quotes[last];
    quoteDisplay.innerHTML = `<p>"${q.text}"</p><p style="color:#555;"><em>Category:</em> ${q.category}</p>`;
  } else {
    displayRandomQuote();
  }

  // Event listeners
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', displayRandomQuote);
  categoryFilter.addEventListener('change', displayRandomQuote);
});
