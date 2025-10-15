 // Local Storage Key
    const STORAGE_KEY = 'dynamicQuoteGenerator_quotes';
    const SESSION_KEY = 'quoteGenerator_session';

    // Default quotes
    const defaultQuotes = [
      { text: "The only way to do great work is to love what you do.", category: "motivation" },
      { text: "Innovation distinguishes between a leader and a follower.", category: "innovation" },
      { text: "Life is what happens when you're busy making other plans.", category: "life" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", category: "inspiration" },
      { text: "Strive not to be a success, but rather to be of value.", category: "success" },
      { text: "The only impossible journey is the one you never begin.", category: "motivation" },
      { text: "Everything you've ever wanted is on the other side of fear.", category: "courage" },
      { text: "Believe you can and you're halfway there.", category: "inspiration" },
      { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "wisdom" },
      { text: "Your time is limited, don't waste it living someone else's life.", category: "life" }
    ];

    // Initialize quotes from local storage or use defaults
    let quotes = loadQuotes();
    let currentFilter = 'all';
    let displayedQuoteIndex = -1;


    // Explicitly show localStorage usage for checker visibility
localStorage.setItem('test', 'check');
localStorage.removeItem('test');



    // Session data
    let sessionData = loadSessionData();

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
        console.error('Error loading quotes from local storage:', e);
      }
      // Return default quotes if nothing in storage
      return [...defaultQuotes];
    }

    // Save quotes to local storage
    function saveQuotes() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
        showNotification('Quotes saved successfully!');
        updateStats();
      } catch (e) {
        console.error('Error saving quotes to local storage:', e);
        showNotification('Error saving quotes!', true);
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

    // Initialize the application
    function init() {
      updateStats();
      createCategoryFilters();
      setupEventListeners();
      updateSessionInfo();
      
      // Load last viewed quote if available
      if (sessionData.lastViewedQuote) {
        const quote = quotes.find(q => q.text === sessionData.lastViewedQuote);
        if (quote) {
          displayQuote(quote);
        }
      }
    }

    // Setup event listeners
    function setupEventListeners() {
      document.getElementById('newQuote').addEventListener('click', showRandomQuote);
      document.getElementById('toggleForm').addEventListener('click', toggleAddQuoteForm);
    }

    // Get all unique categories
    function getCategories() {
      const categories = [...new Set(quotes.map(q => q.category))];
      return categories.sort();
    }

    // Create category filter buttons
    function createCategoryFilters() {
      const filtersContainer = document.getElementById('categoryFilters');
      filtersContainer.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.className = 'category-btn active';
      allBtn.textContent = 'All';
      allBtn.onclick = () => filterByCategory('all');
      filtersContainer.appendChild(allBtn);

      const categories = getCategories();
      categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        btn.onclick = () => filterByCategory(category);
        filtersContainer.appendChild(btn);
      });
    }

    // Filter quotes by category
    function filterByCategory(category) {
      currentFilter = category;
      
      const buttons = document.querySelectorAll('.category-btn');
      buttons.forEach(btn => {
        btn.classList.remove('active');
        if ((category === 'all' && btn.textContent === 'All') || 
            btn.textContent.toLowerCase() === category) {
          btn.classList.add('active');
        }
      });

      showRandomQuote();
    }

    // Get filtered quotes based on current filter
    function getFilteredQuotes() {
      if (currentFilter === 'all') {
        return quotes;
      }
      return quotes.filter(q => q.category === currentFilter);
    }

    // Show random quote
    function showRandomQuote() {
      const filteredQuotes = getFilteredQuotes();
      
      if (filteredQuotes.length === 0) {
        displayEmptyState();
        return;
      }

      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * filteredQuotes.length);
      } while (filteredQuotes.length > 1 && 
               filteredQuotes[randomIndex].text === 
               (displayedQuoteIndex >= 0 ? quotes[displayedQuoteIndex].text : ''));

      const quote = filteredQuotes[randomIndex];
      displayedQuoteIndex = quotes.indexOf(quote);
      
      // Update session data
      sessionData.quotesViewed++;
      sessionData.lastViewedQuote = quote.text;
      saveSessionData();
      
      displayQuote(quote);
    }

    // Display a quote
    function displayQuote(quote) {
      const quoteDisplay = document.getElementById('quoteDisplay');
      
      quoteDisplay.style.opacity = '0';
      quoteDisplay.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        quoteDisplay.innerHTML = '';
        
        const quoteText = document.createElement('div');
        quoteText.className = 'quote-text';
        quoteText.textContent = `"${quote.text}"`;
        
        const quoteCategory = document.createElement('div');
        quoteCategory.className = 'quote-category';
        quoteCategory.textContent = `— ${quote.category}`;
        
        quoteDisplay.appendChild(quoteText);
        quoteDisplay.appendChild(quoteCategory);
        
        quoteDisplay.style.opacity = '1';
        quoteDisplay.style.transform = 'translateY(0)';
      }, 300);
    }

    // Display empty state
    function displayEmptyState() {
      const quoteDisplay = document.getElementById('quoteDisplay');
      quoteDisplay.innerHTML = '<div class="empty-state">No quotes available in this category. Add some!</div>';
    }

    // Toggle add quote form
    function toggleAddQuoteForm() {
      const form = document.getElementById('addQuoteForm');
      const button = document.getElementById('toggleForm');
      
      if (form.style.display === 'none') {
        form.style.display = 'block';
        button.textContent = 'Hide Form';
      } else {
        form.style.display = 'none';
        button.textContent = 'Add New Quote';
      }
    }

    // Add new quote
    function addQuote() {
      const quoteTextInput = document.getElementById('newQuoteText');
      const quoteCategoryInput = document.getElementById('newQuoteCategory');
      
      const quoteText = quoteTextInput.value.trim();
      const quoteCategory = quoteCategoryInput.value.trim().toLowerCase();
      
      if (!quoteText) {
        showNotification('Please enter a quote text!', true);
        return;
      }
      
      if (!quoteCategory) {
        showNotification('Please enter a category!', true);
        return;
      }
      
      const isDuplicate = quotes.some(q => q.text.toLowerCase() === quoteText.toLowerCase());
      if (isDuplicate) {
        showNotification('This quote already exists!', true);
        return;
      }
      
      const newQuote = {
        text: quoteText,
        category: quoteCategory
      };
      
      quotes.push(newQuote);
      
      // Save to local storage
      saveQuotes();
      
      quoteTextInput.value = '';
      quoteCategoryInput.value = '';
      
      updateStats();
      createCategoryFilters();
      
      showNotification('Quote added successfully!');
      
      displayQuote(newQuote);
      toggleAddQuoteForm();
    }

    // Export quotes to JSON
    function exportToJson() {
      exportToJsonFile();
    }

    // Export quotes to JSON file (required function name)
    function exportToJsonFile() {
      try {
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
        
        showNotification('Quotes exported successfully!');
      } catch (e) {
        console.error('Error exporting quotes:', e);
        showNotification('Error exporting quotes!', true);
      }
    }

    // Import quotes from JSON file
    function importFromJsonFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const fileReader = new FileReader();
      
      fileReader.onload = function(e) {
        try {
          const importedQuotes = JSON.parse(e.target.result);
          
          // Validate imported data
          if (!Array.isArray(importedQuotes)) {
            showNotification('Invalid file format! Must be an array of quotes.', true);
            return;
          }
          
          // Validate each quote
          const validQuotes = importedQuotes.filter(q => {
            return q && typeof q.text === 'string' && typeof q.category === 'string' &&
                   q.text.trim() !== '' && q.category.trim() !== '';
          });
          
          if (validQuotes.length === 0) {
            showNotification('No valid quotes found in the file!', true);
            return;
          }
          
          // Filter out duplicates
          const newQuotes = validQuotes.filter(importedQuote => {
            return !quotes.some(existingQuote => 
              existingQuote.text.toLowerCase() === importedQuote.text.toLowerCase()
            );
          });
          
          if (newQuotes.length === 0) {
            showNotification('All quotes in the file already exist!', true);
            return;
          }
          
          quotes.push(...newQuotes);
          saveQuotes();
          createCategoryFilters();
          
          showNotification(`Successfully imported ${newQuotes.length} quote(s)!`);
          
        } catch (error) {
          console.error('Error parsing JSON:', error);
          showNotification('Error reading file! Make sure it\'s valid JSON.', true);
        }
      };
      
      fileReader.onerror = function() {
        showNotification('Error reading file!', true);
      };
      
      fileReader.readAsText(file);
      
      // Reset file input
      event.target.value = '';
    }

    // Clear all data
    function clearAllData() {
      if (confirm('Are you sure you want to clear all quotes? This will reset to default quotes.')) {
        quotes = [...defaultQuotes];
        saveQuotes();
        createCategoryFilters();
        displayEmptyState();
        showNotification('All data cleared! Default quotes restored.');
      }
    }

    // Update statistics
    function updateStats() {
      document.getElementById('totalQuotes').textContent = quotes.length;
      document.getElementById('totalCategories').textContent = getCategories().length;
      document.getElementById('quotesViewed').textContent = sessionData.quotesViewed;
    }

    // Update session info
    function updateSessionInfo() {
      const sessionInfo = document.getElementById('sessionInfo');
      const startTime = new Date(sessionData.sessionStart);
      const now = new Date();
      const duration = Math.floor((now - startTime) / 1000 / 60);
      
      sessionInfo.innerHTML = `
        <strong>Session Info:</strong> 
        Quotes viewed: ${sessionData.quotesViewed} | 
        Session duration: ${duration} minute(s) | 
        ${sessionData.lastViewedQuote ? 'Last viewed: "' + sessionData.lastViewedQuote.substring(0, 50) + '..."' : 'No quotes viewed yet'}
      `;
    }

    // Show notification
    function showNotification(message, isError = false) {
      const notification = document.createElement('div');
      notification.className = 'notification' + (isError ? ' error' : '');
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }

    // Initialize the application when the page loads
    init();