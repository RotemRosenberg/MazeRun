const canvas = document.getElementById("tutorialCanvas");
const ctx = canvas.getContext("2d");

const SIZE = 4;
const CELL_SIZE = canvas.width / SIZE;

let currentStep = 1;

let grid = [];
let player = { x: 0, y: 0 };
let enemy = { x: -1, y: -1 }; // ברירת מחדל - לא קיים

function initGrid() {
    grid = [];
    for (let y = 0; y < SIZE; y++) {
        const row = [];
        for (let x = 0; x < SIZE; x++) {
            row.push({ x, y, isWall: false, isExit: false });
        }
        grid.push(row);
    }
    player = { x: 0, y: 0 };
    enemy = { x: -1, y: -1 }; // reset enemy unless defined in step
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const cell = grid[y][x];
            ctx.fillStyle = "#fff";

            if (cell.isWall) ctx.fillStyle = "#444";
            if (cell.isExit) ctx.fillStyle = "#0f0";
            if (enemy.x === x && enemy.y === y) ctx.fillStyle = "#f00";
            if (player.x === x && player.y === y) ctx.fillStyle = "#00f";

            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

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
        drawGrid();

        if (currentStep === 5) {
            const path = aStar(grid[enemy.y][enemy.x], player);
            if (path.length > 1) {
                enemy.x = path[1].x;
                enemy.y = path[1].y;
            }

            drawGrid();

            if (player.x === enemy.x && player.y === enemy.y) {
                Swal.fire({
                    title: "💀 Game Over",
                    text: "The AI caught you!",
                    icon: "error",
                    confirmButtonText: "Try Again"
                }).then(() => {
                    restartCurrentStep();
                });
                return;
            }
        }

        if (player.x === enemy.x && player.y === enemy.y) {
            Swal.fire({
                title: "💀 Game Over",
                text: "You touched the enemy!",
                icon: "error",
                confirmButtonText: "Try Again"
            }).then(() => {
                restartCurrentStep();
            });
            return;
        }

        if (grid[player.y][player.x].isExit) {
            const isFinalStep = currentStep === 5;
            Swal.fire({
                title: "🎉 Great job!",
                text: isFinalStep ? "You completed the tutorial!" : "You reached the exit!",
                icon: "success",
                confirmButtonText: isFinalStep ? "Start Game" : "Restart"
            }).then(() => {
                if (isFinalStep) {
                    window.location.href = "game.html"; // דף המשחק בהמשך
                } else {
                    restartCurrentStep();
                }
            });

            // אם סיימנו את שלב 5 – מחליפים את כפתור ה־Next
            if (isFinalStep) {
                const btn = document.getElementById("nextBtn");
                btn.textContent = "Start Game";
                btn.onclick = () => window.location.href = "game.html";
            }

            return;
        }

    }
});

function restartCurrentStep() {
    if (currentStep === 1) step1();
    else if (currentStep === 2) step2();
    else if (currentStep === 3) step3();
    else if (currentStep === 4) step4();
    else if (currentStep === 5) step5();
}

function nextStep() {
    currentStep++;
    if (currentStep === 2) step2();
    else if (currentStep === 3) step3();
    else if (currentStep === 4) step4();
    else if (currentStep === 5) step5();
}

function step1() {
    document.getElementById("instruction").textContent = "Use arrow keys to move the player (blue square).";
    initGrid();
    drawGrid();
}

function step2() {
    document.getElementById("instruction").textContent = "Now try reaching the green exit.";
    initGrid();
    grid[SIZE - 1][SIZE - 1].isExit = true;
    drawGrid();
}

function step3() {
    document.getElementById("instruction").textContent = "Avoid the gray walls and reach the green exit!";
    initGrid();
    grid[0][1].isWall = true;
    grid[1][1].isWall = true;
    grid[2][1].isWall = true;
    grid[SIZE - 1][SIZE - 1].isExit = true;
    drawGrid();
}

function step4() {
    document.getElementById("instruction").textContent = "Avoid the red enemy and reach the green exit!";
    initGrid();
    enemy = { x: 2, y: 1 };
    grid[SIZE - 1][SIZE - 1].isExit = true;
    drawGrid();
}

function step5() {
    document.getElementById("instruction").textContent = "Final challenge: The red enemy chases you!";
    initGrid();
    enemy = { x: SIZE - 1, y: 0 };
    grid[SIZE - 1][SIZE - 1].isExit = true;

    // הצגת כפתור הבא כברירת מחדל
    const btn = document.getElementById("nextBtn");
    btn.textContent = "Next Step";
    btn.onclick = nextStep;

    drawGrid();
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

step1();