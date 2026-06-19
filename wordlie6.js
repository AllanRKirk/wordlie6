/* wordlie6.js — final patched version with reliable New Game reset */
/* allan */

document.addEventListener("DOMContentLoaded", () => {

// -------------------- Element references --------------------
const GAME_VERSION = "v1";
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");
const cheer = document.getElementById("cheer-sound");
const statsBox = document.getElementById("stats");

const deleteBtn = document.getElementById("delete");
const enterBtn = document.getElementById("enter");
const newGameBtn = document.getElementById("new-game");
const showHintBtn = document.getElementById("show-hint");
const revealBtn = document.getElementById("reveal");
const helpModal = document.getElementById("help-modal");
const instructionsBtn = document.getElementById("instructions");
const closeHelpBtn = document.getElementById("close-help");

// -------------------- Game state --------------------
let correctWord;
if (Array.isArray(WORDS) && WORDS.length > 0) {
  correctWord = WORDS[Math.floor(Math.random() * WORDS.length)];
} else {
  // Fallback so the game still runs even if dictionary.js fails
  correctWord = "PUZZLE";
  console.warn("WORDS not available; using fallback word:", correctWord);
}

let currentRow = 0;
let currentCol = 0;
const rows = 6;
const cols = 6;
const grid = [];
let hintUsed = false;
let gameOver = false;

// -------------------- Stats --------------------
let timesCorrect = 0;
let gamesPlayed = 0;
let currentStreak = 0;
let bestStreak = 0;

// -------------------- Load stats --------------------
function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem("wordlie6stats"));
    if (saved) {
      timesCorrect = saved.timesCorrect || 0;
      gamesPlayed = saved.gamesPlayed || 0;
      currentStreak = saved.currentStreak || 0;
      bestStreak = saved.bestStreak || 0;
    }
  } catch (e) {}
}

// -------------------- Save stats --------------------
function saveStats() {
  const data = { timesCorrect, gamesPlayed, currentStreak, bestStreak };
  localStorage.setItem("wordlie6stats", JSON.stringify(data));
}

// -------------------- Update stats display --------------------
function updateStats() {
  const winPercent =
    gamesPlayed > 0 ? Math.round((timesCorrect / gamesPlayed) * 100) : 0;
  statsBox.textContent =
    `Times Correct: ${timesCorrect} | Games Played: ${gamesPlayed} | Win %: ${winPercent}% | Streak: ${currentStreak} | Best: ${bestStreak}`;
}

loadStats();
updateStats();

// -------------------- Build the board --------------------
for (let r = 0; r < rows; r++) {
  const row = document.createElement("div");
  row.classList.add("row");
  const rowTiles = [];
  for (let c = 0; c < cols; c++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    row.appendChild(tile);
    rowTiles.push(tile);
  }
  board.appendChild(row);
  grid.push(rowTiles);
}

// -------------------- Build the keyboard --------------------
const layout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
layout.forEach(line => {
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("key-row");
  line.split("").forEach(ch => {
    const key = document.createElement("button");
    key.textContent = ch;
    key.classList.add("key");
    key.addEventListener("click", () => pressKey(ch));
    rowDiv.appendChild(key);
  });
  keyboard.appendChild(rowDiv);
});

const keyButtons = Array.from(document.querySelectorAll(".key"));

// -------------------- Keyboard input --------------------
function pressKey(key) {
  if (gameOver) return;
  if (currentRow >= rows) return;
  if (currentCol < cols) {
    grid[currentRow][currentCol].textContent = key;
    currentCol++;
  }
}

deleteBtn.addEventListener("click", () => {
  if (gameOver) return;
  if (currentCol > 0) {
    currentCol--;
    grid[currentRow][currentCol].textContent = "";
    message.textContent = "";
  }
});

enterBtn.addEventListener("click", handleGuess);

// -------------------- How to Play Modal --------------------
instructionsBtn.addEventListener("click", () => helpModal.classList.remove("hidden"));
closeHelpBtn.addEventListener("click", () => helpModal.classList.add("hidden"));
window.addEventListener("click", e => { if (e.target === helpModal) helpModal.classList.add("hidden"); });

