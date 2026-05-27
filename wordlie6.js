/* wordlie6.js — optimised persistent‑stats version */
/* allan */

// -------------------- Element references --------------------
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
let correctWord = WORDS[Math.floor(Math.random() * WORDS.length)];
let currentRow = 0;
let currentCol = 0;
const rows = 6;
const cols = 6;
const grid = [];
let hintUsed = false;
let gameOver = false;   // <--- NEW

// -------------------- Stats --------------------
let timesCorrect = 0;
let gamesPlayed = 0;
let currentStreak = 0;
let bestStreak = 0;

// -------------------- Load stats from localStorage --------------------
function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem("wordlie6stats"));
    if (saved) {
      timesCorrect = saved.timesCorrect || 0;
      gamesPlayed = saved.gamesPlayed || 0;
      currentStreak = saved.currentStreak || 0;
      bestStreak = saved.bestStreak || 0;
    }
  } catch (e) {
    // ignore corrupted data
  }
}

// -------------------- Save stats --------------------
function saveStats() {
  const data = {
    timesCorrect,
    gamesPlayed,
    currentStreak,
    bestStreak
  };
  localStorage.setItem("wordlie6stats", JSON.stringify(data));
}

// -------------------- Update stats display --------------------
function updateStats() {
  const winPercent =
    gamesPlayed > 0 ? Math.round((timesCorrect / gamesPlayed) * 100) : 0;

  statsBox.textContent =
    `Times Correct: ${timesCorrect} | ` +
    `Games Played: ${gamesPlayed} | ` +
    `Win %: ${winPercent}% | ` +
    `Streak: ${currentStreak} | Best: ${bestStreak}`;
}

// Load stats on startup
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

// Cache key buttons for colouring
const keyButtons = Array.from(document.querySelectorAll(".key"));

// -------------------- Keyboard input --------------------
function pressKey(key) {
  if (gameOver) return;          // <--- NEW
  if (currentRow >= rows) return;
  if (currentCol < cols) {
    grid[currentRow][currentCol].textContent = key;
    currentCol++;
  }
}

deleteBtn.addEventListener("click", () => {
  if (gameOver) return;          // <--- NEW
  if (currentCol > 0) {
    currentCol--;
    grid[currentRow][currentCol].textContent = "";
    message.textContent = "";
  }
});

enterBtn.addEventListener("click", handleGuess);

// -------------------- How to Play Modal --------------------
instructionsBtn.addEventListener("click", () => {
  helpModal.classList.remove("hidden");
});

closeHelpBtn.addEventListener("click", () => {
  helpModal.classList.add("hidden");
});

// Close by clicking outside the box
window.addEventListener("click", (e) => {
  if (e.target === helpModal) {
    helpModal.classList.add("hidden");
  }
});

// -------------------- Process guess (duplicate‑letter safe) --------------------
function handleGuess() {
  if (gameOver) return;          // <--- NEW
  if (currentRow >= rows) return;
  if (currentCol < cols) return;

  const guess = grid[currentRow].map(t => t.textContent).join("");

  if (!WORDS.includes(guess)) {
    message.textContent = "Not in word list!";
    return;
  }

  // Build frequency map of correct word
  const letterCounts = {};
  for (const ch of correctWord) {
    letterCounts[ch] = (letterCounts[ch] || 0) + 1;
  }

  const result = Array(cols).fill("absent");

  // First pass: mark greens
  for (let i = 0; i < cols; i++) {
    if (guess[i] === correctWord[i]) {
      result[i] = "correct";
      letterCounts[guess[i]]--;
    }
  }

  // Second pass: mark yellows only if available
  for (let i = 0; i < cols; i++) {
    if (result[i] === "correct") continue;

    const letter = guess[i];
    if (letterCounts[letter] > 0) {
      result[i] = "present";
      letterCounts[letter]--;
    }
  }

  // Apply colours to tiles + keyboard
  for (let i = 0; i < cols; i++) {
    const tile = grid[currentRow][i];
    const letter = guess[i];

    let color = "#666"; // grey
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

  if (currentRow >= rows) {
    handleLoss();
  }
}

// -------------------- Win / Loss handling --------------------
function handleWin() {
  timesCorrect++;
  gamesPlayed++;
  currentStreak++;
  if (currentStreak > bestStreak) bestStreak = currentStreak;

  saveStats();
  updateStats();

  // lock game
  gameOver = true;

  // flash the winning word
  flashWinningRow(currentRow);

  // show stars + sound
  showCelebration();

  // message bar instruction
  message.textContent = "Select New Game to continue";

  // disable all buttons except NEW GAME
  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "new-game") btn.disabled = true;
  });
}

function handleLoss() {
  gamesPlayed++;
  currentStreak = 0;

  message.textContent = `Game Over! Word was ${correctWord}`;
  saveStats();
  updateStats();

  gameOver = true;

  // disable all buttons except NEW GAME
  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "new-game") btn.disabled = true;
  });
}

// -------------------- Flash winning row --------------------
function flashWinningRow(rowIndex) {
  const tiles = grid[rowIndex];
  tiles.forEach(tile => tile.classList.add("flash-tile"));
}

// -------------------- Keyboard coloring --------------------
function colorKey(letter, color) {
  keyButtons.forEach(key => {
    if (key.textContent === letter) {
      const current = key.style.backgroundColor;
      if (
        color === "green" ||
        (color === "gold" && current !== "green") ||
        (color === "#666" && current !== "green" && current !== "gold")
      ) {
        key.style.backgroundColor = color;
      }
    }
  });
}

// -------------------- Buttons --------------------
newGameBtn.addEventListener("click", resetGame);
showHintBtn.addEventListener("click", showHint);
revealBtn.addEventListener("click", revealWord);

// -------------------- Hint logic --------------------
function showHint() {
  if (gameOver) return;          // <--- NEW
  if (hintUsed) {
    message.textContent = "Hint already used!";
    return;
  }

  hintUsed = true;

  const index = Math.floor(Math.random() * correctWord.length);
  const letter = correctWord[index];
  message.textContent = `Hint: Letter ${index + 1} is '${letter}'`;
}

// -------------------- Reveal word --------------------
function revealWord() {
  if (gameOver) return;          // <--- NEW
  message.textContent = `The word is ${correctWord}`;
  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "new-game") btn.disabled = true;
  });
  gameOver = true;
}

// -------------------- Reset game --------------------
function resetGame() {
  document.querySelectorAll("button").forEach(btn => {
    btn.disabled = false;
  });

  board.querySelectorAll(".tile").forEach(tile => {
    tile.textContent = "";
    tile.style.backgroundColor = "black";
    tile.classList.remove("flash-tile");   // <--- clear flashing
  });

  keyButtons.forEach(k => {
    k.style.backgroundColor = "black";
  });

  message.textContent = "";
  currentRow = 0;
  currentCol = 0;
  hintUsed = false;
  gameOver = false;
  correctWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  updateStats();
}

// -------------------- Celebration animation --------------------
function showCelebration() {
  // keep your existing stars + sound, but no auto-reset
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

// -------------------- Hide splash once ready --------------------
document.getElementById("splash-screen").style.display = "none";
