import Scene from './scenes';
import GameObject from './gameobject';
import Particle from './particle';
import Ship from './ship';

// PI_ON_180 is useful for converting degrees to radians,
// which is the form of angle that computers generally use
const PI_ON_180 = Math.PI / 180;
// this is ground level, this is the point where the Starship collides and explodes
const GROUND_LEVEL = 100;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// object to store all input
const Input = {};
// keydown event listener (we only need the code property of the event object)
window.addEventListener('keydown', ({ code }) => {
  Input[code] = true;
});
window.addEventListener('keyup', ({ code }) => {
  Input[code] = false;
});

function touchMouseReleased() {
  Input.ArrowUp = false;
  Input.ArrowLeft = false;
  Input.ArrowRight = false;
  Input.MouseDown = false;
  Input.rotationAmplification = null;
  Input.thrustAmplification = null;
}

function setPosition(e) {
  e.preventDefault();
  if (e.type === 'touchstart' || e.type === 'mousedown') {
    Input.MouseDown = true;
  }
  if (e.type === 'touchstart' || e.type === 'touchmove') {
    Input.x = e.touches[0].clientX;
    Input.y = e.touches[0].clientY;
  } else {
    Input.x = e.clientX;
    Input.y = e.clientY;
  }
  const halfWidth = canvas.width / 2;
  const halfHeight = canvas.height / 2;
  if (Input.y < halfHeight) {
    Input.ArrowUp = true;
  }
  if (Input.x < halfWidth) {
    Input.ArrowLeft = true;
  } else if (Input.x > halfWidth) {
    Input.ArrowRight = true;
  }
  Input.rotationAmplification = Math.abs(halfWidth - Input.x) / ((halfWidth + Input.x) / 2);
  Input.thrustAmplification = ((canvas.height - Input.y) / canvas.height) * 1.5;
}

window.document.addEventListener('mousedown', setPosition);
window.document.addEventListener('mouseup', touchMouseReleased);
window.document.addEventListener('touchstart', setPosition);
window.document.addEventListener('touchend', touchMouseReleased);

function img(src) {
  const image = new Image();
  image.src = src;
  return image;
}

// store all the images in one Image object
const Images = {
  ship: img('./images/SpaceX Starship.png'),
  shipTop: img('./images/SpaceX Starship - Top.png'),
  shipBottom: img('./images/SpaceX Starship - Bottom.png'),
  starlink: img('./images/Starlink.png'),
  launchpad: img('./images/Launchpad.png'),
  tower: img('./images/Tower.png'),
  chopsticks: img('./images/Connector.png'),
  ground: img('./images/Ground.png'),
  earth: img('./images/Earth.png'),
  arrow_white: img('./images/Arrow White.png'),
};

class Game {
  constructor() {
    this.groundLevel = GROUND_LEVEL;
    this.input = Input;
    this.started = false; // whether or not the game has started yet
    this.launched = false; // whether or not the Starship has launched yet
    this.launchTime = null; // the time when the Starship will launch
    this.starlinksReleased = false; // whether or not the Starlink satellites have been released
    this.won = false; // whether or not the game has been won
    this.particles = []; // array to store all particles created
    this.stars = []; // WIP
    // object to store info on the current objective
    this.objective = {
      name: 'space', // the current objectives name
      text: 'Get to orbit!', // the text displayed explaining the current objective to the user
      x: 0, // the x coordinate of the objective (if type is "location")
      y: -20000, // the y coordinate of the objective (if type is "location")
      type: 'location', // the type of objective
      controlShip: null, // which ship the player currently has control of (keyboard input)
    };
    // camera object to allow 'scrolling', the camera will follow the player
    // smoothing enables a smooth camera follow (although the screen-shake kind of nullifies this...)
    this.Camera = {
      x: 0,
      y: 0,
      smoothing: 0.1,
    };
    // init
    this.scene = new Scene();
    const ground = new GameObject(0, 220, 0, Images.ground);
    this.scene.add(ground);
    const launchpad = new GameObject(40, 200, 0, Images.launchpad);
    this.scene.add(launchpad);
    const tower = new GameObject(70, 0, 0, Images.tower);
    this.scene.add(tower);
    this.chopsticks = new GameObject(35, -80, 0, Images.chopsticks);
    this.scene.add(this.chopsticks);
    this.shipFull = new Ship(0, -60, 0, Images.ship, this);
    this.shipTop = new Ship(0, 0, 0, Images.shipTop, this);
    this.shipBottom = new Ship(0, 0, 0, Images.shipBottom, this);
    this.shipFull.rotation = 270; // start upright
    // create a ship variable (let not const so it's value can be changed, note objects are assigned by reference which is why this works)
    this.ship = this.shipFull;
    this.objective.controlShip = this.ship;
    this.scene.add(this.ship);
    this.ship.addEventListener('update', this.ship.updateControl);
  }

