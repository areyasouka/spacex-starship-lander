// a constant for converting degrees to radians
const PI_ON_180 = Math.PI / 180;

// a GameObject class
export default class GameObject {
  // declare a private array to store event listeners
  #eventListeners = [];

  // take in a x and y coordinates, a rotation (degrees), and an image (for rendering)
  constructor(x, y, rotation, image) {
    // assign the parameters to properties
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.image = image;
    // create a velocity property which is an object containing x, y and rotational velocity
    this.velocity = {
      x: 0,
      y: 0,
      rotation: 0,
    };
  }

  // a method to add an event listener
  addEventListener(name, callback) {
    // adds an event listener object to the private eventListeners array
    return this.#eventListeners.push({ name, _callback: callback, callback: callback.bind(this) });
  }

  // removes an event listener object from the private eventListeners array
  removeEventListener() {
    // loop through each event listener
    for (let i = 0; i < this.#eventListeners.length; i += 1) {
      // if the event listener has the same name
      if (this.#eventListeners[i].name) {
        // remove it
        this.#eventListeners.splice(i, 1);
        // return true (event listener removed)
        return true;
      }
    }
    // return false (no event listener removed)
    return false;
  }

  // trigger an event with the given name and using the rest of parameters as input
  dispatchEvent(name, ...params) {
    // loop through each event listener
    for (let i = 0; i < this.#eventListeners.length; i += 1) {
      // if the event listener has the right name
      if (this.#eventListeners[i].name === name) {
        // call it with the given parameters
        this.#eventListeners[i].callback(...params);
      }
    }
  }

  // an update method called each frame
  update(deltaTime) {
    // trigger any update event listeners
    this.dispatchEvent('update', deltaTime);
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.rotation += this.velocity.rotation;
    this.rotation %= 360;
    while (this.rotation < 0) {
      this.rotation += 360;
    }
    while (this.rotation > 360) {
      this.rotation -= 360;
    }
  }

  // a render method called each frame
  render(ctx, Camera) {
    // trigger any render event listeners
    this.dispatchEvent('render', ctx);
    ctx.translate(this.x + Camera.x, this.y + Camera.y);
    ctx.rotate(this.rotation * PI_ON_180);
    ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
