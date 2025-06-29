const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SIZE = Math.floor(Math.random() * 4) + 12; // 12–15
const CELL_SIZE = canvas.width / SIZE;

let grid = [];
let player = { x: 0, y: 0 };
let enemy = { x: SIZE - 1, y: SIZE - 1 };
let exit = { x: Math.floor(SIZE / 2), y: SIZE - 1 };

const WALLS_COUNT = Math.floor(SIZE * SIZE * 0.2);
const RANDOMIZER_COUNT = 2;
const EXTRA_TURN_COUNT = 2;

function createCell(x, y) {
    return {
        x,
        y,
        isWall: false,
        isExit: false,
        isRandomizer: false,
        isExtraTurn: false
    };
}

function initGrid() {
    grid = [];
    for (let y = 0; y < SIZE; y++) {
        const row = [];
        for (let x = 0; x < SIZE; x++) {
            row.push(createCell(x, y));
        }
        grid.push(row);
    }

    player = { x: 0, y: 0 };
    enemy = { x: SIZE - 1, y: SIZE - 1 };

    exit = {
        x: Math.floor((player.x + enemy.x) / 2),
        y: Math.floor((player.y + enemy.y) / 2)
    };
    grid[exit.y][exit.x].isExit = true;

    placeRandomElements();
    drawGrid();
}

function placeExit() {
    const candidates = [
        { x: 0, y: 0 },
        { x: SIZE - 1, y: 0 },
        { x: 0, y: SIZE - 1 },
        { x: SIZE - 1, y: SIZE - 1 },
        { x: Math.floor(SIZE / 2), y: SIZE - 1 },
        { x: Math.floor(SIZE / 2), y: 0 }
    ];

    let best = null;
    let bestScore = -Infinity;

    for (const c of candidates) {
        if (isCellBlocked(c)) continue;

        const distToPlayer = Math.abs(player.x - c.x) + Math.abs(player.y - c.y);
        const distToEnemy = Math.abs(enemy.x - c.x) + Math.abs(enemy.y - c.y);

        const diff = Math.abs(distToPlayer - distToEnemy);
        const totalDist = distToPlayer + distToEnemy;

        const score = -diff + totalDist;

        if (score > bestScore) {
            best = c;
            bestScore = score;
        }
    }

    if (best) {
        grid[best.y][best.x].isExit = true;
    }
}

function isCellBlocked(cell) {
    return (
        grid[cell.y][cell.x].isWall ||
        (cell.x === player.x && cell.y === player.y) ||
        (cell.x === enemy.x && cell.y === enemy.y)
    );
}


function clearSpecialElements() {
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            grid[y][x].isWall = false;
            grid[y][x].isRandomizer = false;
            grid[y][x].isExtraTurn = false;
            grid[y][x].isExit = false;
        }
    }
    grid[exit.y][exit.x].isExit = true; // keep exit intact
}