  // a function to create an explosion effect with particles
  // takes in the x and y coordinates of the explosion, how far the particles should spread, and how many particles should be created
  explosion(x, y, spread, count) {
    const game = this;
    const fifth = count / 5; // a fifth of the particles to be created
    const fourFifths = 4 * fifth; // four fifths of the particles created
    // four fifths of the particles
    for (let i = 0; i < fourFifths; i += 1) {
      // create a particle at the x and y coordinates plus a random offset based on half the spread, with a velocity of 100 and a color of rgb(255,165,0) (orange)
      const particle = new Particle(x + Math.random() * spread - spread / 2, y + Math.random() * spread - spread / 2, Math.random() * 360, 100, [255, 165, 0]);
      particle.start_time = performance.now();
      // add an update event listener to the particle (called each frame)
      particle.addEventListener('update', function update(deltaTime) {
        // slowly fade out the particles
        particle.colour[3] -= deltaTime * 1;
        // if the time elapsed between the particle being created and now is greater than 1 second (1000 milliseconds)
        if (performance.now() - particle.start_time > 1000) {
          // remove the particle from the array of particles
          game.particles.splice(game.particles.indexOf(this), 1);
        }
      });
      game.particles.push(particle);
    }
    // a fifth of the particles
    for (let i = 0; i < fifth; i += 1) {
      const particle = new Particle(x + Math.random() * spread * 2 - spread, y + Math.random() * spread * 2 - spread, Math.random() * 360, 100, [255, 0, 0]);
      particle.start_time = performance.now();
      particle.addEventListener('update', function update(deltaTime) {
        particle.colour[3] -= deltaTime * 1;
        if (performance.now() - particle.start_time > 1000) {
          game.particles.splice(game.particles.indexOf(this), 1);
        }
      });
      game.particles.push(particle);
    }
  }

  // a function to reset all variables easily (many variables are defined below but still accessible because of hoisting)
  reset() {
    this.shipFull.gravity = true;
    this.shipFull.x = this.shipFull.velocity.x = this.shipFull.velocity.y = this.shipFull.velocity.rotation = 0; // set all velocities and x coordinate of the ship to 0
    this.shipFull.y = -60; // set the ship's y to -60 (to align with landing pad etc)
    this.shipFull.rotation = 270; // set the ship's rotation to 270 (in the unit circle 270 or 3/2 pi is upright)
    this.shipFull.removeEventListener('update');
    this.shipTop.gravity = true;
    this.shipTop.x = this.shipTop.y = this.shipTop.rotation = this.shipTop.velocity.x = this.shipTop.velocity.y = this.shipTop.velocity.rotation = 0; // set all velocities and x and y coordinates of the ship top to 0
    this.shipTop.removeEventListener('update');
    this.shipBottom.gravity = true;
    this.shipBottom.x = this.shipBottom.y = this.shipBottom.rotation = this.shipBottom.velocity.x = this.shipBottom.velocity.y = this.shipBottom.velocity.rotation = 0; // set all velocities and x and y coordinates of the ship bottom to 0
    this.shipBottom.removeEventListener('update');
    // remove the ships from the scene (doesn't have any impact if they aren't in the scene)
    this.scene.remove(this.shipFull);
    this.scene.remove(this.shipTop);
    this.scene.remove(this.shipBottom);
    // reset the global variables
    this.started = false;
    this.launched = false;
    this.launchTime = null;
    this.starlinksReleased = false;
    this.won = false;
    // reset the default objective
    this.objective.name = 'space';
    this.objective.text = 'Get to orbit!';
    this.objective.x = 0;
    this.objective.y = -20000;
    this.objective.type = 'location';
    // reset the ship being used
    this.ship = this.shipFull; // set the ship we are using is the full ship, not one of the parts
    this.objective.controlShip = this.ship;
    this.ship.addEventListener('update', this.ship.updateControl);
    this.scene.add(this.ship);
  }

