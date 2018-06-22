'use strict';

import SimplePhysicsEngine from 'lance/physics/SimplePhysicsEngine';
import GameEngine from 'lance/GameEngine';
import Ship from './Ship';
import Missile from './Missile';
import TwoVector from 'lance/serialize/TwoVector';

// http://www.euclideanspace.com/physics/dynamics/collision/twod/index.htm#code
const collisionResponse = (e, ma, mb, Ia, Ib, ra, rb, n,
     vai, vbi, wai, wbi, vaf, vbf, waf, wbf) => {

  const k=1/(ma*ma)+ 2/(ma*mb) +1/(mb*mb) - ra.x*ra.x/(ma*Ia) - rb.x*rb.x/(ma*Ib) - ra.y*ra.y/(ma*Ia)
    - ra.y*ra.y/(mb*Ia) - ra.x*ra.x/(mb*Ia) - rb.x*rb.x/(mb*Ib) - rb.y*rb.y/(ma*Ib)
    - rb.y*rb.y/(mb*Ib) + ra.y*ra.y*rb.x*rb.x/(Ia*Ib) + ra.x*ra.x*rb.y*rb.y/(Ia*Ib) - 2*ra.x*ra.y*rb.x*rb.y/(Ia*Ib);

  const Jx = (e+1)/k * (vai.x - vbi.x) * ( 1/ma - ra.x*ra.x/Ia + 1/mb - rb.x*rb.x/Ib)
     - (e+1)/k * (vai.y - vbi.y) * (ra.x*ra.y / Ia + rb.x*rb.y / Ib);

  const Jy = -1 * (e+1)/k * (vai.x - vbi.x) * (ra.x*ra.y / Ia + rb.x*rb.y / Ib)
     + (e+1)/k * (vai.y - vbi.y) * ( 1/ma - ra.y*ra.y/Ia + 1/mb - rb.y*rb.y/Ib);
  vaf.x = vai.x - Jx/Ma;
  vaf.y = vai.y - Jy/Ma;
  vbf.x = vbi.x - Jx/Mb;
  vbf.y = vbi.y - Jy/Mb;
  waf.x = wai.x - (Jx*ra.y - Jy*ra.x) /Ia;
  waf.y = wai.y - (Jx*ra.y - Jy*ra.x) /Ia;
  wbf.x = wbi.x - (Jx*rb.y - Jy*rb.x) /Ib;
  wbf.y = wbi.y - (Jx*rb.y - Jy*rb.x) /Ib;
};

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
                    a.r=50; b.r=50;
                    a.mass = 1; b.mass = 1;

                    const distance = Math.hypot(a.x-b.x, a.y-b.y);
                    const width = (a.r + b.r);

                    // Check a circle collision actually happened
                    if (distance > width) { continue; }
                    console.log('boing');

                    const collisionX = ((a.x * b.r) + (b.x * a.r)) / (a.r + b.r);
                    const collisionY = ((a.y * b.r) + (b.y * a.r)) / (a.r + b.r);


                    // @param double e coefficient of restitution which depends on the nature of the two colliding materials
                    const e = 0.5;
                    // @param double ma total mass of body a
                    const ma = a.mass;
                    // @param double mb total mass of body b
                    const mb = b.mass;
                    // @param double Ia inertia for body a.
                    const Ia = 1;
                    // @param double Ib inertia for body b.
                    const Ib = 1;
                    // @param vector ra position of collision point relative to centre of mass of body a in absolute coordinates (if this is
                    //                  known in local body coordinates it must be converted before this is called).
                    const ra = { x: collisionX - a.x, y: collisionY - a.y };
                    // @param vector rb position of collision point relative to centre of mass of body b in absolute coordinates (if this is
                    //                  known in local body coordinates it must be converted before this is called).
                    const rb = { x: collisionX - b.x, y: collisionY - b.y };
                    // @param vector n normal to collision point, the line along which the impulse acts.
                    const n = { x: (a.x - b.x)/distance, y: (a.y - b.y)/distance };
                    // @param vector vai initial velocity of centre of mass on object a
                    const vai = { x: a.velocity.x, y: a.velocity.y };
                    // @param vector vbi initial velocity of centre of mass on object b
                    const vbi = { x: b.velocity.x, y: b.velocity.y };
                    // @param vector wai initial angular velocity of object a
                    const wai = 0;
                    // @param vector wbi initial angular velocity of object b
                    const wbi = 0;
                    // @param vector vaf final velocity of centre of mass on object a
                    const vaf = {};
                    // @param vector vbf final velocity of centre of mass on object a
                    const vbf = {};
                    // @param vector waf final angular velocity of object a
                    const waf = {};
                    // @param vector wbf final angular velocity of object b
                    const wbf = {};

                    collisionResponse(e, ma, mb, Ia, Ib, ra, rb, n, vai, vbi, wai, wbi, vaf, vbf, waf, wbf);

                    a.velocity.x = vaf.x;
                    a.velocity.y = vaf.y;
                    b.velocity.x = vbf.x;
                    b.velocity.y = vbf.y;

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
