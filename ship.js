import GameObject from './gameobject';

const PI_ON_180 = Math.PI / 180;

const THRUST_SPEED = 1800;
const ROTATION_SPEED = 200;
const GRAVITY_STRENGTH = 800;
const SPACE = -20000;

export default class Spaceship extends GameObject {
  constructor(x, y, rotation, image) {
    super(x, y, rotation, image);
    this.gravity = true;
  }

  thrust(deltaTime) {
    this.velocity.x += Math.cos(this.rotation * PI_ON_180) * THRUST_SPEED * deltaTime;
    this.velocity.y += Math.sin(this.rotation * PI_ON_180) * THRUST_SPEED * deltaTime;
  }

  rotate(deltaTime) {
    this.velocity.rotation += ROTATION_SPEED * deltaTime;
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
}
