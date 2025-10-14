// Step 1: Create an array of quote objects with text and category properties
const quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Do what you can, with what you have, where you are.", category: "Inspiration" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "Your limitation—it’s only your imagination.", category: "Motivation" },
  { text: "Happiness depends upon ourselves.", category: "Philosophy" }
];

// Step 2: Select DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");

// Step 3: Function to show a random quote
function showRandomQuote() {
  // Pick a random quote from the quotes array
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  // Display quote text and category in the page
  quoteDisplay.textContent = `"${randomQuote.text}" — (${randomQuote.category})`;
}

// Step 4: Show a quote when the button is clicked
newQuoteButton.addEventListener("click", showRandomQuote);

// Step 5: Optionally show an initial quote when page loads
document.addEventListener("DOMContentLoaded", showRandomQuote);

// Step 6: Function to add new quotes dynamically
function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (newQuoteText === "" || newQuoteCategory === "") {
    alert("Please enter both a quote and a category!");
    return;
  }

  // Add new quote to the array
  quotes.push({
    text: newQuoteText,
    category: newQuoteCategory
  });

  alert("Quote added successfully!");
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}
