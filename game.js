const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ROWS = 12;
const COLS = 12;
const CELL_SIZE = canvas.width / COLS;

const grid = [];

// יצירת הגריד
for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
        row.push({
            x,
            y,
            isWall: false,
            isExit: false,
            playerHere: false,
            enemyHere: false
        });
    }
    grid.push(row);
}

// הגדרת שחקן ואויב
const player = { x: 0, y: 0 };
const enemy = { x: 11, y: 11 };
grid[player.y][player.x].playerHere = true;
grid[enemy.y][enemy.x].enemyHere = true;

// הגדרת יציאות
grid[0][11].isExit = true;
grid[11][0].isExit = true;

function resetGame() {
    // איפוס כל התאים
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = grid[y][x];
            cell.isWall = false;
            cell.playerHere = false;
            cell.enemyHere = false;
            cell.isExit = false;
        }
    }

    // הצבה מחדש של שחקן, אויב ויציאות
    player.x = 0;
    player.y = 0;
    enemy.x = 11;
    enemy.y = 11;

    grid[player.y][player.x].playerHere = true;
    grid[enemy.y][enemy.x].enemyHere = true;
    grid[0][11].isExit = true;
    grid[11][0].isExit = true;

    drawGrid();
}

// ציור הגריד
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = grid[y][x];
            let color = "#fff";

            if (cell.isWall) color = "#444";
            else if (cell.isExit) color = "#0f0";
            else if (cell.playerHere) color = "#00f";
            else if (cell.enemyHere) color = "#f00";

            ctx.fillStyle = color;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = "#000";
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

drawGrid();

// תזוזת השחקן עם מקשי חצים + תור של המחשב
document.addEventListener("keydown", (event) => {
    let dx = 0,
        dy = 0;

    switch (event.key) {
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
            return; // מקש לא רלוונטי
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (
        newX >= 0 && newX < COLS &&
        newY >= 0 && newY < ROWS &&
        !grid[newY][newX].isWall
    ) {
        grid[player.y][player.x].playerHere = false;
        player.x = newX;
        player.y = newY;
        grid[player.y][player.x].playerHere = true;

        // תור של המחשב
        const path = aStar(grid[enemy.y][enemy.x], player, grid);
        if (path && path.length > 1) {
            grid[enemy.y][enemy.x].enemyHere = false;
            enemy.x = path[1].x;
            enemy.y = path[1].y;
            grid[enemy.y][enemy.x].enemyHere = true;
        }

        drawGrid();

        // בדיקת הפסד
        if (player.x === enemy.x && player.y === enemy.y) {
            setTimeout(() => {
                alert("💀 Game Over – The AI caught you!");
                resetGame();
            }, 100);
            return;
        }

        // בדיקת ניצחון
        if (grid[player.y][player.x].isExit) {
            setTimeout(() => {
                alert("🎉 You escaped the maze!");
                resetGame();
            }, 100);
            return;
        }

    }
});