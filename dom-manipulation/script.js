   // Storage Keys
    const STORAGE_KEY = 'dynamicQuoteGenerator_quotes';
    const SESSION_KEY = 'quoteGenerator_session';
    const FILTER_KEY = 'quoteGenerator_lastFilter';
    const SYNC_KEY = 'quoteGenerator_lastSync';

    // Server Configuration - Using DummyJSON quotes API
    const SERVER_URL = 'https://dummyjson.com/quotes';
    const SYNC_INTERVAL = 30000; // 30 seconds

    // Application State
    let quotes = [];
    let currentFilter = 'all';
    let sessionData = {};
    let syncIntervalId = null;
    let isSyncing = false;
    let pendingConflicts = [];

    // Default Quotes
    const defaultQuotes = [
      { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "motivation", id: "local-1" },
      { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "innovation", id: "local-2" },
      { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "life", id: "local-3" }
    ];

    // Initialize
    function init() {
      quotes = loadQuotes();
      currentFilter = loadLastFilter();
      sessionData = loadSessionData();
      
      populateCategories();
      updateStats();
      updateLastSyncDisplay();
      
      if (sessionData.lastViewedQuote) {
        const quote = quotes.find(q => q.quote === sessionData.lastViewedQuote);
        if (quote) displayQuote(quote);
      }
      
      startAutoSync();
      setTimeout(() => syncWithServer(), 2000);
    }

    function loadQuotes() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Error loading quotes:', e);
      }
      return [...defaultQuotes];
    }

    function saveQuotes() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
        updateStats();
      } catch (e) {
        console.error('Error saving:', e);
      }
    }

    function loadLastFilter() {
      return localStorage.getItem(FILTER_KEY) || 'all';
    }

    function saveLastFilter(filter) {
      localStorage.setItem(FILTER_KEY, filter);
    }

    function loadSessionData() {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return { quotesViewed: 0, lastViewedQuote: null, sessionStart: new Date().toISOString() };
    }

    function saveSessionData() {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }

    function getCategories() {
      const cats = [...new Set(quotes.map(q => q.category || q.author || 'general'))];
      return cats.filter(c => c).sort();
    }

    function populateCategories() {
      const select = document.getElementById('categoryFilter');
      select.innerHTML = '<option value="all">All Categories</option>';
      
      getCategories().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        select.appendChild(option);
      });
      
      select.value = currentFilter;
    }

    function filterQuotes() {
      currentFilter = document.getElementById('categoryFilter').value;
      saveLastFilter(currentFilter);
      updateStats();
      showRandomQuote();
    }

    function getFilteredQuotes() {
      if (currentFilter === 'all') return quotes;
      return quotes.filter(q => (q.category || q.author) === currentFilter);
    }

    function showRandomQuote() {
      const filtered = getFilteredQuotes();
      if (filtered.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = '<div style="text-align: center; color: #718096;">No quotes in this category</div>';
        return;
      }

      const quote = filtered[Math.floor(Math.random() * filtered.length)];
      
      sessionData.quotesViewed++;
      sessionData.lastViewedQuote = quote.quote;
      saveSessionData();
      
      displayQuote(quote);
    }

    function displayQuote(quote) {
      const display = document.getElementById('quoteDisplay');
      display.style.opacity = '0';
      
      setTimeout(() => {
        display.innerHTML = `
          <div class="quote-text">"${quote.quote}"</div>
          <div class="quote-author">— ${quote.author || quote.category || 'Unknown'}</div>
        `;
        display.style.opacity = '1';
        updateStats();
      }, 200);
    }

    function toggleAddQuoteForm() {
      const form = document.getElementById('addQuoteForm');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }

    function addQuote() {
      const text = document.getElementById('newQuoteText').value.trim();
      const category = document.getElementById('newQuoteCategory').value.trim().toLowerCase();
      
      if (!text || !category) {
        showNotification('Please fill in all fields', 'error');
        return;
      }
      
      if (quotes.some(q => q.quote.toLowerCase() === text.toLowerCase())) {
        showNotification('Quote already exists', 'error');
        return;
      }
      
      const newQuote = {
        quote: text,
        author: category,
        category: category,
        id: `local-${Date.now()}`
      };
      
      quotes.push(newQuote);
      saveQuotes();
      populateCategories();
      
      document.getElementById('newQuoteText').value = '';
      document.getElementById('newQuoteCategory').value = '';
      
      showNotification('Quote added successfully!');
      displayQuote(newQuote);
      toggleAddQuoteForm();
    }

    function exportToJsonFile() {
      const dataStr = JSON.stringify(quotes, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotes_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Quotes exported!');
    }

    function importFromJsonFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if (!Array.isArray(imported)) {
            showNotification('Invalid format', 'error');
            return;
          }
          
          const valid = imported.filter(q => q && q.quote && typeof q.quote === 'string');
          const newQuotes = valid.filter(imp =>
            !quotes.some(ex => ex.quote.toLowerCase() === imp.quote.toLowerCase())
          );
          
          if (newQuotes.length === 0) {
            showNotification('All quotes exist', 'warning');
            return;
          }
          
          quotes.push(...newQuotes);
          saveQuotes();
          populateCategories();
          showNotification(`Imported ${newQuotes.length} quote(s)!`);
        } catch (err) {
          showNotification('Error reading file', 'error');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    function clearAllData() {
      if (confirm('Clear all quotes?')) {
        quotes = [...defaultQuotes];
        saveQuotes();
        populateCategories();
        showNotification('Data cleared!');
      }
    }

    function updateStats() {
      const filtered = getFilteredQuotes();
      document.getElementById('totalQuotes').textContent = 
        currentFilter === 'all' ? quotes.length : `${filtered.length}/${quotes.length}`;
      document.getElementById('totalCategories').textContent = getCategories().length;
      document.getElementById('quotesViewed').textContent = sessionData.quotesViewed;
    }

    function startAutoSync() {
      if (syncIntervalId) clearInterval(syncIntervalId);
      syncIntervalId = setInterval(() => syncWithServer(), SYNC_INTERVAL);
    }

    async function syncWithServer() {
      if (isSyncing) {
        showNotification('Sync in progress', 'info');
        return;
      }
      
      isSyncing = true;
      updateSyncStatus('syncing', 'Syncing with server...');
      document.getElementById('manualSyncBtn').disabled = true;
      
      try {
        // Fetch from DummyJSON quotes API
        const response = await fetch(SERVER_URL + '?limit=20');
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        const serverQuotes = data.quotes;
        
        // Add category based on author name or use motivation as default
        serverQuotes.forEach(q => {
          if (!q.category) {
            q.category = q.author.split(' ')[0].toLowerCase();
          }
        });
        
        // Merge with conflict detection
        const result = mergeQuotes(quotes, serverQuotes);
        
        if (result.conflicts.length > 0) {
          pendingConflicts = result.conflicts;
          showConflictModal(result.conflicts);
          updateSyncStatus('ready', `${result.conflicts.length} conflict(s) detected`);
          showNotification(`Found ${result.conflicts.length} conflict(s)`, 'warning');
        } else {
          const newCount = result.merged.length - quotes.length;
          if (newCount > 0) {
            quotes = result.merged;
            saveQuotes();
            populateCategories();
            showNotification(`Synced! Added ${newCount} quote(s)`, 'info');
          }
          updateSyncStatus('ready', 'Sync complete');
        }
        
        localStorage.setItem(SYNC_KEY, new Date().toISOString());
        updateLastSyncDisplay();
        
      } catch (error) {
        console.error('Sync error:', error);
        updateSyncStatus('error', 'Sync failed');
        showNotification('Sync failed. Try again.', 'error');
      } finally {
        isSyncing = false;
        document.getElementById('manualSyncBtn').disabled = false;
      }
    }

    function mergeQuotes(local, server) {
      const merged = [...local];
      const conflicts = [];
      
      server.forEach(serverQuote => {
        // Check for existing by ID
        const existingById = merged.find(q => q.id === serverQuote.id);
        
        if (existingById) {
          // Check if content differs (conflict)
          if (existingById.quote !== serverQuote.quote || existingById.author !== serverQuote.author) {
            conflicts.push({
              local: existingById,
              server: serverQuote,
              type: 'modified'
            });
          }
        } else {
          // Check for duplicate quote text
          const duplicate = merged.find(q => 
            q.quote.toLowerCase().trim() === serverQuote.quote.toLowerCase().trim()
          );
          
          if (duplicate) {
            conflicts.push({
              local: duplicate,
              server: serverQuote,
              type: 'duplicate'
            });
          } else {
            // New quote - add it
            merged.push(serverQuote);
          }
        }
      });
      
      return { merged, conflicts };
    }

    function showConflictModal(conflicts) {
      const modal = document.createElement('div');
      modal.className = 'conflict-modal';
      modal.id = 'conflictModal';
      
      let html = `
        <div class="conflict-content">
          <h2>⚠️ Sync Conflicts Detected</h2>
          <p>Found ${conflicts.length} conflict(s) during sync. Choose how to resolve:</p>
      `;
      
      conflicts.forEach((conflict, i) => {
        html += `
          <div class="conflict-item">
            <p><strong>Conflict ${i + 1}:</strong> ${conflict.type}</p>
            <p><strong>Local:</strong> "${conflict.local.quote}" — ${conflict.local.author || conflict.local.category}</p>
            <p><strong>Server:</strong> "${conflict.server.quote}" — ${conflict.server.author || conflict.server.category}</p>
          </div>
        `;
      });
      
      html += `
        <p><strong>Recommended:</strong> Use server version (server data takes precedence)</p>
        <div class="conflict-buttons">
          <button onclick="resolveConflicts('server')">Use Server (Recommended)</button>
          <button onclick="resolveConflicts('local')">Keep Local</button>
          <button class="secondary-btn" onclick="resolveConflicts('both')">Keep Both</button>
          <button class="danger-btn" onclick="closeConflictModal()">Cancel</button>
        </div>
        </div>
      `;
      
      modal.innerHTML = html;
      document.body.appendChild(modal);
    }

    function resolveConflicts(strategy) {
      const conflicts = pendingConflicts;
      
      if (strategy === 'server') {
        // Server data takes precedence - replace local with server
        conflicts.forEach(conflict => {
          const index = quotes.findIndex(q => q.id === conflict.local.id || q.quote === conflict.local.quote);
          if (index !== -1) {
            quotes[index] = conflict.server;
          } else {
            quotes.push(conflict.server);
          }
        });
        showNotification('Conflicts resolved: Server version applied', 'info');
      } else if (strategy === 'local') {
        // Keep local, ignore server
        showNotification('Conflicts resolved: Local version kept', 'info');
      } else if (strategy === 'both') {
        // Keep both versions
        conflicts.forEach(conflict => {
          const hasServer = quotes.some(q => q.id === conflict.server.id);
          if (!hasServer) {
            quotes.push(conflict.server);
          }
        });
        showNotification('Conflicts resolved: Kept both versions', 'info');
      }
      
      saveQuotes();
      populateCategories();
      updateStats();
      closeConflictModal();
      pendingConflicts = [];
    }

    function closeConflictModal() {
      const modal = document.getElementById('conflictModal');
      if (modal) modal.remove();
    }

    function updateSyncStatus(status, message) {
      const indicator = document.getElementById('syncIndicator');
      const text = document.getElementById('syncText');
      
      indicator.className = 'sync-indicator';
      if (status === 'syncing') indicator.classList.add('syncing');
      if (status === 'error') indicator.classList.add('error');
      
      text.textContent = message;
    }

    function updateLastSyncDisplay() {
      const lastSync = localStorage.getItem(SYNC_KEY);
      const display = document.getElementById('lastSyncTime');
      
      if (lastSync) {
        const date = new Date(lastSync);
        const now = new Date();
        const diffMin = Math.floor((now - date) / 60000);
        
        if (diffMin < 1) display.textContent = 'Just now';
        else if (diffMin < 60) display.textContent = `${diffMin}m ago`;
        else display.textContent = date.toLocaleTimeString();
      } else {
        display.textContent = 'Never';
      }
    }

    function showNotification(message, type = 'success') {
      const notif = document.createElement('div');
      notif.className = `notification ${type}`;
      notif.textContent = message;
      
      document.body.appendChild(notif);
      
      setTimeout(() => {
        notif.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notif.remove(), 300);
      }, 3000);
    }

    // Start app
    init();