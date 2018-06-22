'use strict';

import Renderer from 'lance/render/Renderer';

export default class MyRenderer extends Renderer {
  constructor(gameEngine, clientEngine) {
    super(gameEngine, clientEngine);
    this.sprites = {};
  }

  draw(t, dt) {
    super.draw(t, dt);

    for (let objId of Object.keys(this.sprites)) {
      if (this.sprites[objId].el) {
        this.sprites[objId].el.style.top = this.gameEngine.world.objects[objId].position.y + 'px';
        this.sprites[objId].el.style.left = this.gameEngine.world.objects[objId].position.x + 'px';
      }
    }
  }

  addSprite(obj, objName) {
    const el = document.createElement('div');
    el.className = 'ball';
    el.style.position = 'absolute';
    el.style.width = '25px';
    el.style.height = '25px';
    el.style.backgroundColor = 'white';
    el.style.borderRadius= '25px';
    document.getElementById('sprites').appendChild(el);
//      <div style="position:absolute;width:10px;height:50px;background:white" class="puck1"></div>
//      <div style="position:absolute;width:10px;height:50px;background:white" class="puck2"></div>
//      <div style="position:absolute;width:5px; height:5px;background:white" class="ball"></div>

    // if (objName === 'puck') objName += obj.playerId;
    this.sprites[obj.id] = {
      el: el,
    };
  }

}
