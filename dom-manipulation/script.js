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

// Step 3: Function to display a random quote (uses innerHTML)
function displayRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  // Use innerHTML so we can include simple HTML formatting
  quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <p><em>Category:</em> ${randomQuote.category}</p>
  `;
}

// Step 4: Add event listener to the "Show New Quote" button
newQuoteButton.addEventListener("click", displayRandomQuote);

// Step 5: Display one quote when the page first loads
document.addEventListener("DOMContentLoaded", displayRandomQuote);

// Step 6: Function to add new quotes
function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (newQuoteText === "" || newQuoteCategory === "") {
    alert("Please enter both a quote and a category!");
    return;
  }

  // Add the new quote object to the array
  quotes.push({ text: newQuoteText, category: newQuoteCategory });

  alert("Quote added successfully!");
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}
