/* wordlie6.js — full persistent‑stats version */

// -------------------- Element references --------------------
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");
const cheer = document.getElementById("cheer-sound");
const statsBox = document.getElementById("stats");

// -------------------- Game state --------------------
let correctWord = WORDS[Math.floor(Math.random() * WORDS.length)];
let currentRow = 0;
let currentCol = 0;
const rows = 6;
const cols = 6;
let grid = [];
let hintUsed = false;

// -------------------- Stats --------------------
let timesCorrect = 0;
let gamesPlayed = 0;
let currentStreak = 0;
let bestStreak = 0;

// -------------------- Load stats from localStorage --------------------
function loadStats() {
    const saved = JSON.parse(localStorage.getItem("wordlie6stats"));
    if (saved) {
        timesCorrect = saved.timesCorrect || 0;
        gamesPlayed = saved.gamesPlayed || 0;
        currentStreak = saved.currentStreak || 0;
        bestStreak = saved.bestStreak || 0;
    }
}

// -------------------- Save stats --------------------
function saveStats() {
    localStorage.setItem("wordlie6stats", JSON.stringify({
        timesCorrect,
        gamesPlayed,
        currentStreak,
        bestStreak
    }));
}

// -------------------- Update stats display --------------------
function updateStats() {
    const winPercent = gamesPlayed > 0
        ? Math.round((timesCorrect / gamesPlayed) * 100)
        : 0;

    statsBox.textContent =
        `Times Correct: ${timesCorrect} | Games Played: ${gamesPlayed} | Win %: ${winPercent}% | Streak: ${currentStreak} | Best: ${bestStreak}`;
}

// Load stats on startup
loadStats();
updateStats();

// -------------------- Reset stats on page unload --------------------
window.addEventListener("beforeunload", () => {
  localStorage.removeItem("wordlie6stats");
});

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

// -------------------- Keyboard input --------------------
function pressKey(key) {
    if (currentCol < cols) {
        grid[currentRow][currentCol].textContent = key;
        currentCol++;
    }
}

document.getElementById("delete").addEventListener("click", () => {
    if (currentCol > 0) {
        currentCol--;
        grid[currentRow][currentCol].textContent = "";
        message.textContent = "";
    }
});

document.getElementById("enter").addEventListener("click", handleGuess);

// -------------------- How to Play Modal --------------------
const helpModal = document.getElementById("help-modal");
const instructionsBtn = document.getElementById("instructions");
const closeHelpBtn = document.getElementById("close-help");

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
// -------------------- Process guess --------------------
function handleGuess() {
    if (currentCol < cols) return;

    const guess = grid[currentRow].map(t => t.textContent).join("");

    if (!WORDS.includes(guess)) {
        message.textContent = "Not in word list!";
        return;
    }

    for (let i = 0; i < cols; i++) {
        const tile = grid[currentRow][i];
        const letter = guess[i];
        let color = "#666";

        if (letter === correctWord[i]) color = "green";
        else if (correctWord.includes(letter)) color = "gold";

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
    showCelebration();
}

function handleLoss() {
    gamesPlayed++;
    currentStreak = 0;

    message.textContent = `Game Over! Word was ${correctWord}`;
    saveStats();
    updateStats();

    setTimeout(resetGame, 4000);
}

// -------------------- Keyboard coloring --------------------
function colorKey(letter, color) {
    const keyButtons = document.querySelectorAll(".key");
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
document.getElementById("new-game").addEventListener("click", resetGame);
document.getElementById("show-hint").addEventListener("click", showHint);
document.getElementById("reveal").addEventListener("click", revealWord);

// -------------------- Hint logic --------------------
function showHint() {
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
    message.textContent = `The word is ${correctWord}`;
// Disable everything except NEW GAME
  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "new-game") btn.disabled = true;

});
}

// -------------------- Reset game --------------------
function resetGame() {
  // Reactivate all buttons
  document.querySelectorAll("button").forEach(btn => {
    btn.disabled = false;
  });
  board.querySelectorAll(".tile").forEach(tile => {
    tile.textContent = "";
    tile.style.backgroundColor = "black";
  });
  document.querySelectorAll(".key").forEach(k => {
    k.style.backgroundColor = "black";
  });
  message.textContent = "";
  currentRow = 0;
  currentCol = 0;
  hintUsed = false;
  correctWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  updateStats();
}

// -------------------- Celebration animation --------------------
function showCelebration() {
    message.textContent = "Congratulations!";
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

    setTimeout(() => {
        message.textContent = "";
        resetGame();
    }, 5000);
}
