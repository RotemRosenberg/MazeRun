const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SIZE = 30; // Fixed 30x30 grid
// Update canvas size to 800x800 to accommodate 30x30 grid
canvas.width = 800;
canvas.height = 800;
const CELL_SIZE = canvas.width / SIZE;

let grid = [];
let player = { x: 0, y: 0 };
let enemy = { x: SIZE - 1, y: SIZE - 1 };
let enemy2 = { x: 0, y: SIZE - 1 }; // Second enemy starts at bottom-left
let exit = { x: Math.floor(SIZE / 2), y: SIZE - 1 };

const WALLS_COUNT_NORMAL = Math.floor(SIZE * SIZE * 0.25); // Normal mode: 25%
const WALLS_COUNT_HARD = Math.floor(SIZE * SIZE * 0.35); // Hard mode: 35%
const RANDOMIZER_COUNT = 3; // Increased from 2 to 3
const EXTRA_TURN_COUNT = 5; // Increased from 2 to 5 (2 + 3 more)
const COIN_COUNT = 5; // Always 5 coins on the map

let gameMode = 'normal'; // 'normal' or 'hard'
let extraTurn = false;
let score = 0; // Player score from collecting coins
let playerHistory = []; // היסטוריית תנועות השחקן
let lastPlayerPosition = { x: 0, y: 0 };
let lastEnemyPosition = { x: SIZE - 1, y: SIZE - 1 };
let lastEnemy2Position = { x: 0, y: SIZE - 1 };

function createCell(x, y) {
    return {
        x,
        y,
        isWall: false,
        isExit: false,
        isRandomizer: false,
        isExtraTurn: false,
        isCoin: false
    };
}

// === פונקציות מניעת תקיעות ===

// פונקציה לבדיקת קישוריות בין שתי נקודות
function isReachable(start, end, gridToCheck = grid) {
    if (start.x === end.x && start.y === end.y) return true;

    const visited = new Set();
    const queue = [start];
    const key = (p) => `${p.x},${p.y}`;
    visited.add(key(start));

    while (queue.length > 0) {
        const current = queue.shift();

        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (const neighbor of neighbors) {
            if (neighbor.x < 0 || neighbor.x >= SIZE ||
                neighbor.y < 0 || neighbor.y >= SIZE) continue;

            if (gridToCheck[neighbor.y][neighbor.x].isWall ||
                visited.has(key(neighbor))) continue;

            if (neighbor.x === end.x && neighbor.y === end.y) {
                return true;
            }

            visited.add(key(neighbor));
            queue.push(neighbor);
        }
    }

    return false;
}

// פונקציה לבדיקת תקינות המפה
function isGridValid(gridToCheck = grid) {
    let isValid = isReachable(player, enemy, gridToCheck) &&
        isReachable(player, exit, gridToCheck) &&
        isReachable(enemy, player, gridToCheck);
    
    // In hard mode, also check enemy2 connectivity
    if (gameMode === 'hard') {
        isValid = isValid && 
            isReachable(player, enemy2, gridToCheck) &&
            isReachable(enemy2, player, gridToCheck);
    }
    
    return isValid;
}

// פונקציה לבדיקה אם מיקום תפוס
function isPositionOccupied(x, y) {
    return (x === player.x && y === player.y) ||
        (x === enemy.x && y === enemy.y) ||
        (x === enemy2.x && y === enemy2.y && gameMode === 'hard') ||
        (x === exit.x && y === exit.y);
}

// פונקציה לבדיקה אם מיקום תפוס על ידי אלמנט מיוחד
function isSpecialElementOccupied(x, y) {
    const cell = grid[y][x];
    return cell.isWall || cell.isExit || cell.isRandomizer || cell.isExtraTurn || cell.isCoin;
}

