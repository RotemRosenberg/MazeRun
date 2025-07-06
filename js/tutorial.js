const canvas = document.getElementById("tutorialCanvas");
const ctx = canvas.getContext("2d");

const SIZE = 6;
const CELL_SIZE = canvas.width / SIZE;

let currentStep = 1;
let score = 0;

let grid = [];
let player = { x: 0, y: 0 };
let enemy = { x: -1, y: -1 };
let enemy2 = { x: -1, y: -1 };

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
    enemy = { x: -1, y: -1 };
    enemy2 = { x: -1, y: -1 };
    score = 0;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const cell = grid[y][x];
            
            // Draw white background for all cells
            ctx.fillStyle = "#fff";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Draw border
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = 1;
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Draw cell contents with icons
            const centerX = x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = y * CELL_SIZE + CELL_SIZE / 2;
            
            ctx.font = `${CELL_SIZE * 0.7}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            if (cell.isWall) {
                ctx.fillStyle = "#444";
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = "#fff";
                ctx.fillText("🧱", centerX, centerY);
            } else if (cell.isExit) {
                ctx.fillStyle = "#e8f5e8";
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = "#000";
                ctx.fillText("🚪", centerX, centerY);
            } else if (cell.isRandomizer) {
                ctx.fillStyle = "#e8f8ff";
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = "#000";
                ctx.fillText("🔄", centerX, centerY);
            } else if (cell.isExtraTurn) {
                ctx.fillStyle = "#fffacd";
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = "#000";
                ctx.fillText("⚡", centerX, centerY);
            } else if (cell.isCoin) {
                ctx.fillStyle = "#fff8dc";
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = "#000";
                ctx.fillText("🪙", centerX, centerY);
            }
            
            // Draw characters on top
            if (player.x === x && player.y === y) {
                ctx.fillStyle = "#000";
                ctx.fillText("👤", centerX, centerY);
            }
            if (enemy.x === x && enemy.y === y) {
                ctx.fillStyle = "#000";
                ctx.fillText("👹", centerX, centerY);
            }
            if (enemy2.x === x && enemy2.y === y) {
                ctx.fillStyle = "#000";
                ctx.fillText("😈", centerX, centerY);
            }
        }
    }
}

function updateStepIndicator() {
    // Update step number
    document.getElementById('stepNumber').textContent = currentStep;
    
    // Update dots
    for (let i = 1; i <= 6; i++) {
        const dot = document.getElementById(`dot${i}`);
        dot.classList.remove('active', 'completed');
        
        if (i < currentStep) {
            dot.classList.add('completed');
        } else if (i === currentStep) {
            dot.classList.add('active');
        }
    }
}

document.addEventListener("keydown", (e) => {
    let dx = 0, dy = 0;
    switch (e.key) {
        case "ArrowUp": dy = -1; break;
        case "ArrowDown": dy = 1; break;
        case "ArrowLeft": dx = -1; break;
        case "ArrowRight": dx = 1; break;
        default: return;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX >= 0 && newX < SIZE && newY >= 0 && newY < SIZE && !grid[newY][newX].isWall) {
        player.x = newX;
        player.y = newY;

        const cell = grid[newY][newX];

        // Check for coin collection
        if (cell.isCoin) {
            cell.isCoin = false;
            score++;
        }

        // Check for extra turn
        if (cell.isExtraTurn) {
            cell.isExtraTurn = false;
            Swal.fire({
                title: "⚡ Extra Turn!",
                text: "You got an extra turn! The enemy won't move this time.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        }

        // Check for randomizer
        if (cell.isRandomizer) {
            cell.isRandomizer = false;
            Swal.fire({
                title: "🔄 Randomizer!",
                text: "The maze layout has been shuffled!",
                icon: "info",
                timer: 1500,
                showConfirmButton: false
            });
        }

        drawGrid();

        // In tutorial, enemies don't move - they stay in their corners
        // This allows players to learn at their own pace

        // Check for enemy collision
        if ((player.x === enemy.x && player.y === enemy.y) || 
            (player.x === enemy2.x && player.y === enemy2.y)) {
            Swal.fire({
                title: "💀 Caught!",
                text: "The enemy caught you! Try again.",
                icon: "error",
                confirmButtonText: "Try Again"
            }).then(() => {
                restartCurrentStep();
            });
            return;
        }

        // Check for exit
        if (cell.isExit) {
            const isLastStep = currentStep === 6;
            let message = "You reached the exit!";
            if (score > 0) {
                message += ` You collected ${score} coins!`;
            }
            
            Swal.fire({
                title: "🎉 Great job!",
                text: message,
                icon: "success",
                confirmButtonText: isLastStep ? "Start Game!" : "Continue"
            }).then(() => {
                if (isLastStep) {
                    window.location.href = "game.html";
                } else {
                    nextStep();
                }
            });
        }
    }
});

// Enemies in tutorial don't move - they stay in their fixed positions
// This allows players to learn game mechanics without time pressure

function restartCurrentStep() {
    const steps = [step1, step2, step3, step4, step5, step6];
    if (currentStep >= 1 && currentStep <= 6) {
        steps[currentStep - 1]();
    }
}

function nextStep() {
    if (currentStep < 6) {
        currentStep++;
        const steps = [step1, step2, step3, step4, step5, step6];
        steps[currentStep - 1]();
        updateStepIndicator();
    }
}

function step1() {
    document.getElementById("instruction").innerHTML = "Use arrow keys ⬆️ ⬇️ ⬅️ ➡️ to move the player 👤<br><strong>Try moving around!</strong><br><em>Note: In tutorial mode, enemies don't move</em>";
    initGrid();
    drawGrid();
    updateStepIndicator();
}

function step2() {
    document.getElementById("instruction").innerHTML = "Now reach the green exit 🚪<br><strong>Goal: Get to the exit door!</strong>";
    initGrid();
    grid[SIZE - 1][SIZE - 1].isExit = true;
    drawGrid();
    updateStepIndicator();
}

function step3() {
    document.getElementById("instruction").innerHTML = "Collect the gold coin 🪙 and reach the exit 🚪<br><strong>Coins give you points!</strong>";
    initGrid();
    grid[2][3].isCoin = true;
    grid[SIZE - 1][SIZE - 1].isExit = true;
    drawGrid();
    updateStepIndicator();
}

function step4() {
    document.getElementById("instruction").innerHTML = "Avoid the red enemy 👹 and reach the exit 🚪<br><strong>Navigate around the enemy!</strong>";
    initGrid();
    enemy = { x: SIZE - 1, y: 0 }; // Top-right corner
    grid[SIZE - 1][SIZE - 1].isExit = true;
    drawGrid();
    updateStepIndicator();
}

function step5() {
    document.getElementById("instruction").innerHTML = "Collect power-ups! ⚡ = Extra Turn, 🔄 = Randomizer<br><strong>Learn what each power-up does!</strong>";
    initGrid();
    enemy = { x: 0, y: SIZE - 1 }; // Bottom-left corner
    grid[1][3].isExtraTurn = true;
    grid[3][1].isRandomizer = true;
    grid[2][4].isCoin = true;
    grid[SIZE - 1][SIZE - 1].isExit = true;
    drawGrid();
    updateStepIndicator();
}

function step6() {
    document.getElementById("instruction").innerHTML = "Hard Mode Preview: 2 enemies 👹😈! Collect coins and escape!<br><strong>In the real game, enemies will chase you!</strong>";
    initGrid();
    enemy = { x: SIZE - 1, y: 0 }; // Top-right corner
    enemy2 = { x: 0, y: SIZE - 1 }; // Bottom-left corner
    
    // Add some walls
    grid[2][2].isWall = true;
    grid[2][3].isWall = true;
    grid[3][2].isWall = true;
    
    // Add coins and power-ups
    grid[1][2].isCoin = true;
    grid[4][1].isCoin = true;
    grid[1][4].isExtraTurn = true;
    
    grid[SIZE - 2][SIZE - 2].isExit = true;
    
    // Update button text for final step
    const btn = document.getElementById("nextBtn");
    btn.textContent = "🎮 Start Game!";
    btn.className = "btn btn-success";
    btn.onclick = () => window.location.href = "game.html";
    
    drawGrid();
    updateStepIndicator();
}

// Start the tutorial
step1();