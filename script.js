// ===== 基本元素 =====
const diceArea = document.getElementById("dice-area");
const diceBox = document.getElementById("dicepng");

const pieces = {
  cat: document.getElementById("cat"),
  dog: document.getElementById("dog"),
  elep: document.getElementById("elep"),
  croco: document.getElementById("croco"),
  bird: document.getElementById("bird"),
};

const tiles = document.querySelectorAll(".tile");

// ===== 玩家順序（⭐ 新增）=====
const playerOrder = ["cat", "dog", "elep", "croco", "bird"];

const playerNameMap = {
  cat: "貓",
  dog: "狗",
  elep: "象",
  croco: "鱷",
  bird: "鳥",
};

let currentPlayerIndex = 0;
let currentPlayer = playerOrder[currentPlayerIndex];
let pendingChallenger = null; // 正在挑戰的人
let pendingTileIndex = null; // 被踩的地

const currentPlayerText = document.getElementById("current-player-text");

// 初始化顯示
currentPlayerText.textContent = playerNameMap[currentPlayer];


// ===== 狀態 =====
let positions = {
  cat: null,
  dog: null,
  elep: null,
  croco: null,
  bird: null,
};

let firstRoll = {
  cat: true,
  dog: true,
  elep: true,
  croco: true,
  bird: true,
};

let isRolling = false;

// ===== 🧍‍♂️ 初始排排站座標（你只改這裡）=====
const waitingPositions = {
  cat:   { x: 380, y: 750 },
  dog:   { x: 450, y: 750 },
  elep:  { x: 520, y: 750 },
  croco: { x: 590, y: 750 },
  bird:  { x: 660, y: 750 },
};

// ===== 把棋子移到指定格子 =====
function movePiece(piece, tileIndex) {
  const tile = tiles[tileIndex];
  const tileRect = tile.getBoundingClientRect();
  const boardRect = document
    .querySelector(".board-wrapper")
    .getBoundingClientRect();

  const x =
    tileRect.left -
    boardRect.left +
    tileRect.width / 2 -
    piece.offsetWidth / 2;

  const y =
    tileRect.top -
    boardRect.top +
    tileRect.height / 2 -
    piece.offsetHeight / 2;

  piece.style.left = `${x}px`;
  piece.style.top = `${y}px`;
}

// ===== 初始排排站 =====
function placeWaitingPieces() {
  for (let key in pieces) {
    const piece = pieces[key];
    const pos = waitingPositions[key];
    piece.style.left = `${pos.x}px`;
    piece.style.top = `${pos.y}px`;
  }
}

// 一載入先排好
placeWaitingPieces();

// ===== 🎲 擲骰子 =====
diceArea.addEventListener("click", () => {
  if (isRolling) return;
  isRolling = true;

  let currentDice = 1;

  const rolling = setInterval(() => {
    currentDice = Math.floor(Math.random() * 6) + 1;
    diceBox.style.backgroundImage = `url(assets/dice${currentDice}.png)`;
    diceBox.style.backgroundSize = "contain";
    diceBox.style.backgroundRepeat = "no-repeat";
    diceBox.style.backgroundPosition = "center";
  }, 100);

  setTimeout(() => {
    clearInterval(rolling);

    let steps = currentDice;

    // ⭐ 第一次骰補 +1
    if (firstRoll[currentPlayer]) {
      steps += 1;
      firstRoll[currentPlayer] = false;
    }

    moveSteps(currentPlayer, steps);
  }, 1000);
});

// ===== 🚶‍♂️ 走棋 =====
function moveSteps(player, steps) {
  let stepCount = 0;

  if (positions[player] === null) {
    positions[player] = -1;
  }

  const piece = pieces[player];

  const walk = setInterval(() => {
    positions[player] = (positions[player] + 1) % tiles.length;
    movePiece(piece, positions[player]);

    stepCount++;
    if (stepCount >= steps) {
      clearInterval(walk);

      onPlayerArrive(player, positions[player]);

      // ⭐ 換下一位玩家（重點）
      nextPlayer();
      isRolling = false;
    }
  }, 500);
}

