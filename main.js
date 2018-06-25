'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

// canvas stuff
const { createCanvas, loadImage } = require('canvas');
const canvas = createCanvas(5001, 3334);
const ctx = canvas.getContext('2d');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, './index.html');

// define routes and socket
const server = express();
server.get('/', function(req, res) { res.sendFile(INDEX); });
server.use('/', express.static(path.join(__dirname, '.')));
let requestHandler = server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(requestHandler);

// Game Server
import MyServerEngine from './src/server/SpaaaceServerEngine.js';
import MyGameEngine from './src/common/SpaaaceGameEngine.js';


loadImage('assets/k-map-mask.png').then((image) => {
  ctx.drawImage(image, 0, 0, 5001, 3334);

  // console.log('<img src="' + canvas.toDataURL() + '" />');

  // Game Instances
  const gameEngine = new MyGameEngine({ ctx: ctx });
  const serverEngine = new MyServerEngine(io, gameEngine, {
      debug: {},
      updateRate: 1,
      stepRate: 60,
      timeoutInterval: 0 // 0 = no timeout
  });

  // start the game
  serverEngine.start();
});
