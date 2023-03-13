import GameObject from './gameobject';

const PI_ON_180 = Math.PI / 180;

const THRUST_SPEED = 1800;
const ROTATION_SPEED = 200;
const GRAVITY_STRENGTH = 800;
const SPACE = -20000;

export default class Ship extends GameObject {
  constructor(x, y, rotation, image, game) {
    super(x, y, rotation, image);
    this.gravity = true;
    this.game = game;
  }

  thrust(deltaTime) {
    this.velocity.x += Math.cos(this.rotation * PI_ON_180) * THRUST_SPEED * deltaTime;
    this.velocity.y += Math.sin(this.rotation * PI_ON_180) * THRUST_SPEED * deltaTime;
  }

  rotate(deltaTime) {
    this.velocity.rotation += ROTATION_SPEED * deltaTime * (this.game.input.rotationAmplification ? this.game.input.rotationAmplification : 1);
  }

  updateControl(deltaTime) {
    // if we are in control of the ship
    if (this.game.objective.controlShip === this) {
      // if the W key or the up arrow key or the space bar is pressed
      if (this.game.input.KeyW || this.game.input.ArrowUp || this.game.input.Space) {
        this.thrust(deltaTime);
      }
      // if the A key or the left arrow key is pressed
      if (this.game.input.KeyA || this.game.input.ArrowLeft) {
        this.rotate(-deltaTime);
      }
      // if the D key or the right arrow key is pressed
      if (this.game.input.KeyD || this.game.input.ArrowRight) {
        this.rotate(deltaTime);
      }
      // if the Escape key is pressed
      if (this.game.input.Escape) {
        // force the player to release Escape to prevent self destruct on hold
        this.game.input.Escape = false;
        // create an explosion
        this.game.explosion(this.x, this.y, 50, 500);
        this.game.scene.remove(this);
        setTimeout(() => {
          this.game.reset();
        }, 1000);
      }
      // if the ship hits the ground
      if (this.y > this.game.groundLevel + 50) {
        // create an explosion
        this.game.explosion(this.x, this.y, 50, 500);
        this.game.scene.remove(this);
        setTimeout(() => {
          this.game.reset();
        }, 1000);
      }
      // if the R key is pressed
      if (this.game.input.KeyR) {
        // force player to release R to prevent self destruct on hold
        this.game.input.KeyR = false;
        this.game.reset();
      }
    }
  }

  update(deltaTime) {
    this.dispatchEvent('update', deltaTime);
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    this.rotation += this.velocity.rotation * deltaTime;
    this.rotation %= 360;
    while (this.rotation < 0) {
      this.rotation += 360;
    }
    while (this.rotation > 360) {
      this.rotation -= 360;
    }
    this.velocity.x -= this.velocity.x * 0.99 * deltaTime;
    this.velocity.y -= this.velocity.y * 0.99 * deltaTime;
    if (this.gravity) {
      this.velocity.y += (GRAVITY_STRENGTH
        * Math.abs((Math.max(this.y, SPACE) - SPACE) / Math.abs(SPACE)))
        * deltaTime;
    }
    this.velocity.rotation -= this.velocity.rotation * 0.9 * deltaTime;
  }

  land(deltaTime) {
    this.velocity.x = this.velocity.y = this.velocity.rotation = 0;
    // rotate towards 270 (upright)
    this.rotation += (270 - this.rotation) * deltaTime;
    // move towards x = 0
    this.x += -this.x * deltaTime;
  }

  landBottom(deltaTime) {
    this.land(deltaTime);
    // move towards y = 145
    this.y += (145 - this.y) * deltaTime;
  }

  landTop(deltaTime) {
    this.land(deltaTime);
    // move towards y = -98
    this.y += (-98 - this.y) * deltaTime;
    this.gravity = false;
    // if caught by chopsticks
    // if x = 0 and -99 <= y <= -97 and 269 <= rotation <= 271
    if (Math.round(Math.abs(this.x)) === 0 && Math.abs(-98 - this.y) < 1 && Math.abs(270 - this.rotation) < 1) {
      // set x to 0 (an imperceptible change, but important for clean connection to bottom)
      this.x = 0;
      this.rotation = 270;
      this.removeEventListener('update');
      this.addEventListener('update', function update() {
        // move towards y = 64
        this.y += (64 - this.y) * deltaTime;
        // move the connected towards y = 81
        this.game.chopsticks.y += (81 - this.game.chopsticks.y) * deltaTime;
        // if 63 <= y <= 65
        if (Math.abs(64 - this.y) < 1) {
          this.removeEventListener('update');
          this.game.won = true;
        }
      });
    }
  }
}
