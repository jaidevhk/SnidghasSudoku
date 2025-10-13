class SudokuGenerator {
    constructor() {
        this.size = 9;
        this.boxSize = 3;
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
    }
    
    setSize(size) {
        this.size = size;
        // Handle different grid sizes properly
        if (size === 4) {
            this.boxSize = 2; // 2x2 boxes
        } else if (size === 6) {
            this.boxSize = 2; // 2x3 boxes (we'll handle this specially)
        } else if (size === 9) {
            this.boxSize = 3; // 3x3 boxes
        } else {
            this.boxSize = Math.sqrt(size);
        }
        
        this.grid = Array(size).fill().map(() => Array(size).fill(0));
        this.solution = Array(size).fill().map(() => Array(size).fill(0));
    }

    // Generate a complete valid Sudoku grid
    generateComplete() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
            
            if (this.fillGrid()) {
                this.solution = this.grid.map(row => [...row]);
                console.log(`Successfully generated ${this.size}x${this.size} grid in ${attempts + 1} attempts`);
                return this.grid;
            }
            
            attempts++;
            console.log(`Attempt ${attempts} failed, retrying...`);
        }
        
        // If we can't generate a valid grid, create a simple one
        console.log(`Failed to generate valid grid after ${maxAttempts} attempts, creating fallback`);
        this.createFallbackGrid();
        this.solution = this.grid.map(row => [...row]);
        return this.grid;
    }
    
    // Create a simple valid grid as fallback
    createFallbackGrid() {
        // Create a simple pattern that's guaranteed to be valid
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                // Simple shift pattern
                this.grid[row][col] = ((row * this.boxSize + Math.floor(row / this.boxSize) + col) % this.size) + 1;
            }
        }
    }

    // Fill the grid using backtracking with timeout
    fillGrid() {
        const startTime = Date.now();
        const timeout = 5000; // 5 second timeout
        
        return this.fillGridRecursive(0, 0, startTime, timeout);
    }
    
    fillGridRecursive(row, col, startTime, timeout) {
        // Check timeout
        if (Date.now() - startTime > timeout) {
            return false;
        }
        
        // If we've filled all rows, we're done
        if (row === this.size) {
            return true;
        }
        
        // Move to next row if we've filled this row
        if (col === this.size) {
            return this.fillGridRecursive(row + 1, 0, startTime, timeout);
        }
        
        // If cell is already filled, move to next cell
        if (this.grid[row][col] !== 0) {
            return this.fillGridRecursive(row, col + 1, startTime, timeout);
        }
        
        // Try numbers in random order
        const numbers = this.shuffleArray(Array.from({length: this.size}, (_, i) => i + 1));
        for (let num of numbers) {
            if (this.isValid(row, col, num)) {
                this.grid[row][col] = num;
                if (this.fillGridRecursive(row, col + 1, startTime, timeout)) {
                    return true;
                }
                this.grid[row][col] = 0;
            }
        }
        
        return false;
    }

    // Check if placing a number is valid
    isValid(row, col, num) {
        // Check row
        for (let x = 0; x < this.size; x++) {
            if (this.grid[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < this.size; x++) {
            if (this.grid[x][col] === num) return false;
        }

        // Check box (handle 6x6 specially)
        if (this.size === 6) {
            // 6x6 uses 2x3 boxes
            const boxRow = Math.floor(row / 2);
            const boxCol = Math.floor(col / 3);
            const startRow = boxRow * 2;
            const startCol = boxCol * 3;
            
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    if (this.grid[startRow + i][startCol + j] === num) return false;
                }
            }
        } else {
            // Standard square boxes
            const startRow = Math.floor(row / this.boxSize) * this.boxSize;
            const startCol = Math.floor(col / this.boxSize) * this.boxSize;
            for (let i = 0; i < this.boxSize; i++) {
                for (let j = 0; j < this.boxSize; j++) {
                    if (this.grid[startRow + i][startCol + j] === num) return false;
                }
            }
        }

        return true;
    }

    // Generate puzzle by removing numbers based on difficulty
    generatePuzzle(difficulty, size = 9) {
        this.setSize(size);
        this.generateComplete();
        const puzzle = this.grid.map(row => [...row]);
        
        const totalCells = size * size;
        // Calculate cells to remove based on difficulty and grid size
        const removalPercentage = {
            1: 0.3,  // Easy: 30%
            2: 0.4,  // Medium: 40%
            3: 0.5,  // Hard: 50%
            4: 0.6,  // Expert: 60%
            5: 0.65  // Master: 65%
        };
        
        const percentage = removalPercentage[difficulty] || 0.6;
        const toRemove = Math.floor(totalCells * percentage);
        const positions = [];
        
        // Create array of all positions
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                positions.push([i, j]);
            }
        }

        // Shuffle positions and remove cells
        const shuffledPositions = this.shuffleArray(positions);
        for (let i = 0; i < toRemove && i < shuffledPositions.length; i++) {
            const [row, col] = shuffledPositions[i];
            puzzle[row][col] = 0;
        }

        return {
            puzzle: puzzle,
            solution: this.solution
        };
    }

    // Utility function to shuffle array
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Solve puzzle using backtracking
    solvePuzzle(grid) {
        const size = grid.length;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= size; num++) {
                        if (this.isValidForGrid(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (this.solvePuzzle(grid)) {
                                return true;
                            }
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // Check validity for a given grid
    isValidForGrid(grid, row, col, num) {
        const size = grid.length;
        
        // Check row
        for (let x = 0; x < size; x++) {
            if (grid[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < size; x++) {
            if (grid[x][col] === num) return false;
        }

        // Check box (handle 6x6 specially)
        if (size === 6) {
            // 6x6 uses 2x3 boxes
            const boxRow = Math.floor(row / 2);
            const boxCol = Math.floor(col / 3);
            const startRow = boxRow * 2;
            const startCol = boxCol * 3;
            
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    if (grid[startRow + i][startCol + j] === num) return false;
                }
            }
        } else {
            // Standard square boxes
            const boxSize = Math.sqrt(size);
            const startRow = Math.floor(row / boxSize) * boxSize;
            const startCol = Math.floor(col / boxSize) * boxSize;
            for (let i = 0; i < boxSize; i++) {
                for (let j = 0; j < boxSize; j++) {
                    if (grid[startRow + i][startCol + j] === num) return false;
                }
            }
        }

        return true;
    }

    // Get a hint (find next empty cell and provide correct number)
    getHint(currentGrid, solution) {
        const size = currentGrid.length;
        const emptyCells = [];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (currentGrid[row][col] === 0) {
                    emptyCells.push([row, col]);
                }
            }
        }

        if (emptyCells.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const [row, col] = emptyCells[randomIndex];
        
        return {
            row: row,
            col: col,
            value: solution[row][col]
        };
    }
}