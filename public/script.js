// ZIP Solver Class
class ZipSolver {
	constructor(grid) {
		this.grid = grid;
		this.rows = grid.length;
		this.cols = grid[0].length;
		this.totalCells = this.rows * this.cols;
		this.numberedCells = this.findNumberedCells();
		this.maxNumber = Math.max(...Object.keys(this.numberedCells).map(Number));
	}

	findNumberedCells() {
		const numbered = {};
		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				if (this.grid[r][c] > 0) {
					numbered[this.grid[r][c]] = { r, c };
				}
			}
		}
		return numbered;
	}

	solve() {
		const start = this.numberedCells[1];
		if (!start) {
			throw new Error("No starting cell (numbered 1) found");
		}

		const visited = new Set();
		const path = [];

		const solution = this.backtrack(start.r, start.c, visited, path, 1);
		return solution ? this.formatSolution(solution) : null;
	}

	backtrack(row, col, visited, path, nextRequiredNumber) {
		const cellKey = `${row},${col}`;
		path.push({ r: row, c: col });
		visited.add(cellKey);

		if (visited.size === this.totalCells) {
			const currentCellNumber = this.grid[row][col];
			if (currentCellNumber === this.maxNumber) {
				return [...path];
			}
		}

		const nextMoves = this.getValidMoves(row, col, visited, nextRequiredNumber);

		for (const move of nextMoves) {
			const { r: nextRow, c: nextCol } = move;
			const nextCellNumber = this.grid[nextRow][nextCol];

			let newNextRequired = nextRequiredNumber;
			if (nextCellNumber > 0 && nextCellNumber === nextRequiredNumber) {
				newNextRequired = nextRequiredNumber + 1;
			}

			if (this.isValidMove(nextRow, nextCol, visited, newNextRequired)) {
				const result = this.backtrack(nextRow, nextCol, visited, path, newNextRequired);
				if (result) {
					return result;
				}
			}
		}

		path.pop();
		visited.delete(cellKey);
		return null;
	}

	getValidMoves(row, col, visited, nextRequiredNumber) {
		const moves = [];
		const directions = [
			[-1, 0], [1, 0], [0, -1], [0, 1]
		];

		for (const [dr, dc] of directions) {
			const newRow = row + dr;
			const newCol = col + dc;

			if (this.isInBounds(newRow, newCol) && !visited.has(`${newRow},${newCol}`)) {
				moves.push({
					r: newRow,
					c: newCol,
					priority: this.calculateMovePriority(newRow, newCol, nextRequiredNumber)
				});
			}
		}

		return moves.sort((a, b) => b.priority - a.priority);
	}

	calculateMovePriority(row, col, nextRequiredNumber) {
		let priority = 0;
		const cellNumber = this.grid[row][col];

		if (cellNumber === nextRequiredNumber) {
			priority += 1000;
		}

		if (nextRequiredNumber <= this.maxNumber && this.numberedCells[nextRequiredNumber]) {
			const target = this.numberedCells[nextRequiredNumber];
			const distance = Math.abs(row - target.r) + Math.abs(col - target.c);
			priority += Math.max(0, 100 - distance * 10);
		}

		const availableNeighbors = this.countAvailableNeighbors(row, col);
		if (availableNeighbors === 1) {
			priority += 50;
		}

		return priority;
	}

	countAvailableNeighbors(row, col) {
		let count = 0;
		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

		for (const [dr, dc] of directions) {
			const newRow = row + dr;
			const newCol = col + dc;
			if (this.isInBounds(newRow, newCol)) {
				count++;
			}
		}
		return count;
	}

	isValidMove(row, col, visited, nextRequiredNumber) {
		const cellNumber = this.grid[row][col];

		if (cellNumber > 0 && cellNumber < nextRequiredNumber) {
			return false;
		}

		if (cellNumber > nextRequiredNumber) {
			for (let num = nextRequiredNumber; num < cellNumber; num++) {
				if (this.numberedCells[num]) {
					const requiredCell = this.numberedCells[num];
					if (!visited.has(`${requiredCell.r},${requiredCell.c}`)) {
						return false;
					}
				}
			}
		}

		return this.wouldNotIsolateRequiredCells(row, col, visited, nextRequiredNumber);
	}

	wouldNotIsolateRequiredCells(row, col, visited, nextRequiredNumber) {
		const tempVisited = new Set(visited);
		tempVisited.add(`${row},${col}`);

		for (let num = nextRequiredNumber; num <= this.maxNumber; num++) {
			if (this.numberedCells[num]) {
				const target = this.numberedCells[num];
				const targetKey = `${target.r},${target.c}`;
				if (!tempVisited.has(targetKey)) {
					if (!this.isReachable(target.r, target.c, tempVisited)) {
						return false;
					}
				}
			}
		}
		return true;
	}

	isReachable(targetRow, targetCol, visited) {
		const queue = [];
		const tempVisited = new Set(visited);

		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				if (!tempVisited.has(`${r},${c}`)) {
					queue.push({ r, c });
					break;
				}
			}
			if (queue.length > 0) break;
		}

		if (queue.length === 0) return true;

		const bfsVisited = new Set();

		while (queue.length > 0) {
			const { r, c } = queue.shift();
			const key = `${r},${c}`;

			if (bfsVisited.has(key) || visited.has(key)) continue;

			bfsVisited.add(key);

			if (r === targetRow && c === targetCol) {
				return true;
			}

			const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			for (const [dr, dc] of directions) {
				const newR = r + dr;
				const newC = c + dc;
				if (this.isInBounds(newR, newC)) {
					queue.push({ r: newR, c: newC });
				}
			}
		}

		return false;
	}

	isInBounds(row, col) {
		return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
	}

	formatSolution(path) {
		return {
			path: path,
			pathLength: path.length,
			isComplete: path.length === this.totalCells,
			moves: path.map((cell, index) => ({
				step: index + 1,
				position: `(${cell.r}, ${cell.c})`,
				cellValue: this.grid[cell.r][cell.c]
			}))
		};
	}
}

