import GameObject from "./gameobject.js";

const PI_ON_180 = Math.PI / 180;

const FORCE_MULTIPLIER = 0.8;

class Particle extends GameObject {
	constructor(x, y, direction, force, colour) {
		super(x, y, direction * PI_ON_180, null);
		this.force = force;
		this.colour = colour;
		if (this.colour.length < 4) {
			this.colour.push(1);
		}
	}
	update(deltaTime) {
		this.dispatchEvent("update", deltaTime);
		this.x += Math.cos(this.rotation) * this.force * deltaTime;
		this.y += Math.sin(this.rotation) * this.force * deltaTime;
		this.force += this.force * FORCE_MULTIPLIER * deltaTime;
	}
	render(ctx, Camera) {
		this.dispatchEvent("render", ctx, Camera)
		ctx.translate(this.x + Camera.x, this.y + Camera.y);
		ctx.rotate(this.rotation);
		ctx.fillStyle = `rgba(${this.colour[0]},${this.colour[1]},${this.colour[2]},${this.colour[3]})`;
		ctx.fillRect(-2, -2, 4, 4);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}
}

export { Particle as default };