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
		// goes through each row
		for (let r = 0; r < this.rows; r++) {
			// each col
			for (let c = 0; c < this.cols; c++) {
				// if this number is more than 0 - put it in the numbered object with row and column
				if (this.grid[r][c] > 0) {
					numbered[this.grid[r][c]] = { r, c };
				}
			}
		}
		return numbered;
	}

	// literally a wrapper - initially I wanted to put the back tracking here and add the solution formatting together, but it was such a mess
	solve() {
		// Start from cell numbered 1
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
		// Add current position to path
		const cellKey = `${row},${col}`;
		path.push({ r: row, c: col });
		visited.add(cellKey);

		// Check if we've visited all cells
		if (visited.size === this.totalCells) {
			// Verify we ended at the highest numbered cell
			const currentCellNumber = this.grid[row][col];
			if (currentCellNumber === this.maxNumber) {
				return [...path]; // Return copy of successful path
			}
		}

		// Get valid next moves with smart ordering
		const nextMoves = this.getValidMoves(row, col, visited, nextRequiredNumber);

		for (const move of nextMoves) {
			const { r: nextRow, c: nextCol } = move;
			const nextCellNumber = this.grid[nextRow][nextCol];

			// Update next required number if we hit a numbered cell
			let newNextRequired = nextRequiredNumber;
			if (nextCellNumber > 0 && nextCellNumber === nextRequiredNumber) {
				newNextRequired = nextRequiredNumber + 1;
			}

			// Early pruning checks
			if (this.isValidMove(nextRow, nextCol, visited, newNextRequired)) {
				const result = this.backtrack(nextRow, nextCol, visited, path, newNextRequired);
				if (result) {
					return result;
				}
			}
		}

		// Backtrack
		path.pop();
		visited.delete(cellKey);
		return null;
	}

	// basic check: if the movement of the matrix was done, would it still be valid and in bounds of the array + check if it overlaps a path
	getValidMoves(row, col, visited, nextRequiredNumber) {
		const moves = [];
		const directions = [
			[-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
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

		// Sort moves by priority (higher priority first)
		return moves.sort((a, b) => b.priority - a.priority);
	}

	// basically it's a score system to help decide exploration (its a way for it to decide how to move) + pretty expensive operation ngl
	calculateMovePriority(row, col, nextRequiredNumber) {
		let priority = 0;
		const cellNumber = this.grid[row][col];

		// Highest priority: next required numbered cell
		if (cellNumber === nextRequiredNumber) {
			priority += 1000;
		}

		// Medium priority: cells closer to next required number
		if (nextRequiredNumber <= this.maxNumber && this.numberedCells[nextRequiredNumber]) {
			const target = this.numberedCells[nextRequiredNumber];
			const distance = Math.abs(row - target.r) + Math.abs(col - target.c);
			priority += Math.max(0, 100 - distance * 10);
		}

		// Lower priority: cells with fewer available neighbors (avoid creating isolated regions)
		const availableNeighbors = this.countAvailableNeighbors(row, col);
		if (availableNeighbors === 1) {
			priority += 50; // Prioritize potential dead ends to handle them early
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

		// Can't visit numbered cells out of order
		if (cellNumber > 0 && cellNumber < nextRequiredNumber) {
			return false;
		}

		// Can't skip required numbered cells
		if (cellNumber > nextRequiredNumber) {
			// Check if we would skip a required number
			for (let num = nextRequiredNumber; num < cellNumber; num++) {
				if (this.numberedCells[num]) {
					const requiredCell = this.numberedCells[num];
					if (!visited.has(`${requiredCell.r},${requiredCell.c}`)) {
						return false;
					}
				}
			}
		}

		// Check if move would isolate remaining numbered cells
		return this.wouldNotIsolateRequiredCells(row, col, visited, nextRequiredNumber);
	}

	wouldNotIsolateRequiredCells(row, col, visited, nextRequiredNumber) {
		// Simple connectivity check - ensure we can still reach remaining numbered cells
		const tempVisited = new Set(visited);
		tempVisited.add(`${row},${col}`);

		for (let num = nextRequiredNumber; num <= this.maxNumber; num++) {
			if (this.numberedCells[num]) {
				const target = this.numberedCells[num];
				const targetKey = `${target.r},${target.c}`;
				if (!tempVisited.has(targetKey)) {
					// Check if target is still reachable
					if (!this.isReachable(target.r, target.c, tempVisited)) {
						return false;
					}
				}
			}
		}
		return true;
	}

	isReachable(targetRow, targetCol, visited) {
		// Simple BFS to check reachability
		const queue = [];
		const tempVisited = new Set(visited);

		// Find any unvisited cell as starting point
		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				if (!tempVisited.has(`${r},${c}`)) {
					queue.push({ r, c });
					break;
				}
			}
			if (queue.length > 0) break;
		}

		if (queue.length === 0) return true; // All cells visited

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

const testSolver = () => {
	const exampleGrid = [
		[0, 0, 0, 0, 0, 0],
		[2, 0, 0, 0, 4, 0],
		[0, 0, 6, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[3, 0, 7, 0, 5, 0],
		[0, 0, 1, 0, 0, 0]
	];

	console.log("Grid:");
	exampleGrid.forEach(row => console.log(row.join(" ")));

	const solver = new ZipSolver(exampleGrid);
	console.log("\nNumbered cells found:", solver.numberedCells);

	console.log("\nSolving...");
	const solution = solver.solve();

	if (solution) {
		console.log("Solution found!");
		console.log(`Path length: ${solution.pathLength}`);
		console.log("Path:", solution.path.map(p => `(${p.r},${p.c})`).join(" -> "));

		// Visualize solution - show step numbers (visit order)
		const solutionGrid = Array(solver.rows).fill().map(() => Array(solver.cols).fill("*"));
		solution.path.forEach((cell, index) => {
			solutionGrid[cell.r][cell.c] = index + 1; // Just show step number
		});

		console.log("\nSolution visualization (step order):");
		console.table(solutionGrid);

		// Also show original puzzle layout
		console.log("\nOriginal puzzle layout:");
		const originalFormatted = exampleGrid.map(row =>
			row.map(cell => cell || ".")
		);
		console.table(originalFormatted);
	} else {
		console.log("No solution found!");
	}
}

testSolver();