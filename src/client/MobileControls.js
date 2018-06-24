const EventEmitter = require('eventemitter3');
const Utils = require('../common/Utils');

/**
 * This class handles touch device controls
 */
class MobileControls{

    constructor(clientEngine){
        Object.assign(this, EventEmitter.prototype);
        this.inputPulser = 0;
        this.renderer = clientEngine.renderer;
        this.clientEngine = clientEngine;

        this.touchContainer = window; // document.querySelector(".pixiContainer");
        this.setupListeners();

        this.activeInput = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        let onRequestAnimationFrame = () => {
            this.handleMovementInput();
            window.requestAnimationFrame(onRequestAnimationFrame);
        };

        onRequestAnimationFrame();

    }

    setupListeners(){
        let touchHandler = (e) => {
            // If there's exactly one finger inside this element
            let touch = e.targetTouches[0];
            this.currentTouch = {
                x: touch.pageX,
                y: touch.pageY
            };

            if (e.type === 'touchstart' && e.targetTouches[1]){
                this.emit('fire');
            }
        };

        this.touchContainer.addEventListener('touchstart', touchHandler, false);
        this.touchContainer.addEventListener('touchmove', (e) =>{
            touchHandler(e);
            // if ingame prevent scrolling
            if (this.renderer.playerShip) {
                e.preventDefault();
            }
        }, false);

        this.touchContainer.addEventListener('touchend', (e) => {
            // alert('end');
            this.currentTouch = false;
            this.activeInput.up = false;
            this.activeInput.left = false;
            this.activeInput.right = false;
            this.renderer.onKeyChange({ keyName: 'up', isDown: false });
        }, false);

        document.querySelector('.fireButton').addEventListener('click', () => {
            this.emit('fire');
        });
    }

    handleMovementInput(){
        // no touch, no movement
        if (!this.currentTouch) return;

        this.inputPulser = (this.inputPulser + 1) % 100000;

        // alert(JSON.stringify(this.currentTouch));

        // // by default no touch
        // this.activeInput.right = false;
        // this.activeInput.left = false;
        // this.activeInput.up = false;



        // let dx = this.currentTouch.x - playerShipScreenCoords.x;
        // let dy = this.currentTouch.y - playerShipScreenCoords.y;
        // let shortestArc = Utils.shortestArc(Math.atan2(dx, -dy),
        //     Math.atan2(Math.sin(playerShip.actor.shipContainerSprite.rotation + Math.PI / 2), Math.cos(playerShip.actor.shipContainerSprite.rotation + Math.PI / 2)));

        // let rotateThreshold = 0.3;
        // let distanceThreshold = 120;

        // // turn left or right
        // if (shortestArc > rotateThreshold){
        //     this.activeInput.left = true;
        //     this.activeInput.right = false;
        // } else if (shortestArc < -rotateThreshold) {
        //     this.activeInput.right = true;
        //     this.activeInput.left = false;
        // }

        // // don't turn if too close
        // if (Math.sqrt(dx * dx + dy * dy) > distanceThreshold) {
        //     this.activeInput.up = true;
        //     this.renderer.onKeyChange({ keyName: 'up', isDown: true });
        // } else {
        //     this.renderer.onKeyChange({ keyName: 'up', isDown: false });
        // }
        try {
            let playerShip = this.renderer.playerShip;
            // no player ship, no movement
            if (!playerShip) return;

            let playerShipScreenCoords = this.renderer.gameCoordsToScreen(playerShip);

            let dx = this.currentTouch.x - playerShipScreenCoords.x;
            let dy = this.currentTouch.y - playerShipScreenCoords.y;
            this.activeInput.left = (dx < -10);
            this.activeInput.right = (dx > 10);
            this.activeInput.up = (dy < -10);
            this.activeInput.down = (dy > 10);

            if (this.activeInput.left) { this.clientEngine.sendInput('left'); }
            if (this.activeInput.right) { this.clientEngine.sendInput('right'); }
            if (this.activeInput.up) { this.clientEngine.sendInput('up'); }
            if (this.activeInput.down) { this.clientEngine.sendInput('down'); }
        } catch (e) {
            alert(e);
        }

    }

}

module.exports = MobileControls;
