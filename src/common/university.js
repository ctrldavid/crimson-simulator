import Serializer from 'lance/serialize/Serializer';
import DynamicObject from 'lance/serialize/DynamicObject';
import PixiRenderableComponent from 'lance/render/pixi/PixiRenderableComponent';
import Renderer from '../client/SpaaaceRenderer';

export default class University extends DynamicObject {

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
    }


    static get netScheme() {
        return Object.assign({
            // inputId: { type: Serializer.TYPES.INT32 }
        }, super.netScheme);
    }

    onAddToWorld(gameEngine) {
        let renderer = Renderer.getInstance();
        if (renderer) {
            let sprite = new PIXI.Sprite(PIXI.loader.resources.university.texture);
            renderer.sprites[this.id] = sprite;
            sprite.width = 120 * 0.5;
            sprite.height = 120 * 0.5;
            sprite.anchor.set(0.5, 0.5);
            sprite.position.set(this.position.x, this.position.y);
            renderer.layer2.addChild(sprite);
        }
    }

    onRemoveFromWorld(gameEngine) {
        let renderer = Renderer.getInstance();
        if (renderer && renderer.sprites[this.id]) {
            renderer.sprites[this.id].destroy();
            delete renderer.sprites[this.id];
        }
    }

    syncTo(other) {
        super.syncTo(other);
        this.inputId = other.inputId;
    }
}
