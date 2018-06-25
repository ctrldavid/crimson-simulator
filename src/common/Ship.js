import Serializer from 'lance/serialize/Serializer';
import DynamicObject from 'lance/serialize/DynamicObject';
import Renderer from '../client/SpaaaceRenderer';
import Utils from './Utils';
import ShipActor from '../client/ShipActor';

export default class Ship extends DynamicObject {

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.showThrust = 0;
        this.width = 100;
        this.height = 100;
    }

    get maxSpeed() { return 10.0; }
    get bendingMultiple() { return 0.8; }
    get bendingVelocityMultiple() { return 1.0; }
    // ship rotation is input-deterministic, no bending needed
    get bendingAngleLocalMultiple() { return 0.0; }

    onAddToWorld(gameEngine) {
        console.log('ON ADD TO WORLD');
        let renderer = Renderer.getInstance();
        if (renderer) {
            let shipActor = new ShipActor(renderer);
            let sprite = shipActor.sprite;
            renderer.sprites[this.id] = sprite;
            sprite.id = this.id;
            sprite.position.set(this.position.x, this.position.y);
            renderer.layer2.addChild(sprite);

            if (gameEngine.isOwnedByPlayer(this)) {
                renderer.addPlayerShip(sprite);
            } else {
                renderer.addOffscreenIndicator(this);
            }
        }
    }

    onRemoveFromWorld(gameEngine) {

        if (this.fireLoop) {
            this.fireLoop.destroy();
        }

        if (this.onPreStep){
            this.gameEngine.removeListener('preStep', this.onPreStep);
            this.onPreStep = null;
        }

        let renderer = Renderer.getInstance();
        if (renderer) {
            if (gameEngine.isOwnedByPlayer(this)) {
                renderer.playerShip = null;
            } else {
                renderer.removeOffscreenIndicator(this);
            }
            let sprite = renderer.sprites[this.id];
            if (sprite) {
                if (sprite.actor) {
                    // removal "takes time"
                    sprite.actor.destroy().then(()=>{
                        console.log('deleted sprite');
                        delete renderer.sprites[this.id];
                    });
                } else {
                    sprite.destroy();
                    delete renderer.sprites[this.id];
                }
            }
        }
    }

    static get netScheme() {
        return Object.assign({
            showThrust: { type: Serializer.TYPES.INT32 }
        }, super.netScheme);
    }

    toString() {
        return `${this.isBot?'Bot':'Player'}::Ship::${super.toString()}`;
    }

    syncTo(other) {
        super.syncTo(other);
        this.showThrust = other.showThrust;
    }


    destroy() {
    }

    attachAI() {
        this.isBot = true;

        this.onPreStep = () => {
            this.steer();
        };

        this.gameEngine.on('preStep', this.onPreStep);

        let fireLoopTime = Math.round(250 + Math.random() * 100);
        this.fireLoop = this.gameEngine.timer.loop(fireLoopTime, () => {
            if (this.target && this.distanceToTargetSquared(this.target) < 160000) {
                this.gameEngine.makeMissile(this);
            }
        });
    }

    shortestVector(p1, p2, wrapDist) {
        let d = Math.abs(p2 - p1);
        if (d > Math.abs(p2 + wrapDist - p1)) p2 += wrapDist;
        else if (d > Math.abs(p1 + wrapDist - p2)) p1 += wrapDist;
        return p2 - p1;
    }

    distanceToTargetSquared(target) {
        let dx = this.shortestVector(this.position.x, target.position.x, this.gameEngine.worldSettings.width);
        let dy = this.shortestVector(this.position.y, target.position.y, this.gameEngine.worldSettings.height);
        return dx * dx + dy * dy;
    }

    steer() {
        // return;
        let closestTarget = null;
        let closestDistance2 = Infinity;
        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            if (obj != this) {
                let distance2 = this.distanceToTargetSquared(obj);
                if (distance2 < closestDistance2) {
                    closestTarget = obj;
                    closestDistance2 = distance2;
                }
            }
        }

        this.target = closestTarget;

        if (this.target) {

            let newVX = this.shortestVector(this.position.x, this.target.position.x, this.gameEngine.worldSettings.width);
            let newVY = this.shortestVector(this.position.y, this.target.position.y, this.gameEngine.worldSettings.height);
            let angleToTarget = Math.atan2(newVX, newVY)/Math.PI* 180;
            angleToTarget *= -1;
            angleToTarget += 90; // game uses zero angle on the right, clockwise
            if (angleToTarget < 0) angleToTarget += 360;
            let turnRight = this.shortestVector(this.angle, angleToTarget, 360);

            if (turnRight > 4) {
                this.isRotatingRight = true;
            } else if (turnRight < -4) {
                this.isRotatingLeft = true;
            } else {
                this.isAccelerating = true;
                this.showThrust = 5;
            }

        }
    }
}
