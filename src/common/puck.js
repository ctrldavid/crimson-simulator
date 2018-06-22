import Serializer from 'lance/serialize/Serializer';
import DynamicObject from 'lance/serialize/DynamicObject';
import Renderer from '../client/SpaaaceRenderer';
import Utils from './Utils';
import ShipActor from '../client/ShipActor';

export default class Puck extends DynamicObject {

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
    }

    get maxSpeed() { return 3.0; }

    onAddToWorld(gameEngine) {
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
                        delete renderer.sprites[this.id];
                    });
                } else {
                    sprite.destroy();
                    delete renderer.sprites[this.id];
                }
            }
        }
    }

    // ship rotation is input-deterministic, no bending needed
    get bendingAngleLocalMultiple() { return 0.0; }

    static get netScheme() {
        return Object.assign({
            showThrust: { type: Serializer.TYPES.INT32 }
        }, super.netScheme);
    }

    toString() {
        return `Player::Ship::${super.toString()}`;
    }

    syncTo(other) {
        super.syncTo(other);
        // this.showThrust = other.showThrust;
    }


    destroy() {
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
}
