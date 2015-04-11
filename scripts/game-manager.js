function GameManager(size, inputManager, localStorageManager){
    //TODO we dont need localStorage Manager at this time

    // Initialize
    console.log("> Initializing the game...");
    this.size = size;
    this.inputManager = inputManager;
    //this.storageManager = localStorageManager;

    // Number of default start tiles
    this.startTiles = 2;
    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("autoSolveUsingDFS", this.autoSolveUsingDFS.bind(this));
    this.inputManager.on("autoSolveUsingBFS", this.autoSolveUsingBFS.bind(this));

    // Setup the game
    console.log("> Setting up the game...");
    this.setup();
}

GameManager.prototype.setup = function(){
    //var previousState = this.storageManager.getGameState();
    // Reload the game from a previous game if present
    //if (previousState) {
    //    this.grid        = new Grid(previousState.grid.size, previousState.grid.cells); // Reload previous grid
    //    this.score       = previousState.score;
    //    this.over        = previousState.over;
    //    this.won         = previousState.won;
    //} else {
    //    this.grid        = new Grid(this.size);
    //    this.score       = 0;
    //    this.over        = false;
    //    this.won         = false;
    //
    //    // Add the initial tiles
    //    this.addStartTiles();
    //}
    this.grid = new Grid(this.size);
    this.score = 0;
    this.over = false;
    this.won = false;
    this.addStartTiles();

    this.openStack = [];
    this.closedStack = [];
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
    for (var i = 0; i < this.startTiles; i++) {
        this.addRandomTile(this.grid);
    }
    // Output the first grid state
    console.log("Initial State");
    this.grid.printGrid();
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function (grid) {
    if (grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(grid.randomAvailableCell(), value);
        grid.insertTile(tile);
    }
    else {
        console.log("error while adding random tile");
    }
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function (grid) {
    grid.eachCell(function (x, y, tile) {
        if (tile) {
            tile.mergedFrom = null; // Remove merger information
            tile.saveCurrentPosition();
        }
    });
};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
    return {
        grid:        this.grid,
        score:       this.score,
        over:        this.over,
        won:         this.won
    };
};

// Get the vector representing the chosen direction
// 0: up, 1: right, 2: down, 3: left
GameManager.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
        0: { x: 0,  y: -1 }, // Up
        1: { x: 1,  y: 0 },  // Right
        2: { x: 0,  y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };
    return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };
    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }
    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) {
        //Move Right
        traversals.x = traversals.x.reverse();
    }
    if (vector.y === 1) {
        //Move Down
        traversals.y = traversals.y.reverse();
    }
    return traversals;
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell, grid) {
    grid.cells[tile.x][tile.y] = null;
    grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// This is the most important one !
GameManager.prototype.move = function (direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;
    if (this.isGameTerminated()) {
        console.log("The game is terminated !");
        // Don't do anything if the game's over
        return;
    }
    var cell, tile;
    var vector     = this.getVector(direction); // return something like: { x: 0,  y: -1 } (up)
    var traversals = this.buildTraversals(vector);
    var moved      = false;

    // Save the current tile positions and remove (the old) merger information
    this.prepareTiles(self.grid);

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);

            if (tile) { // If the current tile has value
                var positions = self.findFarthestPosition(cell, vector, self.grid);
                var next      = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];
                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                    // The mighty 2048 tile
                    if (merged.value === 2048) self.won = true;
                } else {
                    self.moveTile(tile, positions.farthest, self.grid);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });

    if (moved) {
        this.addRandomTile(self.grid);
        if (!this.movesAvailable()) {
            this.over = true; // Game over!
        }
    }
    // Output the result
    console.log("After move " + direction);
    this.grid.printGrid();
};

GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};

GameManager.prototype.findFarthestPosition = function (cell, vector, grid) {
    var previous;
    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (grid.withinBounds(cell) && ! grid.cellOccupied(cell));
    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
    return this.over || (this.won && !this.keepPlaying);
};

GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

GameManager.prototype.getChildrenStates = function(parentState){
    var self = this;
    var childrenStates = [];
    for (var i = 0; i < 4; i++){
        // 4 different directions
        var nextStates = self.getNextStates(parentState, i);
        nextStates.forEach(function(state){
            childrenStates.push(state);
        });
    }
    return childrenStates;
};