function placeRandomElements() {
    const avoid = (x, y) =>
        (x === player.x && y === player.y) ||
        (x === enemy.x && y === enemy.y) ||
        (x === exit.x && y === exit.y);

    let placed = 0;
    while (placed < WALLS_COUNT) {
        const x = Math.floor(Math.random() * SIZE);
        const y = Math.floor(Math.random() * SIZE);
        if (!avoid(x, y) && !grid[y][x].isWall) {
            grid[y][x].isWall = true;
            placed++;
        }
    }

    placed = 0;
    while (placed < RANDOMIZER_COUNT) {
        const x = Math.floor(Math.random() * SIZE);
        const y = Math.floor(Math.random() * SIZE);
        if (!avoid(x, y) && !grid[y][x].isWall && !grid[y][x].isRandomizer) {
            grid[y][x].isRandomizer = true;
            placed++;
        }
    }

    placed = 0;
    while (placed < EXTRA_TURN_COUNT) {
        const x = Math.floor(Math.random() * SIZE);
        const y = Math.floor(Math.random() * SIZE);
        if (!avoid(x, y) && !grid[y][x].isWall && !grid[y][x].isExtraTurn) {
            grid[y][x].isExtraTurn = true;
            placed++;
        }
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const cell = grid[y][x];
            ctx.fillStyle = "#fff";

            if (cell.isWall) ctx.fillStyle = "#444";
            else if (cell.isExit) ctx.fillStyle = "#0f0";
            else if (cell.isRandomizer) ctx.fillStyle = "#0ff";
            else if (cell.isExtraTurn) ctx.fillStyle = "#ff0";

            if (player.x === x && player.y === y) ctx.fillStyle = "#00f";
            if (enemy.x === x && enemy.y === y) ctx.fillStyle = "#f00";

            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

initGrid();


// === Logic ===

let extraTurn = false;

document.addEventListener("keydown", (e) => {
    let dx = 0,
        dy = 0;
    switch (e.key) {
        case "ArrowUp":
            dy = -1;
            break;
        case "ArrowDown":
            dy = 1;
            break;
        case "ArrowLeft":
            dx = -1;
            break;
        case "ArrowRight":
            dx = 1;
            break;
        default:
            return;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (
        newX >= 0 && newX < SIZE &&
        newY >= 0 && newY < SIZE &&
        !grid[newY][newX].isWall
    ) {
        player.x = newX;
        player.y = newY;

        const cell = grid[newY][newX];

        // Check for randomizer (🌀)

        if (cell.isRandomizer) {
            grid[player.y][player.x].isRandomizer = false;
            clearSpecialElements(); // 🧹 Clear all walls/buttons
            placeRandomElements(); // 🎲 Generate new walls/buttons
            drawGrid();
        }


        // Check for extra turn (⚡)
        if (cell.isExtraTurn) {
            cell.isExtraTurn = false;
            extraTurn = true;
        }

        // Check if reached exit
        if (cell.isExit) {
            Swal.fire({
                title: "🎉 You Escaped!",
                text: "Congratulations!",
                icon: "success",
                confirmButtonText: "Play Again"
            }).then(() => {
                initGrid();
            });
            return;
        }

        drawGrid();

        if (!extraTurn) moveEnemy();
        else extraTurn = false;

        drawGrid();

        if (player.x === enemy.x && player.y === enemy.y) {
            Swal.fire({
                title: "💀 Caught!",
                text: "The enemy reached you.",
                icon: "error",
                confirmButtonText: "Try Again"
            }).then(() => {
                initGrid();
            });
        }
    }
});

function moveEnemy() {
    const path = aStar(grid[enemy.y][enemy.x], player);
    if (path.length > 1) {
        enemy = { x: path[1].x, y: path[1].y };
    }
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(cell) {
    const dirs = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
    ];
    const neighbors = [];

    for (const dir of dirs) {
        const nx = cell.x + dir.x;
        const ny = cell.y + dir.y;
        if (
            nx >= 0 && nx < SIZE &&
            ny >= 0 && ny < SIZE &&
            !grid[ny][nx].isWall
        ) {
            neighbors.push(grid[ny][nx]);
        }
    }

    return neighbors;
}

function aStar(start, goal) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const key = (p) => `${p.x},${p.y}`;
    gScore.set(key(start), 0);
    fScore.set(key(start), heuristic(start, goal));

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
        let current = openSet.shift();

        if (current.x === goal.x && current.y === goal.y) {
            const path = [current];
            while (cameFrom.has(key(current))) {
                current = cameFrom.get(key(current));
                path.unshift(current);
            }
            return path;
        }

        for (const neighbor of getNeighbors(current)) {
            const tempG = gScore.get(key(current)) + 1;
            if (!gScore.has(key(neighbor)) || tempG < gScore.get(key(neighbor))) {
                cameFrom.set(key(neighbor), current);
                gScore.set(key(neighbor), tempG);
                fScore.set(key(neighbor), tempG + heuristic(neighbor, goal));

                if (!openSet.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return [];
}

initGrid();