  Update(deltaTime) {
    const game = this;
    if (this.started) {
      if (this.launched || this.launchTime - performance.now() <= 0) {
        if (!this.launched) {
          this.launched = true;
          // move and rotate the ship slightly
          this.ship.x = -20;
          this.ship.rotation = -95;
        }
        this.scene.update(deltaTime);
      }
      if (this.objective.name === 'space') {
        if (this.ship.y < this.objective.y) {
          // update the objective
          this.objective.name = 'correct position';
          this.objective.text = 'Move into the correct position';
          this.objective.x = 5000;
          this.objective.y = -25000;
        }
      } /* if the objective is correct position */ else if (this.objective.name === 'correct position') {
        // if the Starship is less than 5km away from the location
        if (Math.sqrt((this.ship.x - this.objective.x) ** 2 + (this.ship.y - this.objective.y) ** 2) < 1000) {
          // update the objective
          this.objective.name = 'Stage separation';
          this.objective.text = 'Initiate stage separation (press "e")';
          this.objective.type = 'interact';
          this.objective.controlShip = null;
        }
      } else if (this.objective.name === 'Stage separation') {
        if (this.input.KeyE || this.input.MouseDown) {
          this.input.KeyE = false;
          this.input.MouseDown = false;
          this.shipBottom.x = this.shipTop.x = this.ship.x;
          this.shipBottom.y = this.shipTop.y = this.ship.y;
          this.shipBottom.rotation = this.shipTop.rotation = this.ship.rotation;
          this.shipBottom.velocity.x = this.shipTop.velocity.x = this.shipBottom.velocity.y = this.shipTop.velocity.y = 0;
          this.shipBottom.velocity.rotation = this.shipTop.velocity.rotation = this.ship.velocity.rotation;
          this.shipTop.x += Math.cos(this.ship.rotation * PI_ON_180) * 30;
          this.shipTop.y += Math.sin(this.ship.rotation * PI_ON_180) * 30;
          this.shipTop.thrust(0.15);
          this.shipBottom.x += Math.cos(this.ship.rotation * PI_ON_180) * -30;
          this.shipBottom.y += Math.sin(this.ship.rotation * PI_ON_180) * -30;
          this.shipBottom.thrust(-0.15);
          this.ship.removeEventListener('update');
          this.scene.remove(this.ship);
          this.ship = this.shipTop;
          this.objective.controlShip = this.ship;
          this.ship.addEventListener('update', this.ship.updateControl);
          this.scene.add(this.ship);
          this.scene.add(this.shipBottom);
          this.objective.name = 'Starlink satellites';
          this.objective.text = 'Release the Starlink satellites (press "e")';
          this.objective.type = 'interact';
        }
      } else if (this.objective.name === 'Starlink satellites') {
        this.ship.velocity.x = this.ship.velocity.y = this.ship.velocity.rotation = 0;
        if (!this.starlinksReleased && (this.input.KeyE || this.input.MouseDown)) {
          this.input.KeyE = false;
          this.input.MouseDown = false;
          for (let i = 1; i <= 10; i += 1) {
            const starlink = new GameObject(0, 0, 0, Images.starlink);
            starlink.id = i;
            starlink.addEventListener('update', function update(deltaTime2) {
              this.velocity.x += Math.cos(this.rotation * PI_ON_180) * 15 * deltaTime2;
              this.velocity.y += Math.sin(this.rotation * PI_ON_180) * 15 * deltaTime2;
              if (Math.abs(game.ship.x - this.x) > canvas.width || Math.abs(game.ship.y - this.y) > canvas.height) {
                game.scene.remove(this);
                if (this.id === 10) {
                  game.objective.name = 'landing pad';
                  game.objective.text = 'Land the booster (press "c" to catch Booster at tower arms)';
                  game.objective.type = 'location';
                  game.objective.x = 0;
                  game.objective.y = -80;
                  game.ship.removeEventListener('update');
                  game.ship = game.shipBottom;
                  game.objective.controlShip = game.ship;
                  game.ship.addEventListener('update', game.ship.updateControl);
                }
              }
            });
            setTimeout(() => {
              starlink.x = game.ship.x + Math.cos((game.ship.rotation) * PI_ON_180) * -5;
              starlink.y = game.ship.y + Math.sin((game.ship.rotation) * PI_ON_180) * -5;
              starlink.rotation = game.ship.rotation - 90;
              game.scene.add(starlink);
            }, starlink.id * 500);
          }
          this.starlinksReleased = true;
        }
      } else if (this.objective.name === 'landing pad') {
        if (this.objective.text === 'Land the booster (press "c" to catch Booster at tower arms)') {
          if ((this.input.KeyC || this.input.MouseDown) && Math.abs(this.ship.x - this.objective.x) < 50 && Math.abs(this.ship.y - this.objective.y) < 50 && (this.ship.rotation > 250 && this.ship.rotation < 290)) {
            this.input.KeyC = false;
            this.input.MouseDown = false;
            this.ship.removeEventListener('update');
            this.ship.addEventListener('update', this.ship.landBottom);
            this.ship = this.shipTop;
            this.objective.controlShip = this.ship;
            this.ship.addEventListener('update', this.ship.updateControl);
            this.objective.text = 'Land the Starship (press "c" to catch Starship at tower arms)';
          }
        } else if (this.objective.text === 'Land the Starship (press "c" to catch Starship at tower arms)') {
          if ((this.input.KeyC || this.input.MouseDown) && Math.abs(this.ship.x - this.objective.x) < 50 && Math.abs(this.ship.y - this.objective.y) < 50 && (this.ship.rotation > 250 && this.ship.rotation < 290)) {
            this.input.KeyC = false;
            this.input.MouseDown = false;
            this.ship.removeEventListener('update');
            this.ship.addEventListener('update', this.ship.landTop);
            this.objective.text = '';
            this.objective.controlShip = null;
            this.objective.type = 'animation';
          }
        }
      }
      if (this.objective.controlShip && (this.input.KeyW || this.input.ArrowUp || this.input.Space) && this.particles.length < 100) {
        for (let i = 0; i < 4; i += 1) {
          const angleInRadians = (this.ship.rotation + 180) * PI_ON_180;
          const particle = new Particle(this.ship.x + Math.cos(angleInRadians) * (80 + Math.random() * 40 - 20), this.ship.y + Math.sin(angleInRadians) * (80 + Math.ceil(Math.random() * 20)), this.ship.rotation + 180 + Math.random() * 30 - 15, 800, [140, 20, 252]);
          particle.created_at = performance.now();
          particle.addEventListener('update', function update() {
            if (performance.now() - particle.created_at >= 100) {
              game.particles.splice(game.particles.indexOf(this), 1);
            }
          });
          this.particles.push(particle);
        }
      }
    } else if (this.input.KeyW || this.input.ArrowUp || this.input.Space) {
      this.started = true;
      this.launchTime = performance.now() + 5000;
      this.launched = false;
    }
    for (let i = 0; i < this.particles.length; i += 1) {
      this.particles[i].update(deltaTime);
    }
    // stars
    if (this.ship.y < -15000) {
      const starCount = (canvas.width * canvas.height) / 5000;
      while (game.stars.length < starCount) {
        const starY = game.ship.y + Math.random() * canvas.height - canvas.height / 2;
        const star = new Particle(game.ship.x + Math.random() * canvas.width - canvas.width / 2, starY, Math.random() * 360, 0, [255, 255, 255, starY > -18000 ? 1 - (18000 + starY) / 3000 : 1]);
        star.addEventListener('update', function update() {
          if (Math.abs(game.ship.x - this.x) > canvas.width || Math.abs(game.ship.y - this.y) > canvas.height) {
            game.stars.splice(game.stars.indexOf(this), 1);
          }
        });
        this.stars.push(star);
      }
    } else {
      this.stars.splice(0, this.stars.length);
    }
    for (let i = 0; i < this.stars.length; i += 1) {
      this.stars[i].update(deltaTime);
    }
    // smooth camera follow
    this.Camera.x += ((canvas.width / 2 - this.ship.x) - this.Camera.x) * this.Camera.smoothing;
    this.Camera.y += ((canvas.height / 2 - this.ship.y) - this.Camera.y) * this.Camera.smoothing;
    // camera shake (based on the ships velocity)
    if (this.started) {
      const averageVelocity = Math.floor(Math.abs(this.ship.velocity.x + this.ship.velocity.y) / 2);
      const SHAKE_CONSTANT = 0.05;
      this.Camera.x += Math.random() * averageVelocity * SHAKE_CONSTANT - (averageVelocity * SHAKE_CONSTANT) / 2;
      this.Camera.y += Math.random() * averageVelocity * SHAKE_CONSTANT - (averageVelocity * SHAKE_CONSTANT) / 2;
      if (!this.launched && this.objective.name === 'space' && (this.input.KeyW || this.input.ArrowUp || this.input.Space)) {
        this.Camera.x += Math.random() * 100 * SHAKE_CONSTANT - (100 * SHAKE_CONSTANT) / 2;
        this.Camera.y += Math.random() * 100 * SHAKE_CONSTANT - (100 * SHAKE_CONSTANT) / 2;
      }
    }
  }

