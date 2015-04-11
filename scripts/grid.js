function Grid(size, previousState) {
    this.size = size;
    this.cells = previousState ? this.loadState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
    // a tile is empty if its value is null
    var cells = [];
    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];

        for (var y = 0; y < this.size; y++) {
            row.push(null);
        }
    }
    return cells;
};

// Build a grid from a specified state
Grid.prototype.loadState = function(state){
    var cells = [];
    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];
        for (var y = 0; y < this.size; y++) {
            var tile = state[x][y];
            row.push(tile ? new Tile(tile.position, tile.value) : null);
        }
    }
    return cells;
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
    return !!this.availableCells().length; // The operator !! = If it was falsey (e.g. 0, null, undefined, etc.), it will be false, otherwise, true
};

// Return list of available cells
Grid.prototype.availableCells = function () {
    var cells = [];
    this.eachCell(function (x, y, tile) {
        if (!tile) {
            cells.push({ x: x, y: y });
        }
    });
    return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            callback(x, y, this.cells[x][y]);
        }
    }
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
    var cells = this.availableCells();

    if (cells.length) {
        var res = cells[Math.floor(Math.random() * cells.length)];
        console.log("randomAvailableCell");
        console.log(res);
        return res;
    }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.printGrid = function(){
    for (var y = 0; y < this.size; y++) {
        var col = [];
        for (var x = 0; x < this.size; x++) {
            var thisCell = this.cells[x][y];
            if (thisCell) col.push(thisCell.value);
            else col.push(0);
        }
        console.log(col);
    }
};

Grid.prototype.cellOccupied = function (cell) {
    return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
    if (this.withinBounds(cell)) { // Check if the cell is within the size * size square
        return this.cells[cell.x][cell.y];
    } else {
        return null;
    }
};

// check if a position is with in the grid's boundary
Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size &&
        position.y >= 0 && position.y < this.size;
};

Grid.prototype.removeTile = function (tile) {
    this.cells[tile.x][tile.y] = null;
};

Grid.prototype.serialize = function () {
    var cellState = [];
    for (var x = 0; x < this.size; x++) {
        var row = cellState[x] = [];
        for (var y = 0; y < this.size; y++) {
            row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
        }
    }
    return {
        size: this.size,
        cells: cellState
    };
};