// UI State Variables
let currentRows = 6;
let currentCols = 6;
let currentSolution = null;
let animationStep = 0;
let animationInterval = null;
let isAnimating = false;

// Example puzzles
const examples = [
	[
		[0, 0, 0, 0, 0, 0],
		[2, 0, 0, 0, 4, 0],
		[0, 0, 6, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[3, 0, 7, 0, 5, 0],
		[0, 0, 1, 0, 0, 0]
	],
	[
		[1, 0, 0, 4],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[2, 0, 0, 3]
	],
	[
		[0, 0, 3, 0, 0],
		[0, 0, 0, 0, 0],
		[4, 0, 1, 0, 5],
		[0, 0, 0, 0, 0],
		[0, 0, 2, 0, 0]
	]
];

// Grid Creation and Management
function createGrid() {
	currentRows = parseInt(document.getElementById("rows").value);
	currentCols = parseInt(document.getElementById("cols").value);

	const inputGrid = document.getElementById("inputGrid");
	inputGrid.innerHTML = "";
	inputGrid.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;

	for (let r = 0; r < currentRows; r++) {
		for (let c = 0; c < currentCols; c++) {
			const cell = document.createElement("div");
			cell.className = "cell";

			const input = document.createElement("input");
			input.type = "number";
			input.min = "0";
			input.max = "99";
			input.value = "0";
			input.dataset.row = r;
			input.dataset.col = c;
			input.addEventListener("input", onCellInput);

			cell.appendChild(input);
			inputGrid.appendChild(cell);
		}
	}

	hideSolution();
}

function onCellInput(event) {
	const input = event.target;
	const value = parseInt(input.value) || 0;

	if (value > 0) {
		input.parentElement.classList.add("numbered-cell");
	} else {
		input.parentElement.classList.remove("numbered-cell");
	}
}

function clearGrid() {
	const inputs = document.querySelectorAll("#inputGrid input");
	inputs.forEach(input => {
		input.value = "0";
		input.parentElement.classList.remove("numbered-cell");
	});
	hideSolution();
}

function getGridFromInput() {
	const grid = [];
	for (let r = 0; r < currentRows; r++) {
		const row = [];
		for (let c = 0; c < currentCols; c++) {
			const input = document.querySelector(`#inputGrid input[data-row="${r}"][data-col="${c}"]`);
			row.push(parseInt(input.value) || 0);
		}
		grid.push(row);
	}
	return grid;
}

function validatePuzzle(grid) {
	const errors = [];
	const numberedCells = {};
	const totalCells = grid.length * grid[0].length;

	// Find all numbered cells
	for (let r = 0; r < grid.length; r++) {
		for (let c = 0; c < grid[r].length; c++) {
			if (grid[r][c] > 0) {
				const num = grid[r][c];

				// Check for duplicate numbers
				if (numberedCells[num]) {
					errors.push(`Duplicate number ${num} found at (${r},${c}) and (${numberedCells[num].r},${numberedCells[num].c})`);
				} else {
					numberedCells[num] = { r, c };
				}

				// Check if number is too large for grid
				if (num > totalCells) {
					errors.push(`Number ${num} at (${r},${c}) is larger than total cells (${totalCells})`);
				}
			}
		}
	}

	// Check if we have at least 2 numbered cells
	const numberedCount = Object.keys(numberedCells).length;
	if (numberedCount < 2) {
		errors.push("Puzzle must have at least 2 numbered cells");
	}

	// Check if we have cell number 1 (starting point)
	if (!numberedCells[1]) {
		errors.push("Puzzle must have a cell numbered 1 (starting point)");
	}

	// Check for consecutive numbering (no gaps)
	const numbers = Object.keys(numberedCells).map(Number).sort((a, b) => a - b);
	const maxNumber = Math.max(...numbers);

	for (let i = 1; i <= maxNumber; i++) {
		if (!numberedCells[i]) {
			errors.push(`Missing number ${i} - numbered cells must be consecutive from 1`);
		}
	}

	// Check if all numbered cells are reachable from each other
	if (numberedCount > 1) {
		const connectivity = checkConnectivity(grid, numberedCells);
		if (!connectivity.isConnected) {
			errors.push("Some numbered cells are unreachable from others");
		}
	}

	// Check if puzzle has enough cells for a valid solution
	if (numberedCount > totalCells) {
		errors.push(`Too many numbered cells (${numberedCount}) for grid size (${totalCells} cells)`);
	}

	return {
		isValid: errors.length === 0,
		errors: errors,
		numberedCells: numberedCells,
		maxNumber: maxNumber
	};
}

function checkConnectivity(grid, numberedCells) {
	const rows = grid.length;
	const cols = grid[0].length;
	const visited = new Set();
	const queue = [];

	// Start BFS from any cell
	queue.push({ r: 0, c: 0 });
	visited.add("0,0");

	while (queue.length > 0) {
		const { r, c } = queue.shift();

		// Check all 4 directions 
		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		for (const [dr, dc] of directions) {
			const newR = r + dr;
			const newC = c + dc;
			const key = `${newR},${newC}`;

			if (newR >= 0 && newR < rows && newC >= 0 && newC < cols && !visited.has(key)) {
				visited.add(key);
				queue.push({ r: newR, c: newC });
			}
		}
	}

	// Check if all numbered cells are in the connected component
	let allNumberedReachable = true;
	for (const num in numberedCells) {
		const cell = numberedCells[num];
		if (!visited.has(`${cell.r},${cell.c}`)) {
			allNumberedReachable = false;
			break;
		}
	}

	return {
		isConnected: visited.size === rows * cols && allNumberedReachable,
		reachableCells: visited.size
	};
}

function solveGrid() {
	try {
		const grid = getGridFromInput();

		// Validate puzzle first
		updateStatus("Validating puzzle...", "solving");
		const validation = validatePuzzle(grid);

		if (!validation.isValid) {
			const errorMessage = "Puzzle validation failed:\n" + validation.errors.join("\n");
			updateStatus(errorMessage, "error");
			showValidationErrors(validation.errors);
			return;
		}

		updateStatus("Puzzle is valid! Solving...", "solving");

		// Small delay to show validation message
		setTimeout(() => {
			try {
				const solver = new ZipSolver(grid);
				const solution = solver.solve();

				if (solution) {
					currentSolution = solution;
					showSolution();
					animationStep = 0;
					startAnimation();
					updateStatus(`Puzzle solved! Found path with ${solution.pathLength} steps.`, "solved");
				} else {
					updateStatus("No solution found for this puzzle.", "error");
				}
			} catch (error) {
				updateStatus(`Solving error: ${error.message}`, "error");
			}
		}, 500);

	} catch (error) {
		updateStatus(`Error: ${error.message}`, "error");
	}
}

function showValidationErrors(errors) {
	// Highlight problematic cells
	const inputs = document.querySelectorAll("#inputGrid input");
	inputs.forEach(input => {
		input.parentElement.classList.remove("error-cell");
	});

	// You could add specific error highlighting here
	// For now, we'll just show the errors in the status
}

function showSolution() {
	const solutionSection = document.getElementById("solutionSection");
	const solutionGrid = document.getElementById("solutionGrid");

	solutionSection.style.display = "block";
	solutionGrid.innerHTML = "";
	solutionGrid.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;

	for (let r = 0; r < currentRows; r++) {
		for (let c = 0; c < currentCols; c++) {
			const cell = document.createElement("div");
			cell.className = "cell";
			cell.dataset.row = r;
			cell.dataset.col = c;

			const originalValue = getGridFromInput()[r][c];
			if (originalValue > 0) {
				cell.textContent = originalValue;
				cell.classList.add("numbered-cell");
			}

			solutionGrid.appendChild(cell);
		}
	}

	document.getElementById("animationControls").style.display = "flex";
}

function hideSolution() {
	document.getElementById("solutionSection").style.display = "none";
	document.getElementById("animationControls").style.display = "none";
	currentSolution = null;
	stopAnimation();
}

function updateSolutionStep(stepIndex) {
	if (!currentSolution) return;

	const solutionCells = document.querySelectorAll("#solutionGrid .cell");
	const originalGrid = getGridFromInput();

	// Clear previous step highlighting
	solutionCells.forEach(cell => {
		cell.classList.remove("current-step", "current-numbered-step", "solution-cell", "numbered-solution-cell");
		if (!cell.classList.contains("numbered-cell")) {
			cell.textContent = "";
		}
	});

	// Show path up to current step
	for (let i = 0; i <= stepIndex && i < currentSolution.path.length; i++) {
		const step = currentSolution.path[i];
		const cell = document.querySelector(`#solutionGrid .cell[data-row="${step.r}"][data-col="${step.c}"]`);
		const isNumberedCell = originalGrid[step.r][step.c] > 0;

		if (cell) {
			if (i === stepIndex) {
				// Current step - different colors for numbered vs empty cells
				if (isNumberedCell) {
					cell.classList.add("current-numbered-step");
				} else {
					cell.classList.add("current-step");
				}
			} else {
				// Previous steps - red for numbered cells, green for empty cells
				if (isNumberedCell) {
					cell.classList.add("numbered-solution-cell");
				} else {
					cell.classList.add("solution-cell");
					cell.textContent = i + 1;
				}
			}
		}
	}

	updateStepInfo(stepIndex);
}

function updateStepInfo(stepIndex) {
	if (!currentSolution) return;

	const stepInfo = document.getElementById("stepInfo");
	const totalSteps = currentSolution.path.length;
	const currentPos = currentSolution.path[stepIndex];
	const cellValue = getGridFromInput()[currentPos.r][currentPos.c];

	let statusText = `Step ${stepIndex + 1} of ${totalSteps}<br>Position: (${currentPos.r}, ${currentPos.c})<br>`;

	if (cellValue > 0) {
		statusText += `<span style="color: #e53e3e; font-weight: bold;">📍 Visiting numbered cell: ${cellValue}</span>`;
	} else {
		statusText += "<span style=\"color: #48bb78;\">📍 Visiting empty cell</span>";
	}

	stepInfo.innerHTML = statusText;
}

function startAnimation() {
	if (animationInterval) clearInterval(animationInterval);

	isAnimating = true;
	document.getElementById("playPause").textContent = "⏸ Pause";

	const speed = parseInt(document.getElementById("speed").value);
	const delay = 1100 - (speed * 100); // Convert to milliseconds

	animationInterval = setInterval(() => {
		if (animationStep < currentSolution.path.length) {
			updateSolutionStep(animationStep);
			animationStep++;
		} else {
			stopAnimation();
		}
	}, delay);
}

function stopAnimation() {
	if (animationInterval) {
		clearInterval(animationInterval);
		animationInterval = null;
	}
	isAnimating = false;
	document.getElementById("playPause").textContent = "▶ Play";
}

function toggleAnimation() {
	if (isAnimating) {
		stopAnimation();
	} else {
		startAnimation();
	}
}

function nextStep() {
	if (!currentSolution) return;

	stopAnimation();
	if (animationStep < currentSolution.path.length) {
		updateSolutionStep(animationStep);
		animationStep++;
	}
}

function prevStep() {
	if (!currentSolution) return;

	stopAnimation();
	if (animationStep > 0) {
		animationStep--;
		updateSolutionStep(animationStep);
	}
}

function updateStatus(message, type = "") {
	const status = document.getElementById("status");
	status.textContent = message;
	status.className = `status ${type}`;
}

function loadExample(index) {
	const example = examples[index];

	// Update grid size
	document.getElementById("rows").value = example.length;
	document.getElementById("cols").value = example[0].length;
	createGrid();

	// Fill in the example data
	for (let r = 0; r < example.length; r++) {
		for (let c = 0; c < example[r].length; c++) {
			const input = document.querySelector(`#inputGrid input[data-row="${r}"][data-col="${c}"]`);
			if (input) {
				input.value = example[r][c];
				if (example[r][c] > 0) {
					input.parentElement.classList.add("numbered-cell");
				}
			}
		}
	}

	updateStatus(`Example ${index + 1} loaded! Click "Solve Puzzle" to validate and solve.`);
}

function testInvalidPuzzle() {
	// Create an invalid puzzle for testing
	const invalidGrid = [
		[1, 0, 0, 5], // Missing numbers 2, 3, 4
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0]
	];

	document.getElementById("rows").value = 4;
	document.getElementById("cols").value = 4;
	createGrid();

	for (let r = 0; r < 4; r++) {
		for (let c = 0; c < 4; c++) {
			const input = document.querySelector(`#inputGrid input[data-row="${r}"][data-col="${c}"]`);
			if (input) {
				input.value = invalidGrid[r][c];
				if (invalidGrid[r][c] > 0) {
					input.parentElement.classList.add("numbered-cell");
				}
			}
		}
	}

	updateStatus("Invalid test puzzle loaded - try solving to see validation errors.");
}

// Event listeners
document.getElementById("speed").addEventListener("input", function () {
	document.getElementById("speedValue").textContent = this.value;
	if (isAnimating) {
		startAnimation(); // Restart with new speed
	}
});

// Initialize
createGrid();
loadExample(0); 