  // render
  Render() {
    // reset the canvas transform matrix (undo any transformations/rotations)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Background {
    // scale = the distance between the ship and space scaled to be from 0 to 1
    let scale = 1 - Math.abs((Math.max(this.ship.y, -20000) + 20000) / 20000);
    // set the fillStyle to gradually turn black as the scale increases to 1
    ctx.fillStyle = `rgb(${116 - 116 * scale},${162 - 162 * scale}, ${255 - 255 * scale})`;
    // fill the screen (also clearing the previous screen)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // }
    // Ground {
    // if the camera can see the ground
    if (this.Camera.y + canvas.width > this.Camera.y + GROUND_LEVEL + 150) {
      // draw the ground
      // (a darker green line)
      ctx.strokeStyle = 'rgb(10,142,47)';
      // make the line thicker
      ctx.lineWidth = 8;
      // draw the line
      ctx.beginPath();
      ctx.moveTo(0, this.Camera.y + GROUND_LEVEL + 168);
      ctx.lineTo(canvas.width, this.Camera.y + GROUND_LEVEL + 168);
      ctx.closePath();
      // display the line
      ctx.stroke();
      // (a lighter green rectangle from ground level to the bottom of the screen)
      ctx.fillStyle = 'rgb(11,176,58)';
      ctx.fillRect(0, this.Camera.y + GROUND_LEVEL + 168, canvas.width, canvas.height - this.Camera.y + GROUND_LEVEL + 150);
    }
    // }
    // Stars {
    // for each star
    for (let i = 0; i < this.stars.length; i += 1) {
      // render it (passing in the canvas context and the Camera)
      this.stars[i].render(ctx, this.Camera);
    }
    // }
    // Earth {
    // if the ship is less than 25km from space
    if (this.ship.y < -15000) {
      scale = 2 - Math.min(-(this.ship.y + 15000) / 7500, 2);
      const yOffset = Math.max((this.ship.y + 15000) / 100, -200);
      ctx.drawImage(Images.earth, canvas.width / 2 - (canvas.width * scale) / 2, canvas.height + yOffset, canvas.width * scale, canvas.width * scale);
    }
    // }
    // Scene {
    this.scene.render(ctx, this.Camera);
    // }
    // Particles {
    const game = this;
    for (let i = 0; i < game.particles.length; i += 1) {
      if (game.Camera.x + game.particles[i].x >= 0 && game.Camera.x + game.particles[i].x <= canvas.width && game.Camera.y + this.particles[i].y >= 0 && game.Camera.y + game.particles[i].y <= canvas.height) {
        game.particles[i].render(ctx, game.Camera);
      }
    }
    // }
    // UI {
    ctx.fillStyle = '#ffffff';
    ctx.font = '2em Trebuchet MS';
    ctx.textAlign = 'center';
    if (this.started) {
      if (!this.launched) {
        ctx.fillText(`Launch in T${((performance.now() - this.launchTime) / 1000).toFixed(2)}`, Math.floor(canvas.width / 2), Math.floor(canvas.height / 4));
      } else if (this.won) {
        ctx.fillText('Mission Success!', Math.floor(canvas.width / 2), Math.floor(canvas.height / 4));
      }
    } else {
      ctx.fillText('Press space or tap to start!', Math.floor(canvas.width / 2), Math.floor(canvas.height / 4));
      ctx.font = '1em Trebuchet MS';
      ctx.fillText('On mobile, tap higher for thrust, lower half to rotate)', Math.floor(canvas.width / 2), Math.floor(canvas.height / 4) + 30);
    }
    // objective
    ctx.font = '1.5em Trebuchet MS';
    ctx.textAlign = 'left';
    ctx.fillText(this.objective.text, 10, 30);
    ctx.fillText(`Rotation: ${Math.round(this.ship.rotation) % 360}°`, 10, 55);
    ctx.fillText(`Altitude: ${Math.abs(this.ship.y / 200).toFixed(2)}km`, 10, 80);
    // arrow pointing to the objective
    if (this.objective.type === 'location') {
      ctx.translate(canvas.width / 2, 60);
      ctx.rotate(Math.atan2(this.objective.y - this.ship.y, this.objective.x - this.ship.x) + Math.PI / 2);
      ctx.drawImage(Images.arrow_white, -Images.arrow_white.width / 2, -Images.arrow_white.height / 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.textAlign = 'center';
      ctx.fillText(`${(Math.sqrt((this.ship.x - this.objective.x) ** 2 + (this.ship.y - this.objective.y) ** 2) / 200).toFixed(2)}km to ${this.objective.name}`, canvas.width / 2, 130);
    }
  }
}

// start game on load
window.addEventListener('load', () => {
  // fit the canvas to the window
  function fillScreen() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  // apply
  fillScreen();
  // re-apply every time the window is resized
  window.addEventListener('resize', fillScreen);

  // add the canvas to the DOM
  document.body.append(canvas);

  const game = new Game();
  // performance control/measurement
  const MAX_FRAME = 100; // ensures that physics don't break on slow devices or when tabs are switched
  let previousFrame = 0; // stores the last time that the game loop was run
  // game loop (an Immediately Invoked Function Expression that returns a function inside the `requestAnimationFrame`)
  window.requestAnimationFrame((function main(currentFrame) {
    // update (pass in `deltaTime`: the time in seconds since the last frame, restricted by an upper bound of 100ms)
    game.Update(Math.min(currentFrame - previousFrame, MAX_FRAME) / 1000);
    // render
    game.Render();
    // reset `previousFrame` to allow measurement of `deltaTime`
    previousFrame = currentFrame;
    // indirect recursion
    window.requestAnimationFrame(main);
  }));
});
