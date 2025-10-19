
  const API_URL = "https://jsonplaceholder.typicode.com/posts";
  let quotes = JSON.parse(localStorage.getItem("quotes")) || [];
  let quotesViewed = 0;

  const syncIndicator = document.getElementById("syncIndicator");
  const syncText = document.getElementById("syncText");
  const totalQuotes = document.getElementById("totalQuotes");
  const totalCategories = document.getElementById("totalCategories");
  const quotesViewedDisplay = document.getElementById("quotesViewed");
  const lastSyncTime = document.getElementById("lastSyncTime");
  const categoryFilter = document.getElementById("categoryFilter");
  const quoteDisplay = document.getElementById("quoteDisplay");

  // ---------- Utility ----------
  function saveToLocalStorage() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
    updateStats();
  }

  function showNotification(message, type = "info") {
    const note = document.createElement("div");
    note.className = `notification ${type}`;
    note.innerText = message;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 4000);
  }

  function updateStats() {
    totalQuotes.innerText = quotes.length;
    totalCategories.innerText = [...new Set(quotes.map(q => q.category))].length;
    quotesViewedDisplay.innerText = quotesViewed;
  }

  // ---------- UI: Show Random Quote ----------
  function showRandomQuote() {
    if (quotes.length === 0) {
      quoteDisplay.innerHTML = `<div class="empty-state">No quotes available. Please sync or add new ones.</div>`;
      return;
    }
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    quoteDisplay.innerHTML = `
      <div class="quote-text">"${random.text}"</div>
      <div class="quote-category">${random.category}</div>
    `;
    quotesViewed++;
    updateStats();
  }

  // ---------- Add New Quote ----------
  function addQuote() {
    const text = document.getElementById("newQuoteText").value.trim();
    const category = document.getElementById("newQuoteCategory").value.trim();
    if (!text || !category) return showNotification("Please fill in both fields!", "warning");
    const newQuote = {
      id: Date.now(),
      text,
      category,
      updatedAt: new Date().toISOString()
    };
    quotes.push(newQuote);
    saveToLocalStorage();
    showNotification("Quote added locally!", "info");
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  }

  function toggleAddQuoteForm() {
    const form = document.getElementById("addQuoteForm");
    form.style.display = form.style.display === "block" ? "none" : "block";
  }

  // ---------- Server Sync Simulation ----------
  async function syncWithServer() {
    try {
      syncIndicator.classList.add("syncing");
      syncText.innerText = "Syncing with server...";
      showNotification("Syncing data with server...", "info");

      // Simulate fetching quotes from server
      const response = await fetch(API_URL);
      const serverData = await response.json();

      // Convert server data into quote format (simulate categories)
      const serverQuotes = serverData.slice(0, 10).map(item => ({
        id: item.id,
        text: item.title,
        category: ["Motivation", "Life", "Wisdom"][item.id % 3],
        updatedAt: new Date().toISOString()
      }));

      // Conflict resolution: Server wins
      const conflicts = [];
      serverQuotes.forEach(serverQuote => {
        const local = quotes.find(q => q.id === serverQuote.id);
        if (local && local.text !== serverQuote.text) {
          conflicts.push({ local, server: serverQuote });
        }
      });

      if (conflicts.length > 0) {
        showNotification(`${conflicts.length} conflicts resolved (server data kept)`, "warning");
      }

      quotes = mergeQuotes(quotes, serverQuotes);
      saveToLocalStorage();

      syncIndicator.classList.remove("syncing");
      syncText.innerText = "Status: Synced ✅";
      lastSyncTime.innerText = new Date().toLocaleTimeString();
      showNotification("Data synced successfully!", "info");
    } catch (error) {
      console.error(error);
      syncIndicator.classList.add("error");
      syncText.innerText = "Sync failed ❌";
      showNotification("Sync failed. Check your connection.", "error");
    } finally {
      syncIndicator.classList.remove("syncing");
    }
  }

  // ---------- Merge and Resolve Conflicts ----------
  function mergeQuotes(local, server) {
    const merged = [...server];
    const serverIds = server.map(q => q.id);
    local.forEach(lq => {
      if (!serverIds.includes(lq.id)) merged.push(lq);
    });
    return merged;
  }

  // ---------- Import / Export ----------
  function exportToJsonFile() {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quotes.json";
    link.click();
  }

  function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        quotes = mergeQuotes(quotes, imported);
        saveToLocalStorage();
        showNotification("Quotes imported successfully!", "info");
      } catch (err) {
        showNotification("Invalid file format.", "error");
      }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    if (confirm("Are you sure you want to clear all local data?")) {
      quotes = [];
      localStorage.removeItem("quotes");
      updateStats();
      quoteDisplay.innerHTML = `<div class="empty-state">All data cleared.</div>`;
    }
  }

  // ---------- Initialize ----------
  updateStats();
  setInterval(syncWithServer, 20000); // Sync every 20 seconds

