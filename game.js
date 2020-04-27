const shortid = require('shortid');

class Game {
    constructor(size, winBy, starter ){
        this.size = size;
        this.winBy = winBy;
        this.starter = starter;
        this.gameId = shortid.generate();
        this.players = Array()
    }

    addPlayer(wsPlayer) {
        if (!this.hasPlayer(wsPlayer))
            this.players.push(wsPlayer)
    }

    removePlayer(wsPlayer) {
        var index = this.players.indexOf(wsPlayer);
        
        if (index > -1){
            this.players.splice(index, 1)
        }
    }

    hasPlayer(wsPlayer) {
        var index = this.players.indexOf(wsPlayer);
        return index > -1;
    }
};


module.exports = {
    Game
}