// פונקציה לערבוב מערך
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// פונקציה מתקדמת להנחת קירות בבטחה
function placeWallsSafely() {
    const maxAttempts = 100;
    let attempts = 0;
    let wallsPlaced = 0;
    const targetWalls = gameMode === 'hard' ? WALLS_COUNT_HARD : WALLS_COUNT_NORMAL;

    const availableCells = [];
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (!isPositionOccupied(x, y)) {
                availableCells.push({ x, y });
            }
        }
    }

    shuffleArray(availableCells);

    for (const cell of availableCells) {
        if (wallsPlaced >= targetWalls || attempts >= maxAttempts) break;

        grid[cell.y][cell.x].isWall = true;

        if (isGridValid()) {
            wallsPlaced++;
        } else {
            grid[cell.y][cell.x].isWall = false;
        }

        attempts++;
    }

    console.log(`Placed ${wallsPlaced}/${targetWalls} walls safely`);
}

// פונקציה מתקנת להנחת אלמנטים מיוחדים
function placeSpecialElementsSafely() {
    const specialElements = [
        { type: 'isRandomizer', count: RANDOMIZER_COUNT },
        { type: 'isExtraTurn', count: EXTRA_TURN_COUNT },
        { type: 'isCoin', count: COIN_COUNT }
    ];

    for (const element of specialElements) {
        let placed = 0;
        let attempts = 0;
        const maxAttempts = 100;

        while (placed < element.count && attempts < maxAttempts) {
            const x = Math.floor(Math.random() * SIZE);
            const y = Math.floor(Math.random() * SIZE);

            if (!isPositionOccupied(x, y) &&
                !isSpecialElementOccupied(x, y)) {

                grid[y][x][element.type] = true;
                placed++;
            }
            attempts++;
        }
        
        console.log(`Placed ${placed}/${element.count} ${element.type} elements`);
    }
}

// פונקציה משופרת להחלפת placeRandomElements
function placeRandomElementsSafe() {
    // איפוס כל האלמנטים המיוחדים (מלבד היציאה)
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (x === exit.x && y === exit.y) continue;

            grid[y][x].isWall = false;
            grid[y][x].isRandomizer = false;
            grid[y][x].isExtraTurn = false;
            grid[y][x].isCoin = false;
        }
    }

    placeWallsSafely();
    placeSpecialElementsSafely();
}

// פונקציה לווידוא תקינות בהתחלה
function validateInitialGrid() {
    let attempts = 0;
    const maxAttempts = 10;

    while (!isGridValid() && attempts < maxAttempts) {
        console.log(`Grid invalid, regenerating... (attempt ${attempts + 1})`);

        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (x === exit.x && y === exit.y) continue;

                grid[y][x].isWall = false;
                grid[y][x].isRandomizer = false;
                grid[y][x].isExtraTurn = false;
                grid[y][x].isCoin = false;
            }
        }

        placeRandomElementsSafe();
        attempts++;
    }

    if (!isGridValid()) {
        console.warn("Could not generate valid grid after multiple attempts!");
        // מפה ריקה במקרה חירום
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (x === exit.x && y === exit.y) continue;

                grid[y][x].isWall = false;
                grid[y][x].isRandomizer = false;
                grid[y][x].isExtraTurn = false;
                grid[y][x].isCoin = false;
            }
        }
    }
}

// === שאר הפונקציות הקיימות ===