// ===== 🔁 換角色（⭐ 新增）=====
function nextPlayer() {
  currentPlayerIndex =
    (currentPlayerIndex + 1) % playerOrder.length;

  currentPlayer = playerOrder[currentPlayerIndex];

  currentPlayerText.textContent =
    playerNameMap[currentPlayer];
}

function onPlayerArrive(player, tileIndex) {
  const data = tileData[tileIndex];
  if (!data) return;

  // 自己的地不處理
  if (data.type === "land" && data.owner === player) {
    if (data.houses < 2) {
        data.houses++;
        renderHouses(tileIndex);
        recalcScores(); 
    }
    return;
  }

  pendingChallenger = player;
  pendingTileIndex = tileIndex;

  openModal(data.modalIndex);
}

function openModal(index) {
  const modal = document.querySelector(
    `.land-modal[data-index="${index}"]`
  );
  modal.classList.add("show");
}

document.querySelectorAll(".success").forEach(btn => {
  btn.addEventListener("click", e => {
    const modal = e.target.closest(".land-modal");

    if (pendingTileIndex === null || pendingChallenger === null) {
      modal.classList.remove("show");
      return;
    }

    const data = tileData[pendingTileIndex];

    if (data.type === "land") {

      if (data.houses === 0) {
        data.owner = pendingChallenger;
        renderLandMarks();
      } else {
        data.houses--;
        renderHouses(pendingTileIndex);
      }

      recalcScores();
    }

    pendingChallenger = null;
    pendingTileIndex = null;
    modal.classList.remove("show");
  });
});



document.querySelectorAll(".fail").forEach(btn => {
  btn.addEventListener("click", e => {
    const modal = e.target.closest(".land-modal");

    if (pendingTileIndex === null) {
      modal.classList.remove("show");
      return;
    }

    const data = tileData[pendingTileIndex];

    // 排除命運 & 機會
    if (data.type === "land" && data.houses < 2) {
      data.houses++;
      renderHouses(pendingTileIndex);
      recalcScores();
    }

    pendingChallenger = null;
    pendingTileIndex = null;

    modal.classList.remove("show");
  });
});


const LAND_ICONS = {
  cat: "😺",
  dog: "🐶",
  elep: "🐘",
  croco: "🐊",
  bird: "🐦",
  chance: "🎲",
  fate: "⚖️",
};

let tileData = {};

function clearLandMarks() {
  document.querySelectorAll(".land-mark").forEach(el => el.remove());
}

function renderLandMarks() {
  clearLandMarks();

  for (let index in tileData) {
    const tile = document.querySelector(`.tile[data-id="${index}"]`);
    if (!tile) continue;

    const data = tileData[index];

    const mark = document.createElement("div");
    mark.className = "land-mark";

    if (data.type === "land") {
      mark.textContent = LAND_ICONS[data.owner];
    } else {
      mark.textContent = LAND_ICONS[data.type];
    }

    tile.appendChild(mark);
    if (data.type === "land" && data.house > 0) {
      const house = document.createElement("img");
      house.src = "assets/house.png";
      house.className = "house";
      tile.appendChild(house);
    }
  }
}

function renderHouses(tileIndex) {
  const tile = document.querySelector(`.tile[data-id="${tileIndex}"]`);
  if (!tile) return;

  // 先移除舊房子
  tile.querySelectorAll(".house").forEach(h => h.remove());

  const data = tileData[tileIndex];
  if (!data || data.type !== "land") return;

  for (let i = 0; i < data.houses; i++) {
    const house = document.createElement("img");
    house.src = "assets/house.png";
    house.className = "house";

    // ⭐ 第二棟往右排
    house.style.left = `${4 + i * 18}px`;

    tile.appendChild(house);
  }
}


const assignLandBtn = document.getElementById("assign-land");

assignLandBtn.addEventListener("click", () => {
  assignLandsOnce();
});



