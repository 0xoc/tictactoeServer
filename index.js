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
  try {
  ws.on('message', (msg) => {
    try {
      // get game data in json
      let game_data = JSON.parse(msg);

      // a post type is used to create a new game
      if (game_data.type == "POST"){

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

      } else if (game_data.type == "PUT") {
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

        var players = gameObj.players.filter((item) => {
          return !(item == ws);
        })

        for (var i = 0; i < players.length; i++){
          players[i].send(JSON.stringify({
            'status': 300,
            'gameId': gameId,
            'move': move
          }));
        }

      } 
      // to join a game that has allready been created
      else if (game_data.type == "JOIN"){
        // get the game id
        let gameId = game_data.gameId;
        let gameObj = null;
        
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
          return;
        }
        
        // add the requesting web socket as one of the players
        gameObj.addPlayer(ws);

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
      
      // and invalid request type has been submitted
      } else {
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
    try {
      // remove the ws from game players
      var gameObj = games.find((item) => {
        return item.hasPlayer(ws);
      });

      if (gameObj == null)
        return

      gameObj.removePlayer(ws);

      // if the game has no players left, delete it
      if (gameObj.players.length == 0)
        games.splice(games.indexOf(gameObj, 1))
  
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

});