// Constructor
function KeyboardInputManager() {
    this.events = {}; // This is an object contains properties, each of them is an array of callbacks
    this.listen();
}

// Bind an event with a specific callback
KeyboardInputManager.prototype.on = function(event, callback){
    if(!this.events[event]){
        this.events[event] = [];
    }
    this.events[event].push(callback);
};

// Emit the callbacks of a specific event
KeyboardInputManager.prototype.emit = function (event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
};

KeyboardInputManager.prototype.listen = function(){
    var self = this;
    var map = {
        38: 0, // Up
        39: 1, // Right
        40: 2, // Down
        37: 3 // Left
        //TODO Handle other keycodes
    };
    document.addEventListener("keydown", function (event) {
        var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
            event.shiftKey;

        var mapped    = map[event.which];

        if (!modifiers) {
            if (mapped !== undefined) {
                event.preventDefault();
                self.emit("move", mapped);
            }
        }
    });

    this.bindButtonPress("#auto-solve-using-DFS", this.autoSolveUsingDFS);
    this.bindButtonPress("#auto-solve-using-BFS", this.autoSolveUsingBFS);
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
    var button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
};

KeyboardInputManager.prototype.autoSolveUsingDFS = function (event) {
    event.preventDefault();
    this.emit("autoSolveUsingDFS");
};

KeyboardInputManager.prototype.autoSolveUsingBFS = function (event) {
    event.preventDefault();
    this.emit("autoSolveUsingBFS");
};