function assignLandsOnce() {
  tileData = {};
  clearLandMarks();

  const availableTiles = [];
  for (let i = 1; i <= 19; i++) availableTiles.push(i);
  shuffleArray(availableTiles);

  let modalIndex = 1;
  const players = ["cat", "dog", "elep", "croco", "bird"];

  // 每人 3 格地產
  players.forEach(player => {
    for (let i = 0; i < 3; i++) {
      const tile = availableTiles.pop();

      tileData[tile] = {
        type: "land",
        owner: player,
        houses: 0,
        modalIndex,
      };

      modalIndex++;
    }
  });

  // 剩下 4 格：2 機會、2 命運
  ["chance", "chance", "fate", "fate"].forEach(type => {
    const tile = availableTiles.pop();

    tileData[tile] = {
      type,
      owner: null,
      modalIndex,
    };

    modalIndex++;
  });

  renderLandMarks(); // ⭐⭐⭐ 只在最後畫一次
  recalcScores();
  console.log("地產資料", tileData);
}



function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function recalcScores() {
  // 初始化
  const result = {
    cat:   { land: 0, house: 0, total: 0 },
    dog:   { land: 0, house: 0, total: 0 },
    elep:  { land: 0, house: 0, total: 0 },
    croco: { land: 0, house: 0, total: 0 },
    bird:  { land: 0, house: 0, total: 0 },
  };

  // 掃描所有地產
  for (let index in tileData) {
    const data = tileData[index];

    if (data.type === "land" && data.owner) {
      result[data.owner].land += 1;
      result[data.owner].house += data.houses || 0;
    }
  }

  // 計算總分 & 更新畫面
  for (let player in result) {
    const land = result[player].land;
    const house = result[player].house;
    const total = land + house * 0.5;

    document.getElementById(`score-${player}-land`).innerText = land;
    document.getElementById(`score-${player}-house`).innerText = house;
    document.getElementById(`score-${player}-total`).innerText = total.toFixed(1);
  }
}


const imagePools = {
  cat:   ["assets/cat/1.png", "assets/cat/2.png", "assets/cat/3.png"],
  dog:   ["assets/dog/4.png", "assets/dog/5.png", "assets/dog/6.png"],
  elep:  ["assets/elep/7.png", "assets/elep/8.png", "assets/elep/9.png"],
  croco: ["assets/croco/10.png", "assets/croco/11.png", "assets/croco/12.png"],
  bird:  ["assets/bird/13.png", "assets/bird/14.png", "assets/bird/15.png"],
  chance: ["assets/chance/16.png", "assets/chance/17.png"],
  fate:   ["assets/fate/18.png", "assets/fate/19.png"],
};

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function assignLand() {
  const tiles = shuffle([...Array(19).keys()].map(i => i + 1));
  let modalIndex = 1;

  const owners = ["cat", "dog", "elep", "croco", "bird"];

  // 五組地產
  owners.forEach(owner => {
    for (let i = 0; i < 3; i++) {
      const tile = tiles.shift();
      const img = imagePools[owner].pop();

      tileData[tile] = {
        type: "land",
        owner,
        modalIndex,
        houses: 0
      };

      bindModal(modalIndex, img);
      showTileEmoji(tile, owner);
      modalIndex++;
    }
  });

  // 機會
  for (let i = 0; i < 2; i++) {
    const tile = tiles.shift();
    const img = imagePools.chance.pop();

    tileData[tile] = { type: "chance", modalIndex };
    bindModal(modalIndex, img);
    showTileEmoji(tile, "chance");
    modalIndex++;
  }

  // 命運
  for (let i = 0; i < 2; i++) {
    const tile = tiles.shift();
    const img = imagePools.fate.pop();

    tileData[tile] = { type: "fate", modalIndex };
    bindModal(modalIndex, img);
    showTileEmoji(tile, "fate");
    modalIndex++;
  }
}

function bindModal(index, imgSrc) {
  const modal = document.querySelector(
    `.land-modal[data-index="${index}"] img`
  );
  modal.src = imgSrc;
}
