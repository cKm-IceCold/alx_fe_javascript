// === Step 1: Create an array of quote objects ===
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", category: "Inspiration" },
  { text: "Don’t watch the clock; do what it does. Keep going.", category: "Motivation" },
  { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Life" }
];

// === Step 2: Get DOM elements ===
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

// === Step 3: Create the Add Quote Form dynamically ===
function createAddQuoteForm() {
  // Create form container
  const formContainer = document.createElement("div");
  formContainer.id = "addQuoteForm";

  // Create text input
  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  // Create category input
  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  // Create add button
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  // Append all to formContainer
  formContainer.appendChild(textInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addBtn);

  // Append to body (or any container you like)
  document.body.appendChild(formContainer);
}

// === Step 4: Create category dropdown ===
const categoryFilter = document.createElement("select");
categoryFilter.id = "categoryFilter";
document.body.insertBefore(categoryFilter, newQuoteBtn);

// === Step 5: Populate category dropdown dynamically ===
function updateCategoryFilter() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// === Step 6: Function to display a random quote ===
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  if (randomQuote) {
    quoteDisplay.innerHTML = `
      <p>"${randomQuote.text}"</p>
      <p><strong>Category:</strong> ${randomQuote.category}</p>
    `;
  } else {
    quoteDisplay.innerHTML = "<p>No quotes available for this category.</p>";
  }
}

// === Step 7: Function to add a new quote dynamically ===
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text && category) {
    quotes.push({ text, category });
    updateCategoryFilter();
    alert("Quote added successfully!");
    textInput.value = "";
    categoryInput.value = "";
  } else {
    alert("Please fill in both fields!");
  }
}

// === Step 8: Event Listeners ===
newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", showRandomQuote);

// === Step 9: Initialize on load ===
updateCategoryFilter();
createAddQuoteForm();
showRandomQuote();
