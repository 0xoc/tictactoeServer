const express = require('express');
const WebSocket = require('ws');
const WebSocketServer =  WebSocket.Server
const game = require('./game')

let server = express().listen(9090);
let wss = new WebSocketServer({ server });
let games = Array();

console.log("[Server] Listening on 9090");

function reportError(ws, msg){
  ws.send(JSON.stringify({
    'status': 400,
    'details': msg
  }))
}


wss.on('connection', (ws) => {
    console.log("[Server] Accepting new connection");

    try {
    ws.on('message', (msg) => {
        console.log("[Server] Processing new message");
        console.log("[Server] active games " + games.length);
        try {
        // get game data in json
        let game_data = JSON.parse(msg);

        // a post type is used to create a new game
        if (game_data.type == "POST"){
            // only one active game at the same time
            var gameObjs = games.filter((item) => {
                return item.hasPlayer(ws);
            });

            gameObjs.forEach(element => {
                games.splice(games.indexOf(element),1);
            });

            console.log("[Server] Creating new game");

            // create a game object
            var gameObj = new game.Game(game_data.size, game_data.winBy, game_data.starter);
            
            // add the current ws socket as one of the players
            gameObj.addPlayer(ws);

            // save the newly created game object
            games.push(gameObj);

            // notify the creator with the auto generated gameId
            ws.send(JSON.stringify({
            'status': 201,
            'gameId': gameObj.gameId
            }))
            console.log("[Server] New game created with id " + gameObj.gameId);
        
        } else if (game_data.type == "PUT") {
            console.log("[Server] Making new move");

            // boardcast a move played in a game to all player exclude self
            let move = game_data.move; // (i, j)
            let gameId = game_data.gameId;

            var gameObj = games.find((item)=>{
            return item.gameId == gameId;
            });

            if (gameObj == null){
            ws.send(JSON.stringify({
                'status': 404,
                'details': "Invalid game id"
            }));
            return;
            }
            
            gameObj.players.forEach(player => {
                if (player != ws) {
                    if (game_data.rmode == 'move') {
                        player.send(JSON.stringify({
                            'status': 300,
                            'gameId': gameId,
                            'move': move
                        }));
                    } else if (game_data.rmode == 'reset') {
                        player.send(JSON.stringify({
                            'status': 600,
                            'gameId': gameId,
                        }));
                    }
                }
            });

            console.log("[Server] Move broadcasted " + move);

        } else if (game_data.type == "DELETE") {
            // delete a game, and notify players
            console.log("[Server] Deleting game " + game_data.gameId);

            gameObj = games.find((item)=>{
                return item.gameId == game_data.gameId;
            });

            
            if (gameObj == null){
                ws.send(JSON.stringify({
                    'status': 404,
                    'details': "Invalid game id"
                }));
                console.log("[Server | Error] Invalid Game ID "  + game_data.gameId );

                return;
            }

            gameObj.players.forEach(player => {
                if (ws != player) {
                    player.send(JSON.stringify({
                        'status': '204' // game deleted
                    }));
                }
                
            });

            // delete the game
            games.splice(games.indexOf(gameObj, 1))

            console.log("[Server] Game deleted " + game_data.gameId)
        }
        // to join a game that has allready been created
        else if (game_data.type == "JOIN"){
            console.log("[Server] Joining to game "  + game_data.gameId );

            // get the game id
            let gameId = game_data.gameId;
            let gameObj = null;
            let rmode = game_data.rmode;

            
            // search for a with the given gameId
            gameObj = games.find((item)=>{
                return item.gameId == gameId;
            });

            // if gameObj is null, then the given gameId is invalid
            if (gameObj == null){
            ws.send(JSON.stringify({
                'status': 404,
                'details': "Invalid game id"
            }));
            console.log("[Server | Error] Invalid Game ID "  + game_data.gameId );

            return;
            }

            // notify with game information
            ws.send(JSON.stringify({
            'status': 200,
            'game': {
                'size': gameObj.size,
                'winBy': gameObj.winBy,
                'starter': gameObj.starter,
                'gameId': gameObj.gameId
            }
            }))
            
            // add the requesting web socket as one of the players
            gameObj.addPlayer(ws);

            if (rmode != "partial"){

                // nitify other players
                gameObj.players.forEach(player => {
                    if (player != ws) {
                        player.send(JSON.stringify({
                            'status': 301 // meaning opponent joind
                        }));
                    }
                });
            }
            
            console.log("[Server] Joined to game "  + game_data.gameId );

        // and invalid request type has been submitted
        } else {
            console.log("[Server | User Error] Invalid request type "  + game_data.type );

            ws.send(JSON.stringify({
            'status': 400,
            'details': "Bad request"
            }));
        }
        } catch (err) {
        console.log("[Server | Error] " + err.message );
        console.log("[Server | Error] " + err.stack);
        reportError(ws, err.message);
        }
    });

    ws.on('close', () => {
        console.log("[Server] Closing connection ");

        try {
        // remove the ws from game players
        var gameObjs = games.filter((item) => {
            return item.hasPlayer(ws);
        });

        for (var i  = 0; i < gameObjs.length;i++){
            var gameObj = gameObjs[i];

            gameObj.removePlayer(ws);

            // if the game has no players left, delete it
            if (gameObj.players.length == 0){
                games.splice(games.indexOf(gameObj, 1))
                console.log("[Server] Game deleted " + gameObj.gameId);
            }
            console.log("[Server] Connection closed");
        }
        
    } catch (err) {
        console.log("[Server | Error] " + err.message );
        console.log("[Server | Error] " + err.stack);
        reportError(ws, err.message);

        }

    });
    } catch (err) {
        console.log("[Server | Error] " + err.message );
        console.log("[Server | Error] " + err.stack);  
        reportError(ws, err.message);
    }

    console.log("[Server] Connection Established ");

});