function initGrid(mode = 'normal') {
    grid = [];
    score = 0; // Reset score when starting new game
    gameMode = mode; // Set game mode
    
    for (let y = 0; y < SIZE; y++) {
        const row = [];
        for (let x = 0; x < SIZE; x++) {
            row.push(createCell(x, y));
        }
        grid.push(row);
    }

    player = { x: 0, y: 0 };
    enemy = { x: SIZE - 1, y: SIZE - 1 };
    enemy2 = { x: 0, y: SIZE - 1 }; // Second enemy at bottom-left

    // Place exit in the middle area
    exit = {
        x: Math.floor((player.x + enemy.x) / 2),
        y: Math.floor((player.y + enemy.y) / 2)
    };

    exit.x = Math.max(0, Math.min(SIZE - 1, exit.x));
    exit.y = Math.max(0, Math.min(SIZE - 1, exit.y));
    grid[exit.y][exit.x].isExit = true;

    // שימוש בפונקציה הבטוחה החדשה
    placeRandomElementsSafe();
    validateInitialGrid();
    drawGrid();
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
            else if (cell.isCoin) ctx.fillStyle = "#ffd700"; // Gold color for coins

            if (player.x === x && player.y === y) ctx.fillStyle = "#00f";
            if (enemy.x === x && enemy.y === y) ctx.fillStyle = "#f00";
            if (enemy2.x === x && enemy2.y === y && gameMode === 'hard') ctx.fillStyle = "#cc0000"; // Darker red for second enemy

            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
    
    // Display score and mode
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Mode: ${gameMode.toUpperCase()}`, 10, 60);
}

// פונקציה להוספת מטבע חדש כאשר מטבע נלקח
function spawnNewCoin() {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        const x = Math.floor(Math.random() * SIZE);
        const y = Math.floor(Math.random() * SIZE);
        
        // בדיקה שהמיקום לא תפוס ושאין שם אלמנט מיוחד אחר
        if (!isPositionOccupied(x, y) && 
            !grid[y][x].isWall && 
            !grid[y][x].isExit && 
            !grid[y][x].isRandomizer && 
            !grid[y][x].isExtraTurn && 
            !grid[y][x].isCoin) {
            
            grid[y][x].isCoin = true;
            return;
        }
        attempts++;
    }
    
    console.log("Could not spawn new coin after multiple attempts");
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

    if (newX >= 0 && newX < SIZE && newY >= 0 && newY < SIZE && !grid[newY][newX].isWall) {
        // שמירת מיקום קודם לבדיקת החלפת מקומות
        lastPlayerPosition = { x: player.x, y: player.y };
        lastEnemyPosition = { x: enemy.x, y: enemy.y };
        lastEnemy2Position = { x: enemy2.x, y: enemy2.y };
        
        // עדכון היסטוריית השחקן
        playerHistory.push({ x: player.x, y: player.y });
        if (playerHistory.length > 5) playerHistory.shift(); // שמירת 5 מהלכים אחרונים
        
        player.x = newX;
        player.y = newY;

        const cell = grid[newY][newX];

        // בדיקה לאיסוף מטבע
        if (cell.isCoin) {
            cell.isCoin = false;
            score += 1;
            spawnNewCoin(); // הוסף מטבע חדש במיקום אחר
        }

        // בדיקה לRandomizer - עם הפונקציה הבטוחה החדשה
        if (cell.isRandomizer) {
            grid[player.y][player.x].isRandomizer = false;
            placeRandomElementsSafe();
            validateInitialGrid();
            drawGrid();
        }

        if (cell.isExtraTurn) {
            cell.isExtraTurn = false;
            extraTurn = true;
        }

        if (cell.isExit) {
            Swal.fire({
                title: "🎉 You Escaped!",
                text: `Congratulations! You collected ${score} coins!`,
                icon: "success",
                confirmButtonText: "Play Again"
            }).then(() => {
                initGrid(gameMode);
            });
            return;
        }

        drawGrid();

        if (!extraTurn) {
            moveEnemy();
            if (gameMode === 'hard') {
                moveEnemy2();
            }
        } else {
            extraTurn = false;
        }

        drawGrid();

        // בדיקת תפיסה - כולל החלפת מקומות
        if (isPlayerCaught()) {
            Swal.fire({
                title: "💀 Caught!",
                text: "The enemy reached you.",
                icon: "error",
                confirmButtonText: "Try Again"
            }).then(() => {
                initGrid(gameMode);
            });
        }
    }
});

// פונקציה לבדיקת תפיסה משופרת
function isPlayerCaught() {
    // בדיקה רגילה - אותו מיקום עם enemy1
    if (player.x === enemy.x && player.y === enemy.y) {
        return true;
    }
    
    // בדיקת החלפת מקומות עם enemy1
    if (player.x === lastEnemyPosition.x && player.y === lastEnemyPosition.y &&
        enemy.x === lastPlayerPosition.x && enemy.y === lastPlayerPosition.y) {
        return true;
    }
    
    // בדיקות עבור enemy2 במוד קשה
    if (gameMode === 'hard') {
        // בדיקה רגילה - אותו מיקום עם enemy2
        if (player.x === enemy2.x && player.y === enemy2.y) {
            return true;
        }
        
        // בדיקת החלפת מקומות עם enemy2
        if (player.x === lastEnemy2Position.x && player.y === lastEnemy2Position.y &&
            enemy2.x === lastPlayerPosition.x && enemy2.y === lastPlayerPosition.y) {
            return true;
        }
    }
    
    return false;
}

// פונקציה לחיזוי מיקום השחקן המשופרת
function predictPlayerPosition() {
    // אם יש היסטוריה, נסה לחזות לפי דפוס
    if (playerHistory.length >= 2) {
        const lastMove = {
            dx: playerHistory[playerHistory.length - 1].x - playerHistory[playerHistory.length - 2].x,
            dy: playerHistory[playerHistory.length - 1].y - playerHistory[playerHistory.length - 2].y
        };
        
        const predictedX = player.x + lastMove.dx;
        const predictedY = player.y + lastMove.dy;
        
        if (predictedX >= 0 && predictedX < SIZE && predictedY >= 0 && predictedY < SIZE && 
            !grid[predictedY][predictedX].isWall) {
            return { x: predictedX, y: predictedY };
        }
    }
    
    // אחרת, חזור לשחקן הנוכחי
    return { x: player.x, y: player.y };
}

// פונקציה לבחירת אסטרטגיה
function chooseStrategy() {
    const distance = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
    
    // אם צמוד לשחקן - תקיפה ישירה
    if (distance === 1) {
        return 'attack';
    }
    // אם קרוב מאוד - נסה לחסום
    else if (distance <= 3) {
        return 'block';
    }
    // אם במרחק בינוני - רדיפה ישירה
    else if (distance <= 5) {
        return 'direct';
    }
    // אם רחוק - נסה לחזות
    else {
        return 'predict';
    }
}

// פונקציה לחיפוש מיקום תקיפה אגרסיבי
function findAttackPosition() {
    const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 },
        // הוסף מהלכים אלכסוניים לתקיפה יותר אגרסיבית
        { x: -1, y: -1 }, { x: 1, y: -1 },
        { x: -1, y: 1 }, { x: 1, y: 1 }
    ];
    
    let bestMove = { x: player.x, y: player.y, score: -1000 };
    
    for (const dir of dirs) {
        const nx = enemy.x + dir.x;
        const ny = enemy.y + dir.y;
        
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !grid[ny][nx].isWall) {
            // חשב ציון לפי קרבה לשחקן ומניעת בריחה
            const distanceToPlayer = Math.abs(nx - player.x) + Math.abs(ny - player.y);
            const blocksEscape = calculateEscapeBlocking(nx, ny);
            
            // העדף מיקומים שקרובים לשחקן וחוסמים בריחה
            const score = -distanceToPlayer * 10 + blocksEscape * 5;
            
            if (score > bestMove.score) {
                bestMove = { x: nx, y: ny, score: score };
            }
        }
    }
    
    return bestMove;
}

// פונקציה לחישוב כמה דרכי בריחה המיקום חוסם
function calculateEscapeBlocking(enemyX, enemyY) {
    const playerEscapeRoutes = [];
    const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    
    // מצא את כל דרכי הבריחה של השחקן
    for (const dir of dirs) {
        const nx = player.x + dir.x;
        const ny = player.y + dir.y;
        
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && 
            !grid[ny][nx].isWall && !(nx === enemyX && ny === enemyY)) {
            playerEscapeRoutes.push({ x: nx, y: ny });
        }
    }
    
    // חזור כמה דרכי בריחה נחסמו
    const totalRoutes = 4; // מקסימום 4 כיוונים
    const blockedRoutes = totalRoutes - playerEscapeRoutes.length;
    
    return blockedRoutes;
}

// פונקציה לחיפוש מיקום חסימה משופרת
function findBlockingPosition() {
    const playerNeighbors = [];
    const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    
    // מצא את כל המיקומים הסמוכים לשחקן
    for (const dir of dirs) {
        const nx = player.x + dir.x;
        const ny = player.y + dir.y;
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !grid[ny][nx].isWall) {
            const distanceFromEnemy = Math.abs(enemy.x - nx) + Math.abs(enemy.y - ny);
            const escapeBlocking = calculateEscapeBlocking(nx, ny);
            
            // העדף מיקומים שקרובים לאויב וחוסמים יותר דרכי בריחה
            const score = -distanceFromEnemy + escapeBlocking * 2;
            
            playerNeighbors.push({ 
                x: nx, 
                y: ny, 
                distance: distanceFromEnemy,
                score: score
            });
        }
    }
    
    // בחר את המיקום עם הציון הטוב ביותר
    if (playerNeighbors.length > 0) {
        playerNeighbors.sort((a, b) => b.score - a.score);
        return playerNeighbors[0];
    }
    
    return { x: player.x, y: player.y };
}

function moveEnemy() {
    const strategy = chooseStrategy();
    let target;
    
    switch (strategy) {
        case 'attack':
            target = findAttackPosition();
            break;
        case 'block':
            target = findBlockingPosition();
            break;
        case 'direct':
            target = { x: player.x, y: player.y };
            break;
        case 'predict':
            target = predictPlayerPosition();
            break;
        default:
            target = { x: player.x, y: player.y };
    }
    
    const path = aStar(grid[enemy.y][enemy.x], target);
    if (path.length > 1) {
        enemy = { x: path[1].x, y: path[1].y };
    }
}

function moveEnemy2() {
    // Enemy2 uses a simpler strategy - direct pursuit
    const target = { x: player.x, y: player.y };
    
    const path = aStar(grid[enemy2.y][enemy2.x], target);
    if (path.length > 1) {
        enemy2 = { x: path[1].x, y: path[1].y };
    }
}

function heuristic(a, b) {
    const manhattanDistance = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    // בונוס אם המיקום קרוב לשחקן (עידוד רדיפה)
    const distanceToPlayer = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
    const playerProximityBonus = Math.max(0, 10 - distanceToPlayer);
    
    // עונש אם המיקום קרוב ליציאה (למנוע מהאויב להגן על היציאה)
    const distanceToExit = Math.abs(a.x - exit.x) + Math.abs(a.y - exit.y);
    const exitPenalty = distanceToExit < 3 ? 5 : 0;
    
    return manhattanDistance - playerProximityBonus + exitPenalty;
}

function getNeighbors(cell) {
    const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    const neighbors = [];

    for (const dir of dirs) {
        const nx = cell.x + dir.x;
        const ny = cell.y + dir.y;
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !grid[ny][nx].isWall) {
            neighbors.push(grid[ny][nx]);
        }
    }

    return neighbors;
}

function getCost(x, y) {
    let cost = 1;
    if (grid[y][x].isRandomizer) cost += 3;
    if (grid[y][x].isExtraTurn) cost += 2;

    const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    for (const d of dirs) {
        const nx = x + d.x,
            ny = y + d.y;
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
            if (grid[ny][nx].isWall) cost += 1;
        }
    }
    return cost;
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
            const tempG = gScore.get(key(current)) + getCost(neighbor.x, neighbor.y);
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

// Remove the auto-start call since we now auto-start in HTML
// initGrid() is now called by window.onload in game.html