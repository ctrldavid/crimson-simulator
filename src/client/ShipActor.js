const ThrusterEmitterConfig = require('./ThrusterEmitter.json');
const ExplosionEmitterConfig = require('./ExplosionEmitter.json');

let PIXI = null;
let PixiParticles = null;

class ShipActor{

    constructor(renderer){
        PIXI = require('pixi.js');
        PixiParticles = require('pixi-particles');
        this.gameEngine = renderer.gameEngine;
        this.backLayer = renderer.layer1;
        this.sprite = new PIXI.Container();
        this.shipContainerSprite = new PIXI.Container();

        this.shipSprite = new PIXI.Sprite(PIXI.loader.resources.ship.texture);

        // keep a reference to the actor from the sprite
        this.sprite.actor = this;


        this.shipSprite.anchor.set(0.5, 0.5);
        this.shipSprite.width = 80;
        this.shipSprite.height = 80;


        this.addThrustEmitter();
        this.sprite.addChild(this.shipContainerSprite);
        this.shipContainerSprite.addChild(this.shipSprite);
    }

    renderStep(delta){
        // if (this.thrustEmitter) {
        //     this.thrustEmitter.update(delta * 0.001);

        //     this.thrustEmitter.spawnPos.x = this.sprite.x - Math.cos(-this.shipContainerSprite.rotation) * 4;
        //     this.thrustEmitter.spawnPos.y = this.sprite.y + Math.sin(-this.shipContainerSprite.rotation) * 4;

        //     this.thrustEmitter.minStartRotation = this.shipContainerSprite.rotation * 180 / Math.PI + 180 - 1;
        //     this.thrustEmitter.maxStartRotation = this.shipContainerSprite.rotation * 180 / Math.PI + 180 + 1;
        // }
        // if (this.explosionEmitter){
        //     this.explosionEmitter.update(delta * 0.001);
        // }

    }

    addThrustEmitter(){
        this.thrustEmitter = new PIXI.particles.Emitter(
            this.backLayer,
            [PIXI.loader.resources.smokeParticle.texture],
            ThrusterEmitterConfig
        );
        this.thrustEmitter.emit = false;

        this.explosionEmitter = new PIXI.particles.Emitter(
            this.shipContainerSprite,
            [PIXI.loader.resources.smokeParticle.texture],
            ExplosionEmitterConfig
        );

        this.explosionEmitter.emit = false;
    }

    changeName(name, score){
        if (this.nameText != null) {
            this.nameText.destroy();
        }
        this.nameText = new PIXI.Text(`${name} score: ${score}`, { fontFamily: 'arial', fontSize: '12px', fill: 'black' });
        this.nameText.anchor.set(0.5, 0.5);
        this.nameText.y = -38;
        this.nameText.alpha = 1.0;
        this.sprite.addChild(this.nameText);
    }

    changeStudentCount(count) {
        if (this.countText != null) {
            this.countText.destroy();
        }
        this.countText = new PIXI.Text(`carrying ${count}`, { fontFamily: 'arial', fontSize: `${12 + count/2}px`, fill: 'black' });
        this.countText.anchor.set(0.5, 0.5);
        this.countText.y = 36;
        this.countText.alpha = 1.0;
        this.sprite.addChild(this.countText);
    }

    destroy() {
        return new Promise((resolve) =>{
            this.explosionEmitter.emit = true;

            if (this.nameText) this.nameText.destroy({ texture: false });
            if (this.thrustEmitter) this.thrustEmitter.destroy();
            if (this.shipSprite) this.shipSprite.destroy();
            this.nameText = null;
            this.thrustEmitter = null;
            this.shipSprite = null;

            setTimeout(()=>{
                this.shipContainerSprite.destroy();
                this.explosionEmitter.destroy();
                resolve();
            }, 300);
        });
    }

}


module.exports = ShipActor;
