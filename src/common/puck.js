import DynamicObject from 'lance/serialize/DynamicObject';

export default class Puck extends DynamicObject {
  get bendingMultiple() { return 0.8; }
  get bendingVelocityMultiple() { return 0.8; }

  constructor(gameEngine, options, props) {
    super(gameEngine, options, props);
    if (props && props.playerId) {
      this.playerId = props.playerId;
    }
    this.class = Puck;
  }

  onAddToWorld(gameEngine) {
    if (gameEngine.renderer) {
      gameEngine.renderer.addSprite(this, 'puck');
    }
  }
}
