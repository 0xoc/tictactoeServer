const shortid = require('shortid');

class Game {
    constructor(size, winBy, starter ){
        this.size = size;
        this.winBy = winBy;
        this.starter = starter;
        this.gameId = shortid.generate()

        // todo add it to the data base
    }
};