// -------------------- Process guess --------------------
function handleGuess() {
  if (gameOver) return;
  if (currentRow >= rows) return;
  if (currentCol < cols) return;

  const guess = grid[currentRow].map(t => t.textContent).join("");
  if (!Array.isArray(WORDS) || !WORDS.includes(guess)) {
    message.textContent = "Not in word list!";
    return;
  }

  const letterCounts = {};
  for (const ch of correctWord) letterCounts[ch] = (letterCounts[ch] || 0) + 1;
  const result = Array(cols).fill("absent");

  // Greens
  for (let i = 0; i < cols; i++) {
    if (guess[i] === correctWord[i]) {
      result[i] = "correct";
      letterCounts[guess[i]]--;
    }
  }

  // Yellows
  for (let i = 0; i < cols; i++) {
    if (result[i] === "correct") continue;
    const letter = guess[i];
    if (letterCounts[letter] > 0) {
      result[i] = "present";
      letterCounts[letter]--;
    }
  }

  // Apply colours
  for (let i = 0; i < cols; i++) {
    const tile = grid[currentRow][i];
    const letter = guess[i];
    let color = "#666";
    if (result[i] === "correct") color = "green";
    else if (result[i] === "present") color = "gold";
    tile.style.backgroundColor = color;
    colorKey(letter, color);
  }

  if (guess === correctWord) {
    handleWin();
    return;
  }

  currentRow++;
  currentCol = 0;
  if (currentRow >= rows) handleLoss();
}

// -------------------- Win / Loss handling --------------------
function handleWin() {
  timesCorrect++;
  gamesPlayed++;
  currentStreak++;
  if (currentStreak > bestStreak) bestStreak = currentStreak;
  saveStats();
  updateStats();

  flashWinningRow(currentRow);
  showCelebration();
  showCongratsOverlay();
  message.textContent = "Select New Game to continue";

  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "new-game") btn.disabled = true;
  });

  // Allow New Game to respond
  gameOver = false;
}

function handleLoss() {
  gamesPlayed++;
  currentStreak = 0;
  message.textContent = `Game Over! Word was ${correctWord}`;
  saveStats();
  updateStats();

  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "new-game") btn.disabled = true;
  });

  currentRow = 0;
  currentCol = 0;
  gameOver = false;
}

// -------------------- Version Display --------------------
document.getElementById("version-display").textContent = "Version: " + GAME_VERSION;

// -------------------- Flash winning row --------------------
function flashWinningRow(rowIndex) {
  const tiles = grid[rowIndex];
  tiles.forEach(tile => tile.classList.add("flash-tile"));
}

// -------------------- Big congratulations overlay --------------------
function showCongratsOverlay() {
  const overlay = document.getElementById("congrats-overlay");
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("hidden"), 2500);
}

// -------------------- Keyboard colouring --------------------
function colorKey(letter, color) {
  keyButtons.forEach(key => {
    if (key.textContent === letter) {
      const current = key.style.backgroundColor;
      if (
        color === "green" ||
        (color === "gold" && current !== "green") ||
        (color === "#666" && current !== "green" && current !== "gold")
      ) key.style.backgroundColor = color;
    }
  });
}

// -------------------- Buttons --------------------
newGameBtn.addEventListener("click", resetGame);
showHintBtn.addEventListener("click", showHint);
revealBtn.addEventListener("click", revealWord);

// -------------------- Hint logic --------------------
function showHint() {
  if (gameOver) return;
  if (hintUsed) { message.textContent = "Hint already used!"; return; }
  hintUsed = true;
  const index = Math.floor(Math.random() * correctWord.length);
  const letter = correctWord[index];
  message.textContent = `Hint: Letter ${index + 1} is '${letter}'`;
}

// -------------------- Reveal word --------------------
function revealWord() {
  if (gameOver) return;
  message.textContent = `The word is ${correctWord}`;
  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "new-game") btn.disabled = true;
  });
  gameOver = false;
}

// -------------------- Reset game --------------------
function resetGame() {
  gameOver = false;

  document.querySelectorAll("button").forEach(btn => {
    btn.disabled = false;
  });

  board.querySelectorAll(".tile").forEach(tile => {
    tile.textContent = "";
    tile.style.backgroundColor = "black";
    tile.classList.remove("flash-tile");
  });

  keyButtons.forEach(k => {
    k.style.backgroundColor = "black";
  });

  message.textContent = "";
  currentRow = 0;
  currentCol = 0;
  hintUsed = false;

  if (Array.isArray(WORDS) && WORDS.length > 0) {
    correctWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  } else {
    correctWord = "PUZZLE";
    console.warn("WORDS not available on reset; using fallback word:", correctWord);
  }

  updateStats();
}

// -------------------- Celebration animation --------------------
function showCelebration() {
  cheer.currentTime = 0;
  cheer.play();

  for (let i = 0; i < 50; i++) {
    const star = document.createElement("div");
    star.classList.add("star");
    star.style.left = Math.random() * window.innerWidth + "px";
    star.style.bottom = "0px";
    star.style.animationDuration = (1.5 + Math.random() * 1.5) + "s";
    star.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.appendChild(star);
    star.addEventListener("animationend", () => star.remove());
  }
}

}); // END DOMContentLoaded
