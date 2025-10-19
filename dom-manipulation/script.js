  // Local Storage Keys
    const STORAGE_KEY = 'dynamicQuoteGenerator_quotes';
    const SESSION_KEY = 'quoteGenerator_session';
    const FILTER_KEY = 'quoteGenerator_lastFilter';
    const SYNC_KEY = 'quoteGenerator_lastSync';

    // Server simulation endpoint (using JSONPlaceholder-style data structure)
    const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';
    
    // Sync configuration
    const SYNC_INTERVAL = 60000; // 60 seconds
    let syncIntervalId = null;
    let isSyncing = false;

    // Default quotes
    const defaultQuotes = [
      { text: "The only way to do great work is to love what you do.", category: "motivation", id: "local-1" },
      { text: "Innovation distinguishes between a leader and a follower.", category: "innovation", id: "local-2" },
      { text: "Life is what happens when you're busy making other plans.", category: "life", id: "local-3" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", category: "inspiration", id: "local-4" },
      { text: "Strive not to be a success, but rather to be of value.", category: "success", id: "local-5" },
      { text: "The only impossible journey is the one you never begin.", category: "motivation", id: "local-6" },
      { text: "Everything you've ever wanted is on the other side of fear.", category: "courage", id: "local-7" },
      { text: "Believe you can and you're halfway there.", category: "inspiration", id: "local-8" },
      { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "wisdom", id: "local-9" },
      { text: "Your time is limited, don't waste it living someone else's life.", category: "life", id: "local-10" }
    ];

    // Initialize application state
    let quotes = loadQuotes();
    let currentFilter = loadLastFilter();
    let displayedQuoteIndex = -1;
    let sessionData = loadSessionData();
    let conflictsDetected = [];

    // Load quotes from local storage
    function loadQuotes() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading quotes:', e);
      }
      return [...defaultQuotes];
    }

    // Save quotes to local storage
    function saveQuotes() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
        updateStats();
      } catch (e) {
        console.error('Error saving quotes:', e);
        showNotification('Error saving quotes!', 'error');
      }
    }

    // Load last filter
    function loadLastFilter() {
      try {
        return localStorage.getItem(FILTER_KEY) || 'all';
      } catch (e) {
        return 'all';
      }
    }

    // Save last filter
    function saveLastFilter(filter) {
      try {
        localStorage.setItem(FILTER_KEY, filter);
      } catch (e) {
        console.error('Error saving filter:', e);
      }
    }

    // Load session data
    function loadSessionData() {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error loading session data:', e);
      }
      return {
        quotesViewed: 0,
        lastViewedQuote: null,
        sessionStart: new Date().toISOString()
      };
    }

    // Save session data
    function saveSessionData() {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        updateSessionInfo();
      } catch (e) {
        console.error('Error saving session data:', e);
      }
    }

    // Get last sync time
    function getLastSyncTime() {
      try {
        return localStorage.getItem(SYNC_KEY);
      } catch (e) {
        return null;
      }
    }

    // Set last sync time
    function setLastSyncTime() {
      try {
        const now = new Date().toISOString();
        localStorage.setItem(SYNC_KEY, now);
        updateLastSyncDisplay();
      } catch (e) {
        console.error('Error saving sync time:', e);
      }
    }

    // Update last sync display
    function updateLastSyncDisplay() {
      const lastSync = getLastSyncTime();
      const display = document.getElementById('lastSync');
      if (lastSync) {
        const date = new Date(lastSync);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);
        if (diffMinutes < 1) {
          display.textContent = 'Just now';
        } else if (diffMinutes < 60) {
          display.textContent = `${diffMinutes}m ago`;
        } else {
          display.textContent = date.toLocaleTimeString();
        }
      } else {
        display.textContent = 'Never';
      }
    }

    // Initialize the application
    function init() {
      populateCategories();
      createCategoryFilters();
      setupEventListeners();
      updateStats();
      updateSessionInfo();
      updateLastSyncDisplay();
      setFilterUI(currentFilter);
      
      if (sessionData.lastViewedQuote) {
        const quote = quotes.find(q => q.text === sessionData.lastViewedQuote);
        if (quote) {
          displayQuote(quote);
        }
      }

      // Start automatic syncing
      startAutoSync();
      
      // Perform initial sync
      setTimeout(() => syncWithServer(), 2000);
    }

    // Setup event listeners
    function setupEventListeners() {
      document.getElementById('newQuote').addEventListener('click', showRandomQuote);
      document.getElementById('toggleForm').addEventListener('click', toggleAddQuoteForm);
    }

    // Start automatic syncing
    function startAutoSync() {
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
      }
      syncIntervalId = setInterval(() => {
        syncWithServer();
      }, SYNC_INTERVAL);
    }

    // Manual sync trigger
    function manualSync() {
      if (isSyncing) {
        showNotification('Sync already in progress...', 'info');
        return;
      }
      syncWithServer();
    }

    // Sync with server
    async function syncWithServer() {
      if (isSyncing) return;
      
      isSyncing = true;
      updateSyncStatus('syncing', 'Syncing with server...');
      
      try {
        // Simulate fetching data from server
        const response = await fetch(SERVER_URL + '?_limit=5');
        const serverData = await response.json();
        
        // Transform server data into quote format
        const serverQuotes = serverData.map((post, index) => ({
          text: post.title,
          category: post.userId === 1 ? 'inspiration' : 
                    post.userId === 2 ? 'wisdom' : 
                    post.userId === 3 ? 'motivation' : 'life',
          id: `server-${post.id}`,
          source: 'server'
        }));
        
        // Simulate server processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Merge with local data
        const result = mergeQuotes(quotes, serverQuotes);
        
        if (result.conflicts.length > 0) {
          conflictsDetected = result.conflicts;
          showConflictResolutionModal(result.conflicts);
          updateSyncStatus('error', `Sync complete with ${result.conflicts.length} conflict(s)`);
        } else if (result.merged.length > quotes.length) {
          quotes = result.merged;
          saveQuotes();
          populateCategories();
          createCategoryFilters();
          const newCount = result.merged.length - quotes.length + result.conflicts.length;
          showNotification(`Sync successful! Added ${newCount} new quote(s)`, 'info');
          updateSyncStatus('success', 'Sync successful');
        } else {
          updateSyncStatus('success', 'Already up to date');
        }
        
        setLastSyncTime();
        
      } catch (error) {
        console.error('Sync error:', error);
        updateSyncStatus('error', 'Sync failed');
        showNotification('Sync failed. Check connection.', 'error');
      } finally {
        isSyncing = false;
        setTimeout(() => {
          if (!conflictsDetected.length) {
            updateSyncStatus('ready', 'Ready to sync');
          }
        }, 3000);
      }
    }

    // Merge quotes with conflict detection
    function mergeQuotes(localQuotes, serverQuotes) {
      const merged = [...localQuotes];
      const conflicts = [];
      
      serverQuotes.forEach(serverQuote => {
        // Check for exact match by ID
        const existingById = merged.find(q => q.id === serverQuote.id);
        
        if (existingById) {
          // Check if content differs (conflict)
          if (existingById.text !== serverQuote.text || 
              existingById.category !== serverQuote.category) {
            conflicts.push({
              local: existingById,
              server: serverQuote,
              type: 'modified'
            });
          }
        } else {
          // Check for duplicate text (potential conflict)
          const duplicateText = merged.find(q => 
            q.text.toLowerCase().trim() === serverQuote.text.toLowerCase().trim()
          );
          
          if (duplicateText) {
            conflicts.push({
              local: duplicateText,
              server: serverQuote,
              type: 'duplicate'
            });
          } else {
            // New quote from server - add it
            merged.push(serverQuote);
          }
        }
      });
      
      return { merged, conflicts };
    }

    // Show conflict resolution modal
    function showConflictResolutionModal(conflicts) {
      const modal = document.createElement('div');
      modal.className = 'conflict-modal';
      modal.id = 'conflictModal';
      
      let conflictHTML = '<div class="conflict-content"><h2>⚠️ Sync Conflicts Detected</h2>';
      conflictHTML += '<p>The following conflicts were found during sync:</p>';
      
      conflicts.forEach((conflict, index) => {
        conflictHTML += `
          <div class="conflict-item">
            <strong>Conflict ${index + 1}:</strong> ${conflict.type}<br>
            <strong>Local:</strong> "${conflict.local.text}" (${conflict.local.category})<br>
            <strong>Server:</strong> "${conflict.server.text}" (${conflict.server.category})
          </div>
        `;
      });
      
      conflictHTML += `
        <div class="conflict-buttons">
          <button onclick="resolveConflicts('server')">Use Server Version</button>
          <button onclick="resolveConflicts('local')">Keep Local Version</button>
          <button class="secondary-btn" onclick="resolveConflicts('both')">Keep Both</button>
          <button class="danger-btn" onclick="closeConflictModal()">Cancel</button>
        </div>
      </div>`;
      
      modal.innerHTML = conflictHTML;
      document.body.appendChild(modal);
    }

    // Resolve conflicts
    function resolveConflicts(strategy) {
      if (strategy === 'server') {
        // Replace local with server data
        conflictsDetected.forEach(conflict => {
          const index = quotes.findIndex(q => q.id === conflict.local.id || 
                                           q.text === conflict.local.text);
          if (index !== -1) {
            quotes[index] = conflict.server;
          } else {
            quotes.push(conflict.server);
          }
        });
        showNotification('Conflicts resolved: Server version applied', 'info');
      } else if (strategy ===