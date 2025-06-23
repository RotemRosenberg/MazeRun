function aStar(start, goal, grid) {
    const openSet = [start];
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    const key = (p) => `${p.x},${p.y}`;

    gScore.set(key(start), 0);
    fScore.set(key(start), heuristic(start, goal));

    while (openSet.length > 0) {
        // מציאת הצומת עם ה-fScore הנמוך ביותר
        openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
        const current = openSet.shift();
        if (current.x === goal.x && current.y === goal.y) {
            return reconstructPath(cameFrom, current);
        }

        for (const neighbor of getNeighbors(current, grid)) {
            const tentativeG = gScore.get(key(current)) + 1;

            if (!gScore.has(key(neighbor)) || tentativeG < gScore.get(key(neighbor))) {
                cameFrom.set(key(neighbor), current);
                gScore.set(key(neighbor), tentativeG);
                fScore.set(key(neighbor), tentativeG + heuristic(neighbor, goal));

                if (!openSet.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return []; // אין מסלול
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    const key = (p) => `${p.x},${p.y}`;
    while (cameFrom.has(key(current))) {
        current = cameFrom.get(key(current));
        path.unshift(current);
    }
    return path;
}

function getNeighbors(cell, grid) {
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
            nx >= 0 && nx < grid[0].length &&
            ny >= 0 && ny < grid.length &&
            !grid[ny][nx].isWall
        ) {
            neighbors.push(grid[ny][nx]);
        }
    }

    return neighbors;
}