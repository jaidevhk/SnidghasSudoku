class SudokuGame {
    constructor() {
        this.generator = new SudokuGenerator();
        this.currentPuzzle = null;
        this.currentSolution = null;
        this.currentGrid = null;
        this.givenCells = new Set();
        this.startTime = null;
        this.timerInterval = null;
        this.difficulty = 3; // Default to Hard
        this.gridSize = 9; // Default to 9x9
        this.hintsUsed = 0;
        
        // Settings
        this.settings = {
            liveChecking: false,
            backgroundColor: 'gradient'
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.loadScores();
        
        // Try to restore previous game state first
        const gameRestored = this.loadGameState();
        
        if (!gameRestored) {
            // No saved game, show setup modal
            this.showSetupModal();
        }
    }

    initializeElements() {
        this.gridElement = document.getElementById('sudoku-grid');
        this.timerElement = document.getElementById('timer');
        this.currentDifficultyElement = document.getElementById('current-difficulty');
        this.newGameBtn = document.getElementById('new-game');
        this.scoresBtn = document.getElementById('scores-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.checkBtn = document.getElementById('check-btn');
        this.solveBtn = document.getElementById('solve-btn');
        
        // Settings
        this.settingsBtn = document.getElementById('settings-btn');
        
        // Modals
        this.setupModal = document.getElementById('setup-modal');
        this.setupCloseBtn = document.getElementById('setup-close');
        this.startGameBtn = document.getElementById('start-game');
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsCloseBtn = document.getElementById('settings-close');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.liveCheckingCheckbox = document.getElementById('live-checking');
        this.scoresModal = document.getElementById('scores-modal');
        this.winModal = document.getElementById('win-modal');
        this.scoresCloseBtn = this.scoresModal.querySelector('.close');
        this.playAgainBtn = document.getElementById('play-again');
        this.scoresListElement = document.getElementById('scores-list');
        this.winStatsElement = document.getElementById('win-stats');
    }

    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.showSetupModal());
        this.scoresBtn.addEventListener('click', () => this.showScores());
        this.settingsBtn.addEventListener('click', () => this.showSettingsModal());
        this.hintBtn.addEventListener('click', () => this.giveHint());
        this.checkBtn.addEventListener('click', () => this.checkSolution());
        this.solveBtn.addEventListener('click', () => this.solvePuzzle());
        
        this.startGameBtn.addEventListener('click', () => {
            const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
            const selectedGridSize = document.querySelector('input[name="grid-size"]:checked');
            
            if (selectedDifficulty && selectedGridSize) {
                this.difficulty = parseInt(selectedDifficulty.value);
                this.gridSize = parseInt(selectedGridSize.value);
                this.clearGameState(); // Clear any existing game state
                this.hideSetupModal();
                this.newGame();
            }
        });
        
        this.playAgainBtn.addEventListener('click', () => {
            this.hideWinModal();
            this.showSetupModal();
        });
        
        this.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            this.hideSettingsModal();
        });

        // Modal events
        this.setupCloseBtn.addEventListener('click', () => this.hideSetupModal());
        this.settingsCloseBtn.addEventListener('click', () => this.hideSettingsModal());
        this.scoresCloseBtn.addEventListener('click', () => this.hideScoresModal());
        
        window.addEventListener('click', (e) => {
            if (e.target === this.setupModal) this.hideSetupModal();
            if (e.target === this.settingsModal) this.hideSettingsModal();
            if (e.target === this.scoresModal) this.hideScoresModal();
            if (e.target === this.winModal) this.hideWinModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSetupModal();
                this.hideSettingsModal();
                this.hideScoresModal();
                this.hideWinModal();
            }
        });
    }

    newGame() {
        this.hintsUsed = 0;
        const { puzzle, solution } = this.generator.generatePuzzle(this.difficulty, this.gridSize);
        
        // Debug: Check if puzzle has any given numbers
        let givenCount = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (puzzle[row][col] !== 0) {
                    givenCount++;
                }
            }
        }
        console.log(`Generated puzzle with ${givenCount} given numbers out of ${this.gridSize * this.gridSize} total cells`);
        
        this.currentPuzzle = puzzle;
        this.currentSolution = solution;
        this.currentGrid = puzzle.map(row => [...row]);
        this.givenCells.clear();
        
        // Track given cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (puzzle[row][col] !== 0) {
                    this.givenCells.add(`${row}-${col}`);
                }
            }
        }
        
        this.createGrid();
        this.startTimer();
        this.updateDifficultyDisplay();
        
        // Save the initial game state
        setTimeout(() => {
            this.saveGameState();
        }, 100);
    }

    createGrid() {
        this.gridElement.innerHTML = '';
        
        const boxSize = Math.sqrt(this.gridSize);
        const cellSize = this.gridSize === 4 ? 60 : this.gridSize === 6 ? 50 : 45;
        
        // Update grid CSS
        this.gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cellSize}px)`;
        this.gridElement.style.gridTemplateRows = `repeat(${this.gridSize}, ${cellSize}px)`;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('input');
                cell.type = 'text';
                cell.className = 'cell';
                cell.maxLength = this.gridSize > 9 ? 2 : 1;
                cell.inputMode = 'numeric';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('autocomplete', 'off');
                cell.style.minWidth = `${cellSize}px`;
                cell.style.minHeight = `${cellSize}px`;
                
                // Add borders for box sections
                if (this.gridSize === 6) {
                    // 6x6 uses 2x3 boxes
                    if (col === 3) {
                        cell.classList.add('border-left');
                    }
                    if (row === 2 || row === 4) {
                        cell.classList.add('border-top');
                    }
                } else {
                    // Standard square boxes
                    if (col > 0 && (col % boxSize === 0) && col < this.gridSize - 1) {
                        cell.classList.add('border-left');
                    }
                    if (row > 0 && (row % boxSize === 0) && row < this.gridSize - 1) {
                        cell.classList.add('border-top');
                    }
                }
                
                const value = this.currentGrid[row][col];
                if (value !== 0) {
                    cell.value = value;
                    if (this.givenCells.has(`${row}-${col}`)) {
                        cell.classList.add('given');
                        cell.readOnly = true;
                    }
                }
                
                this.bindCellEvents(cell);
                this.gridElement.appendChild(cell);
            }
        }
    }

    bindCellEvents(cell) {
        cell.addEventListener('input', (e) => {
            const value = e.target.value;
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            // Only allow numbers 1-gridSize or empty
            const regex = new RegExp(`^[1-${this.gridSize}]$`);
            if (value && (!regex.test(value))) {
                e.target.value = '';
                return;
            }
            
            this.currentGrid[row][col] = value ? parseInt(value) : 0;
            
            // Save game state after each move
            this.saveGameState();
            
            // Only validate if live checking is enabled
            if (this.settings.liveChecking) {
                this.validateCell(cell);
            } else {
                // Clear any existing error state
                cell.classList.remove('error');
            }
            
            // Check if puzzle is complete
            if (this.isPuzzleComplete()) {
                this.completePuzzle();
            }
        });

        cell.addEventListener('focus', (e) => {
            this.highlightRelated(e.target);
        });

        cell.addEventListener('blur', () => {
            this.clearHighlights();
        });

        // Allow arrow key navigation
        cell.addEventListener('keydown', (e) => {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            let newRow = row;
            let newCol = col;
            
            switch(e.key) {
                case 'ArrowUp':
                    newRow = Math.max(0, row - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(this.gridSize - 1, row + 1);
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, col - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(this.gridSize - 1, col + 1);
                    break;
                default:
                    return;
            }
            
            e.preventDefault();
            const nextCell = this.gridElement.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
            if (nextCell) nextCell.focus();
        });
    }

    validateCell(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = parseInt(cell.value);
        
        cell.classList.remove('error');
        
        if (!value) return;
        
        // Check for conflicts
        const hasConflict = this.hasConflict(row, col, value);
        if (hasConflict) {
            cell.classList.add('error');
        }
    }

    hasConflict(row, col, value) {
        // Check row
        for (let c = 0; c < this.gridSize; c++) {
            if (c !== col && this.currentGrid[row][c] === value) {
                return true;
            }
        }
        
        // Check column
        for (let r = 0; r < this.gridSize; r++) {
            if (r !== row && this.currentGrid[r][col] === value) {
                return true;
            }
        }
        
        // Check box (handle 6x6 specially)
        if (this.gridSize === 6) {
            // 6x6 uses 2x3 boxes
            const boxRow = Math.floor(row / 2);
            const boxCol = Math.floor(col / 3);
            const startRow = boxRow * 2;
            const startCol = boxCol * 3;
            
            for (let r = startRow; r < startRow + 2; r++) {
                for (let c = startCol; c < startCol + 3; c++) {
                    if ((r !== row || c !== col) && this.currentGrid[r][c] === value) {
                        return true;
                    }
                }
            }
        } else {
            // Standard square boxes
            const boxSize = Math.sqrt(this.gridSize);
            const startRow = Math.floor(row / boxSize) * boxSize;
            const startCol = Math.floor(col / boxSize) * boxSize;
            
            for (let r = startRow; r < startRow + boxSize; r++) {
                for (let c = startCol; c < startCol + boxSize; c++) {
                    if ((r !== row || c !== col) && this.currentGrid[r][c] === value) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    highlightRelated(cell) {
        this.clearHighlights();
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = cell.value;
        
        // Highlight same row, column, and box
        const cells = this.gridElement.querySelectorAll('.cell');
        cells.forEach(c => {
            const cRow = parseInt(c.dataset.row);
            const cCol = parseInt(c.dataset.col);
            
            let inSameBox = false;
            if (this.gridSize === 6) {
                // 6x6 uses 2x3 boxes
                const boxRow = Math.floor(row / 2);
                const boxCol = Math.floor(col / 3);
                const cBoxRow = Math.floor(cRow / 2);
                const cBoxCol = Math.floor(cCol / 3);
                inSameBox = (boxRow === cBoxRow && boxCol === cBoxCol);
            } else {
                // Standard square boxes
                const boxSize = Math.sqrt(this.gridSize);
                inSameBox = (Math.floor(cRow / boxSize) === Math.floor(row / boxSize) && 
                           Math.floor(cCol / boxSize) === Math.floor(col / boxSize));
            }
            
            if (cRow === row || cCol === col || inSameBox) {
                c.classList.add('highlight');
            }
            
            // Highlight same numbers
            if (value && c.value === value) {
                c.classList.add('highlight');
            }
        });
    }

    clearHighlights() {
        const cells = this.gridElement.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('highlight'));
    }

    isPuzzleComplete() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.currentGrid[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    completePuzzle() {
        this.stopTimer();
        const time = this.getElapsedTime();
        const timeInSeconds = this.getElapsedTimeInSeconds();
        const calculatedScore = this.calculateScore(timeInSeconds);
        
        const score = {
            gridSize: this.gridSize,
            difficulty: this.getDifficultyName(this.difficulty),
            difficultyLevel: this.difficulty,
            time: time,
            timeInSeconds: timeInSeconds,
            hintsUsed: this.hintsUsed,
            score: calculatedScore,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.saveScore(score);
        this.clearGameState(); // Clear saved game when completed
        this.showWinModal(score);
    }

    giveHint() {
        const hint = this.generator.getHint(this.currentGrid, this.currentSolution);
        if (hint) {
            this.hintsUsed++;
            const cell = this.gridElement.querySelector(`[data-row="${hint.row}"][data-col="${hint.col}"]`);
            if (cell) {
                cell.value = hint.value;
                this.currentGrid[hint.row][hint.col] = hint.value;
                this.validateCell(cell);
                this.saveGameState(); // Save after hint
                
                if (this.isPuzzleComplete()) {
                    this.completePuzzle();
                }
            }
        }
    }

    checkSolution() {
        let hasErrors = false;
        const cells = this.gridElement.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            cell.classList.remove('error');
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = parseInt(cell.value);
            
            if (value && this.hasConflict(row, col, value)) {
                cell.classList.add('error');
                hasErrors = true;
            }
        });
        
        if (!hasErrors && this.isPuzzleComplete()) {
            this.completePuzzle();
        }
    }

    solvePuzzle() {
        const gridCopy = this.currentGrid.map(row => [...row]);
        if (this.generator.solvePuzzle(gridCopy)) {
            this.currentGrid = gridCopy;
            this.updateGridDisplay();
            this.completePuzzle();
        }
    }

    updateGridDisplay() {
        const cells = this.gridElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.currentGrid[row][col];
            
            if (!cell.classList.contains('given')) {
                cell.value = value || '';
            }
        });
    }

    startTimer() {
        // Only set startTime if it's not already set (for new games)
        if (!this.startTime) {
            console.log('Setting new startTime for fresh game');
            this.startTime = Date.now();
        } else {
            console.log(`Using existing startTime: ${new Date(this.startTime).toLocaleTimeString()}`);
        }
        
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
        
        // Update timer display immediately
        this.updateTimer();
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const elapsed = this.getElapsedTime();
        this.timerElement.textContent = elapsed;
        
        // Save game state periodically (every 10 seconds) to update elapsed time
        const currentElapsed = Date.now() - this.startTime;
        if (this.startTime && Math.floor(currentElapsed / 10000) !== Math.floor((currentElapsed - 1000) / 10000)) {
            this.saveGameState();
        }
    }

    getElapsedTime() {
        if (!this.startTime) return '00:00';
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    getElapsedTimeInSeconds() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    calculateScore(timeInSeconds) {
        // Base score multipliers for grid size
        const gridMultiplier = {
            4: 100,   // 4x4 = 100 base points
            6: 300,   // 6x6 = 300 base points  
            9: 1000   // 9x9 = 1000 base points
        };
        
        // Difficulty multipliers
        const difficultyMultiplier = {
            1: 1.0,   // Easy
            2: 1.5,   // Medium
            3: 2.0,   // Hard
            4: 3.0,   // Expert
            5: 4.0    // Master
        };
        
        const baseScore = gridMultiplier[this.gridSize] || 1000;
        const diffMultiplier = difficultyMultiplier[this.difficulty] || 2.0;
        
        // Time bonus (faster = higher score)
        // Perfect time targets: 4x4=60s, 6x6=180s, 9x9=300s
        const perfectTime = {
            4: 60,
            6: 180,
            9: 300
        };
        
        const targetTime = perfectTime[this.gridSize] || 300;
        const timeBonus = Math.max(0, (targetTime - timeInSeconds) / targetTime);
        
        // Hint penalty (each hint reduces score by 10%)
        const hintPenalty = Math.pow(0.9, this.hintsUsed);
        
        // Calculate final score
        let finalScore = baseScore * diffMultiplier * (1 + timeBonus) * hintPenalty;
        
        // Minimum score of 10
        finalScore = Math.max(10, Math.round(finalScore));
        
        return finalScore;
    }

    getDifficultyName(level) {
        const names = {
            1: 'Easy',
            2: 'Medium', 
            3: 'Hard',
            4: 'Expert',
            5: 'Master'
        };
        return names[level] || 'Hard';
    }

    updateDifficultyDisplay() {
        this.currentDifficultyElement.textContent = `${this.gridSize}×${this.gridSize} - ${this.getDifficultyName(this.difficulty)}`;
    }
    
    showSetupModal() {
        this.setupModal.style.display = 'block';
    }
    
    hideSetupModal() {
        this.setupModal.style.display = 'none';
    }

    saveScore(score) {
        let scores = JSON.parse(localStorage.getItem('sudokuScores') || '[]');
        scores.push(score);
        scores.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
        localStorage.setItem('sudokuScores', JSON.stringify(scores));
    }

    loadScores() {
        return JSON.parse(localStorage.getItem('sudokuScores') || '[]');
    }

    showScores() {
        const scores = this.loadScores();
        this.scoresListElement.innerHTML = '';
        
        if (scores.length === 0) {
            this.scoresListElement.innerHTML = '<p style="text-align: center; color: #666;">No games played yet</p>';
        } else {
            scores.forEach((score, index) => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'score-item';
                
                const date = new Date(score.date).toLocaleDateString();
                const hintsText = score.hintsUsed > 0 ? ` (${score.hintsUsed} hints)` : '';
                const gridSize = score.gridSize || 9;
                const gameScore = score.score || this.calculateScoreFromOldData(score);
                
                scoreItem.innerHTML = `
                    <div class="score-info">
                        <div class="score-difficulty">${gridSize}×${gridSize} - ${score.difficulty}</div>
                        <div class="score-date">${date}</div>
                        <div class="score-time">${score.time}${hintsText}</div>
                    </div>
                    <div class="score-points">
                        <div class="score-number">${gameScore}</div>
                        <div class="score-label">points</div>
                    </div>
                `;
                
                this.scoresListElement.appendChild(scoreItem);
            });
        }
        
        this.scoresModal.style.display = 'block';
    }
    
    calculateScoreFromOldData(score) {
        // For backward compatibility with old scores that don't have a score field
        const gridMultiplier = { 4: 100, 6: 300, 9: 1000 };
        const difficultyMultiplier = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 4.0 };
        
        const gridSize = score.gridSize || 9;
        const diffLevel = score.difficultyLevel || 3;
        const baseScore = gridMultiplier[gridSize] || 1000;
        const diffMultiplier = difficultyMultiplier[diffLevel] || 2.0;
        const hintPenalty = Math.pow(0.9, score.hintsUsed || 0);
        
        return Math.max(10, Math.round(baseScore * diffMultiplier * hintPenalty));
    }

    hideScoresModal() {
        this.scoresModal.style.display = 'none';
    }

    showWinModal(score) {
        const hintsText = score.hintsUsed > 0 ? `<p><strong>Hints used:</strong> ${score.hintsUsed}</p>` : '';
        const gridSize = score.gridSize || 9;
        this.winStatsElement.innerHTML = `
            <p><strong>Score:</strong> <span style="font-size: 24px; color: #667eea; font-weight: bold;">${score.score}</span> points</p>
            <p><strong>Grid Size:</strong> ${gridSize}×${gridSize}</p>
            <p><strong>Difficulty:</strong> ${score.difficulty}</p>
            <p><strong>Time:</strong> ${score.time}</p>
            ${hintsText}
        `;
        this.winModal.style.display = 'block';
    }

    hideWinModal() {
        this.winModal.style.display = 'none';
    }
    
    showSettingsModal() {
        // Update UI to reflect current settings
        this.liveCheckingCheckbox.checked = this.settings.liveChecking;
        
        const bgColorRadio = document.querySelector(`input[name="bg-color"][value="${this.settings.backgroundColor}"]`);
        if (bgColorRadio) {
            bgColorRadio.checked = true;
        }
        
        this.settingsModal.style.display = 'block';
    }
    
    hideSettingsModal() {
        this.settingsModal.style.display = 'none';
    }
    
    saveSettings() {
        // Get live checking setting
        this.settings.liveChecking = this.liveCheckingCheckbox.checked;
        
        // Get background color setting
        const selectedBgColor = document.querySelector('input[name="bg-color"]:checked');
        if (selectedBgColor) {
            this.settings.backgroundColor = selectedBgColor.value;
        }
        
        // Apply background color
        this.applyBackgroundColor();
        
        // Save to localStorage
        localStorage.setItem('sudokuSettings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('sudokuSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Apply loaded settings
        this.applyBackgroundColor();
    }
    
    applyBackgroundColor() {
        // Remove all background classes
        document.body.classList.remove('bg-white', 'bg-dark', 'bg-blue', 'bg-green');
        
        // Apply selected background
        if (this.settings.backgroundColor !== 'gradient') {
            document.body.classList.add(`bg-${this.settings.backgroundColor}`);
        }
    }
    
    saveGameState() {
        if (!this.currentPuzzle || !this.currentSolution) {
            console.log('Cannot save game state: missing puzzle or solution');
            return;
        }
        
        const gameState = {
            currentPuzzle: this.currentPuzzle,
            currentSolution: this.currentSolution,
            currentGrid: this.currentGrid,
            givenCells: Array.from(this.givenCells),
            difficulty: this.difficulty,
            gridSize: this.gridSize,
            hintsUsed: this.hintsUsed,
            startTime: this.startTime,
            elapsedTime: this.startTime ? Date.now() - this.startTime : 0,
            timestamp: Date.now()
        };
        
        localStorage.setItem('sudokuGameState', JSON.stringify(gameState));
        console.log('Game state saved');
    }
    
    loadGameState() {
        try {
            const savedState = localStorage.getItem('sudokuGameState');
            if (!savedState) {
                console.log('No saved game state found');
                return false;
            }
            
            const gameState = JSON.parse(savedState);
            console.log('Found saved game state:', gameState);
            
            // Validate that we have the required data
            if (!gameState.currentPuzzle || !gameState.currentSolution || !gameState.currentGrid) {
                console.log('Invalid game state data');
                this.clearGameState();
                return false;
            }
            
            // Restore game state
            this.currentPuzzle = gameState.currentPuzzle;
            this.currentSolution = gameState.currentSolution;
            this.currentGrid = gameState.currentGrid;
            this.givenCells = new Set(gameState.givenCells || []);
            this.difficulty = gameState.difficulty || 3;
            this.gridSize = gameState.gridSize || 9;
            this.hintsUsed = gameState.hintsUsed || 0;
            
            // Restore timer - calculate new start time based on elapsed time
            if (gameState.elapsedTime >= 0) {
                // Set start time so that elapsed time matches what was saved
                this.startTime = Date.now() - gameState.elapsedTime;
                console.log(`Timer restored: ${Math.floor(gameState.elapsedTime / 1000)} seconds elapsed`);
                console.log(`Set startTime to: ${new Date(this.startTime).toLocaleTimeString()}`);
                console.log(`Current time: ${new Date().toLocaleTimeString()}`);
                this.startTimer();
            } else {
                // Fallback: start fresh timer
                console.log('No elapsed time found, starting fresh timer');
                this.startTime = Date.now();
                this.startTimer();
            }
            
            // Create the grid with restored state
            this.createGrid();
            this.updateDifficultyDisplay();
            
            // Update timer display immediately
            this.updateTimer();
            
            // Show a brief notification that game was restored
            this.showGameRestoredNotification();
            
            console.log(`Successfully restored game: ${this.gridSize}x${this.gridSize} ${this.getDifficultyName(this.difficulty)}`);
            return true;
            
        } catch (error) {
            console.error('Error loading game state:', error);
            this.clearGameState();
            return false;
        }
    }
    
    clearGameState() {
        localStorage.removeItem('sudokuGameState');
    }
    
    showGameRestoredNotification() {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'game-restored-notification';
        notification.textContent = 'Game restored!';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    updateTimer() {
        const elapsed = this.getElapsedTime();
        this.timerElement.textContent = elapsed;
        
        // Save game state periodically (every 10 seconds) to update elapsed time
        const currentElapsed = Date.now() - this.startTime;
        if (this.startTime && Math.floor(currentElapsed / 10000) !== Math.floor((currentElapsed - 1000) / 10000)) {
            this.saveGameState();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});