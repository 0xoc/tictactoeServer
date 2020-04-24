const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:9090');

ws.on('open', function open() {
  ws.send('Heloooooo');
});

ws.on('message', function incoming(data) {
  console.log(data);
});