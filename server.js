const express = require('express');
const WebSocket = require('ws');
const WebSocketServer =  WebSocket.Server

const server = express().listen(9090);
console.log("Server listening on port 9090")
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {

  ws.on('message', (msg) => {
    console.log("[Clinet] %s", msg );
  });

  ws.on('close', () => {
    console.log("[Server] Client disconnected" );
  });

  ws.send("[Server] Connection successfuly established");
  
});