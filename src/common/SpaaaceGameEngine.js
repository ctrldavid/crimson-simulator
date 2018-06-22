'use strict';

import SimplePhysicsEngine from 'lance/physics/SimplePhysicsEngine';
import GameEngine from 'lance/GameEngine';
import Ship from './Ship';
import Missile from './Missile';
import TwoVector from 'lance/serialize/TwoVector';


export default class SpaaaceGameEngine extends GameEngine {

    constructor(options) {
        super(options);
        this.physicsEngine = new SimplePhysicsEngine({
            gameEngine: this,
            collisions: {
                type: 'brute'
            }
        });
    }

    registerClasses(serializer) {
        serializer.registerClass(Ship);
        serializer.registerClass(Missile);
    }

    initWorld() {
        super.initWorld({
            worldWrap: true,
            width: 3000,
            height: 3000
        });
    }

    start() {
        super.start();

        this.on('collisionStart', e => {
            let collisionObjects = Object.keys(e).map(k => e[k]);
            let ships = collisionObjects.filter(o => o instanceof Ship);
            // let missile = collisionObjects.find(o => o instanceof Missile);


            // if (!ship || !missile)
            //     return;

            // make sure not to process the collision between a missile and the ship that fired it
            // if (missile.playerId !== ship.playerId) {
            //     this.destroyMissile(missile.id);
            //     this.trace.info(() => `missile by ship=${missile.playerId} hit ship=${ship.id}`);
            //     this.emit('missileHit', { missile, ship });
            // }
        });

        this.on('preStep', () => {
            let ships = this.world.queryObjects({
                instanceType: Ship
            });
            for (let i = 0; i < ships.length - 1; i++) {
                for (let j = i + 1; j < ships.length; j++) {
                    const a = ships[i];
                    const b = ships[j];
                    a.r=30; b.r=30;
                    a.mass = 1; b.mass = 1;

                    const distance = Math.hypot(a.x-b.x, a.y-b.y);
                    const width = (a.r + b.r);

                    // Check a circle collision actually happened
                    if (distance > width) { continue; }
                    // console.log('boing');

                    const collisionX = ((a.x * b.r) + (b.x * a.r)) / (a.r + b.r);
                    const collisionY = ((a.y * b.r) + (b.y * a.r)) / (a.r + b.r);

                    // https://en.wikipedia.org/wiki/Elastic_collision
                    const va = [a.velocity.x, a.velocity.y];
                    const vb = [b.velocity.x, b.velocity.y];

                    const xa = [a.position.x, a.position.y];
                    const xb = [b.position.x, b.position.y];

                    const vdiff = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
                    const vdot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];
                    const vnorm2 = (v1) => vdot(v1, v1);

                    const propA = 2 * b.mass / (a.mass + b.mass) * vdot(vdiff(va, vb), vdiff(xa, xb)) / vnorm2(vdiff(xa, xb));
                    const propB = 2 * a.mass / (a.mass + b.mass) * vdot(vdiff(vb, va), vdiff(xb, xa)) / vnorm2(vdiff(xb, xa));

                    a.velocity.x -= propA * vdiff(xa, xb)[0];
                    a.velocity.y -= propA * vdiff(xa, xb)[1];
                    b.velocity.x -= propB * vdiff(xb, xa)[0];
                    b.velocity.y -= propB * vdiff(xb, xa)[1];

                    a.position.x += a.velocity.x;
                    a.position.y += a.velocity.y;
                    b.position.x += b.velocity.x;
                    b.position.y += b.velocity.y;
                    // console.log(propA, propB, vdiff(xa, xb).x);
                }
            }
            for (let k = 0; k < ships.length - 1; k++) {
                ships[k].velocity.x *= 0.98;
                ships[k].velocity.y *= 0.98;
            }
        });
        this.on('postStep', this.reduceVisibleThrust.bind(this));
    };

    processInput(inputData, playerId, isServer) {

        super.processInput(inputData, playerId);

        // get the player ship tied to the player socket
        let playerShip = this.world.queryObject({
            playerId: playerId,
            instanceType: Ship
        });

        if (playerShip) {
            if (inputData.input == 'up') {
                playerShip.isAccelerating = true;
                playerShip.showThrust = 5; // show thrust for next steps.
            } else if (inputData.input == 'right') {
                playerShip.isRotatingRight = true;
            } else if (inputData.input == 'left') {
                playerShip.isRotatingLeft = true;
            } else if (inputData.input == 'space') {
                this.makeMissile(playerShip, inputData.messageIndex);
                this.emit('fireMissile');
            }
        }
    };

    // Makes a new ship, places it randomly and adds it to the game world
    makeShip(playerId) {
        let newShipX = Math.floor(Math.random()*(this.worldSettings.width-200)) + 200;
        let newShipY = Math.floor(Math.random()*(this.worldSettings.height-200)) + 200;

        let ship = new Ship(this, null, {
            position: new TwoVector(newShipX, newShipY)
        });

        ship.playerId = playerId;
        this.addObjectToWorld(ship);
        console.log(`ship added: ${ship.toString()}`);

        return ship;
    };

    makeMissile(playerShip, inputId) {
        let missile = new Missile(this);

        // we want the missile location and velocity to correspond to that of the ship firing it
        missile.position.copy(playerShip.position);
        missile.velocity.copy(playerShip.velocity);
        missile.angle = playerShip.angle;
        missile.playerId = playerShip.playerId;
        missile.ownerId = playerShip.id;
        missile.inputId = inputId; // this enables usage of the missile shadow object
        missile.velocity.x += Math.cos(missile.angle * (Math.PI / 180)) * 10;
        missile.velocity.y += Math.sin(missile.angle * (Math.PI / 180)) * 10;

        this.trace.trace(() => `missile[${missile.id}] created vel=${missile.velocity}`);

        let obj = this.addObjectToWorld(missile);

        // if the object was added successfully to the game world, destroy the missile after some game ticks
        if (obj)
            this.timer.add(30, this.destroyMissile, this, [obj.id]);

        return missile;
    }

    // destroy the missile if it still exists
    destroyMissile(missileId) {
        if (this.world.objects[missileId]) {
            this.trace.trace(() => `missile[${missileId}] destroyed`);
            this.removeObjectFromWorld(missileId);
        }
    }

    // at the end of the step, reduce the thrust for all objects
    reduceVisibleThrust(postStepEv) {
        if (postStepEv.isReenact)
            return;

        let ships = this.world.queryObjects({
            instanceType: Ship
        });

        ships.forEach(ship => {
            if (Number.isInteger(ship.showThrust) && ship.showThrust >= 1)
                ship.showThrust--;
        });
    }
}
