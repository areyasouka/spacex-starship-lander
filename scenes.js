class Scene {
	#objects = [];
	#eventListeners = [];
	constructor(objects = []) {
		for (let i = 0; i < objects.length; i++) {
			this.#objects.push(objects[i]);
		}
	}
	addEventListener(name, callback) {
		return this.#eventListeners.push({ name, _callback: callback, callback: callback.bind(this) });
	}
	removeEventListener(name, callback) {
		for (let i = 0; i < this.#eventListeners.length; i++) {
			if (this.#eventListeners[i].name === name) {
				this.#eventListeners.splice(i, 1);
				return true;
			}
		}
		return false;
	}
	dispatchEvent(name, ...params) {
		for (let i = 0; i < this.#eventListeners.length; i++) {
			if (this.#eventListeners[i].name === name) {
				this.#eventListeners[i].callback(...params);
			}
		}
	}
	add(...objects) {
		for (let i = 0; i < objects.length; i++) {
			this.#objects.push(objects[i]);
		}
	}
	remove(object) {
		for (let i = 0; i < this.#objects.length; i++) {
			if (this.#objects[i] === object) {
				this.#objects.splice(i, 1);
				return true;
			}
		}
		return false;
	}
	update(deltaTime) {
		this.dispatchEvent("update", deltaTime);
		for (let i = 0; i < this.#objects.length; i++) {
			this.#objects[i].update(deltaTime);
		}
	}
	render(ctx, Camera) {
		this.dispatchEvent("render", ctx, Camera);
		for (let i = 0; i < this.#objects.length; i++) {
			this.#objects[i].render(ctx, Camera);
		}
	}
}

export { Scene as default };