function Tile(position, value) {
    this.x                = position.x;
    this.y                = position.y;
    this.value            = value || 2;
    this.previousPosition = null;
    this.mergedFrom       = null; // Tracks tiles that merged together
}

// Save the current position as the tile's previous state
Tile.prototype.saveCurrentPosition = function () {
    this.previousPosition = { x: this.x, y: this.y };
};

// Update the current tile position following the input position
Tile.prototype.updatePosition = function (position) {
    this.x = position.x;
    this.y = position.y;
};

// Return the tile's coordinate and value
Tile.prototype.serialize = function () {
    return {
        position: {
            x: this.x,
            y: this.y
        },
        value: this.value
    };
};
