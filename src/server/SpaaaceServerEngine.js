'use strict';

import ServerEngine from 'lance/ServerEngine';
const nameGenerator = require('./NameGenerator');
const NUM_BOTS = 0;
const NUM_STUDENTS = 10;
const NUM_UNIVERSITIES = 3;

export default class SpaaaceServerEngine extends ServerEngine {
    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);
        this.scoreData = {};
    }

    start() {
        super.start();

        for (let x = 0; x < NUM_BOTS; x++) this.makeBot();
        for (let x = 0; x < NUM_STUDENTS; x++) this.gameEngine.makeStudent();
        for (let x = 0; x < NUM_UNIVERSITIES; x++) this.gameEngine.makeUniversity();

        this.gameEngine.on('shipdied', (e) => {
            // this.gameEngine.removeObjectFromWorld(e.ship.id);
            // this.gameEngine.makeShip(e.ship.playerId);
            if (this.scoreData[e.ship.id]) {
                this.scoreData[e.ship.id].kills -= this.scoreData[e.ship.id].students;
                this.scoreData[e.ship.id].students = 0;
                this.updateScore();
            }
            this.gameEngine.spawnShip(e.ship.playerId);
        });


        this.gameEngine.on('studentPickup', (e) => {
            // this.gameEngine.removeObjectFromWorld(e.ship.id);
            // this.gameEngine.makeShip(e.ship.playerId);
            if (this.scoreData[e.ship.id]) {
                this.scoreData[e.ship.id].students++;
                this.updateScore();
            }
            this.gameEngine.destroyStudent(e.student.id);
            this.gameEngine.makeStudent();
            // this.gameEngine.spawnShip(e.ship.playerId);
        });

        this.gameEngine.on('studentDropoff', (e) => {
            if (this.scoreData[e.ship.id]) {
                this.scoreData[e.ship.id].kills += this.scoreData[e.ship.id].students;
                this.scoreData[e.ship.id].students = 0;
                this.updateScore();
            }
        });

        this.gameEngine.on('missileHit', e => {
            // add kills
            if (this.scoreData[e.missile.ownerId]) this.scoreData[e.missile.ownerId].kills++;
            // remove score data for killed ship
            delete this.scoreData[e.ship.id];
            this.updateScore();

            console.log(`ship killed: ${e.ship.toString()}`);
            this.gameEngine.removeObjectFromWorld(e.ship.id);
            if (e.ship.isBot) {
                setTimeout(() => this.makeBot(), 5000);
            }
        });
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerShip = () => {
            let ship = this.gameEngine.makeShip(socket.playerId);

            this.scoreData[ship.id] = {
                kills: 0,
                students: 0,
                name: nameGenerator('general')
            };
            this.updateScore();
        };

        // handle client restart requests
        socket.on('requestRestart', makePlayerShip);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);


        // iterate through all objects, delete those that are associated with the player (ship and missiles)
        let playerObjects = this.gameEngine.world.queryObjects({ playerId: playerId});
        playerObjects.forEach( obj => {
            this.gameEngine.removeObjectFromWorld(obj.id);
            // remove score associated with this ship
            delete this.scoreData[obj.id];
        });

        this.updateScore();
    }

    makeBot() {
        let bot = this.gameEngine.makeShip(0);
        bot.attachAI();

        this.scoreData[bot.id] = {
            kills: 0,
            name: nameGenerator('general') + 'Bot'
        };

        this.updateScore();
    }

    updateScore() {
        // delay so player socket can catch up
        setTimeout(() => {
            this.io.sockets.emit('scoreUpdate', this.scoreData);
        }, 1000);

    }
}