// Basically a clone from GameManager.move
GameManager.prototype.getNextStates = function (parentState, direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;
    var nextState = {};
    Object.deepExtend(nextState, parentState);
    var cell, tile;
    var vector     = this.getVector(direction); // return something like: { x: 0,  y: -1 } (up)
    var traversals = this.buildTraversals(vector);
    var moved      = false;
    // Save the current tile positions and remove (the old) merger information
    this.prepareTiles(nextState.grid);
    // Traverse the grid in the right direction and move tiles

    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };

            tile = nextState.grid.cellContent(cell);
            if (tile) { // If the current tile has value
                var positions = self.findFarthestPosition(cell, vector, nextState.grid);
                var next      = nextState.grid.cellContent(positions.next);
                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];
                    nextState.grid.insertTile(merged);
                    nextState.grid.removeTile(tile);
                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);
                    // Update the score
                    nextState.score += merged.value;
                    // The mighty 2048 tile
                    // TODO might need to edit this !
                    if (merged.value === 2048) nextState.won = true;
                } else {
                    self.moveTile(tile, positions.farthest, nextState.grid);
                }
                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });

    var nextStates = [];
    if (moved) {
        if (nextState.grid.cellsAvailable()) {
            nextState.grid.eachCell(function(_x, _y, _tile){
                if (!_tile){
                    // insert tile 2 to an empty cell
                    var newTile2 = new Tile({x: _x, y: _y}, 2);
                    var newState2 = {};
                    Object.deepExtend(newState2, nextState);
                    newState2.grid.insertTile(newTile2);
                    nextStates.push(newState2);
                    // insert tile 4 to an empty cell
                    var newTile4 = new Tile({x: _x, y: _y}, 4);
                    var newState4 = {};
                    Object.deepExtend(newState4, nextState);
                    newState4.grid.insertTile(newTile4);
                    nextStates.push(newState4);
                }
            });
        }
        else {
            console.log("error while adding random tile");
        }
    }
    return nextStates;
};

Object.deepExtend = function(destination, source) {
    for (var property in source) {
        if (typeof source[property] === "object" &&
            source[property] !== null ) {
            destination[property] = destination[property] || {};
            arguments.callee(destination[property], source[property]);
        } else {
            destination[property] = source[property];
        }
    }
    return destination;
};

GameManager.prototype.isANewState = function(element, array){
    var res = true;
    var elementGrid = element.grid.serialize();
    var JSONelementGrid = JSON.stringify(elementGrid);
    for (var i = 0; i < array.length; i++){
        var state = array[i];
        var stateGrid = state.grid.serialize();
        if (JSON.stringify(stateGrid) == JSONelementGrid){
            res = false;
            return res;
        }
    }
    return res;
};

GameManager.prototype.autoSolveUsingDFS = function(){
    var self = this;
    var solutionFound = false;
    var initState = this.serialize();
    self.openStack.push(initState);
    var stepCount = 0;

    var t0 = performance.now();

    while(self.openStack.length > 0){
        stepCount++;
        var currentState = self.openStack.pop();
        console.log("> Step: " + stepCount);
        console.log("openStack length: " + self.openStack.length);
        console.log("closedStack length: " + self.closedStack.length);
        currentState.grid.printGrid();
        if (currentState.won === true){
            solutionFound = true;
            console.log("=== SOLUTION FOUND (DFS) ===");
            var t1 = performance.now();
            console.log("It took " + (t1 - t0) + " milliseconds.");
            return;
        }
        else {
            self.closedStack.push(currentState);
        }
        var childrenStates = this.getChildrenStates(currentState);
        childrenStates.forEach(function(state){
            if (self.isANewState(state, self.openStack) && self.isANewState(state, self.closedStack)){
                self.openStack.push(state);
            }
        });
    }

    if (!solutionFound){
        console.log("=== NO SOLUTION ===");
        var t1 = performance.now();
        console.log("It took " + (t1 - t0) + " milliseconds.");
    }
};

GameManager.prototype.autoSolveUsingBFS = function(){
    var self = this;
    var solutionFound = false;
    var initState = this.serialize();
    self.openStack.push(initState);
    var stepCount = 0;

    while(self.openStack.length > 0){
        stepCount++;
        var currentState = self.openStack.pop();
        console.log("> Step: " + stepCount);
        console.log("openStack length: " + self.openStack.length);
        console.log("closedStack length: " + self.closedStack.length);
        currentState.grid.printGrid();
        if (currentState.won === true){
            solutionFound = true;
            console.log("=== SOLUTION FOUND (BFS) ===");
            return;
        }
        else {
            self.closedStack.push(currentState);
        }
        var childrenStates = this.getChildrenStates(currentState);
        childrenStates.forEach(function(state){
            if (self.isANewState(state, self.openStack) && self.isANewState(state, self.closedStack)){
                self.openStack.push(state);
            }
        });
    }
    if (!solutionFound){
        console.log("=== NO SOLUTION ===");
    }
};