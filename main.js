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

// Game variables {
let started = false; // whether or not the game has started yet
let launched = false; // whether or not the Starship has launched yet
let launchTime = null; // the time when the Starship will launch
let starlinksReleased = false; // whether or not the Starlink satellites have been released
let won = false; // whether or not the game has been won
const particles = []; // array to store all particles created
const stars = []; // WIP
// object to store info on the current objective
const objective = {
  name: 'space', // the current objectives name
  text: 'Exit the atmosphere', // the text displayed explaining the current objective to the user
  x: 0, // the x coordinate of the objective (if type is "location")
  y: -20000, // the y coordinate of the objective (if type is "location")
  type: 'location', // the type of objective
  control: true, // whether or not the player currently has control (keyboard input)
};
// }

// images
// a helper function to make loading images easier and more 'legible'/readable
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
  connector: img('./images/Connector.png'),
  ground: img('./images/Ground.png'),
  earth: img('./images/Earth.png'),
  arrow_white: img('./images/Arrow White.png'),
};

// camera
// camera object to allow 'scrolling', the camera will follow the player
// smoothing enables a smooth camera follow (although the screen-shake kind of nullifies this...)
const Camera = {
  x: 0,
  y: 0,
  smoothing: 0.1,
};

const scene = new Scene();
const ground = new GameObject(0, 220, 0, Images.ground);
scene.add(ground);
const launchpad = new GameObject(40, 200, 0, Images.launchpad);
scene.add(launchpad);
const tower = new GameObject(70, 0, 0, Images.tower);
scene.add(tower);
const connector = new GameObject(35, -80, 0, Images.connector);
scene.add(connector);

const shipFull = new Ship(0, -60, 0, Images.ship);
const shipTop = new Ship(0, 0, 0, Images.shipTop);
const shipBottom = new Ship(0, 0, 0, Images.shipBottom);

shipFull.rotation = 270; // start upright
// create a ship variable (let not const so it's value can be changed, note objects are assigned by reference which is why this works)
let ship = shipFull;
scene.add(ship);

// a function to create an explosion effect with particles
// takes in the x and y coordinates of the explosion, how far the particles should spread, and how many particles should be created
function explosion(x, y, spread, count) {
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
      this.colour[3] -= deltaTime * 1;
      // if the time elapsed between the particle being created and now is greater than 1 second (1000 milliseconds)
      if (performance.now() - particle.start_time > 1000) {
        // remove the particle from the array of particles
        particles.splice(particles.indexOf(this), 1);
      }
    });
    particles.push(particle);
  }
  // a fifth of the particles
  for (let i = 0; i < fifth; i += 1) {
    const particle = new Particle(x + Math.random() * spread * 2 - spread, y + Math.random() * spread * 2 - spread, Math.random() * 360, 100, [255, 0, 0]);
    particle.start_time = performance.now();
    particle.addEventListener('update', function update(deltaTime) {
      this.colour[3] -= deltaTime * 1;
      if (performance.now() - particle.start_time > 1000) {
        particles.splice(particles.indexOf(this), 1);
      }
    });
    particles.push(particle);
  }
}

// a function to reset all variables easily (many variables are defined below but still accessible because of hoisting)
function reset() {
  shipFull.gravity = true; // make sure gravity is enabled
  shipFull.x = shipFull.velocity.x = shipFull.velocity.y = shipFull.velocity.rotation = 0; // set all velocities and x coordinate of the ship to 0
  shipFull.y = -60; // set the ship's y to -60 (to align with landing pad etc)
  shipFull.rotation = 270; // set the ship's rotation to 270 (in the unit circle 270 or 3/2 pi is upright)
  shipFull.removeEventListener('update');
  shipTop.gravity = true; // make sure gravity is enabled
  shipTop.x = shipTop.y = shipTop.rotation = shipTop.velocity.x = shipTop.velocity.y = shipTop.velocity.rotation = 0; // set all velocities and x and y coordinates of the ship top to 0
  shipTop.removeEventListener('update'); // remove the update event listener from the ship top
  shipBottom.gravity = true; // make sure gravity is enabled
  shipBottom.x = shipBottom.y = shipBottom.rotation = shipBottom.velocity.x = shipBottom.velocity.y = shipBottom.velocity.rotation = 0; // set all velocities and x and y coordinates of the ship bottom to 0
  shipBottom.removeEventListener('update'); // remove the update event listener from the ship top
  // remove the ships from the scene (doesn't have any impact if they aren't in the scene)
  scene.remove(shipFull);
  scene.remove(shipTop);
  scene.remove(shipBottom);
  // reset the global variables
  started = false;
  launched = false;
  launchTime = null;
  starlinksReleased = false;
  won = false;
  // reset the default objective
  objective.name = 'space';
  objective.text = 'Exit the atmosphere';
  objective.x = 0;
  objective.y = -20000;
  objective.type = 'location';
  objective.control = true;
  // reset the ship being used
  ship = shipFull; // set the ship we are using is the full ship, not one of the parts
  ship.addEventListener('update', ShipUpdate);
  scene.add(ship);
}

// the generic update function for the ship
function ShipUpdate(deltaTime) {
  // if we are in control of the ship
  if (objective.control) {
    // if the W key or the up arrow key or the space bar is pressed
    if (Input.KeyW || Input.ArrowUp || Input.Space) {
      this.thrust(deltaTime);
    }
    // if the A key or the left arrow key is pressed
    if (Input.KeyA || Input.ArrowLeft) {
      this.rotate(-deltaTime);
    }
    // if the D key or the right arrow key is pressed
    if (Input.KeyD || Input.ArrowRight) {
      this.rotate(deltaTime);
    }
    // if the Escape key is pressed
    if (Input.Escape) {
      // force the player to release Escape to prevent self destruct on hold
      Input.Escape = false;
      // create an explosion
      explosion(ship.x, ship.y, 50, 500);
      scene.remove(ship);
      setTimeout(reset, 1000);
    }
    // if the ship hits the ground
    if (this.y > GROUND_LEVEL + 50) {
      // create an explosion
      explosion(ship.x, ship.y, 50, 500);
      scene.remove(ship);
      setTimeout(reset, 1000);
    }
    // if the R key is pressed
    if (Input.KeyR) {
      // force player to release R to prevent self destruct on hold
      Input.KeyR = false;
      reset();
    }
  }
}
shipFull.addEventListener('update', ShipUpdate); // apply the ShipUpdate function on update

// a function to land the bottom of the starship
function LandBottom(deltaTime) {
  this.velocity.x = this.velocity.y = this.velocity.rotation = 0;
  // rotate towards 270 (upright)
  this.rotation += (270 - this.rotation) * deltaTime;
  // move towards x = 0
  this.x += -this.x * deltaTime;
  // move towards y = 145
  this.y += (145 - this.y) * deltaTime;
}

// a function to land the top of the starship
function LandTop(deltaTime) {
  this.gravity = false;
  this.velocity.x = this.velocity.y = this.velocity.rotation = 0;
  // rotate towards 270 (upright)
  this.rotation += (270 - this.rotation) * deltaTime;
  // move towards x = 0
  this.x += -this.x * deltaTime;
  // move towards y = -98
  this.y += (-98 - this.y) * deltaTime;
  // if connected to the 'connector' (I don't know the actual name for this)
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
      connector.y += (81 - connector.y) * deltaTime;
      // if 63 <= y <= 65
      if (Math.abs(64 - this.y) < 1) {
        this.removeEventListener('update');
        won = true;
      }
    });
  }
}

function Update(deltaTime) {
  if (started) {
    if (launched || launchTime - performance.now() <= 0) {
      if (!launched) {
        launched = true;
        // move and rotate the ship slightly
        ship.x = -20;
        ship.rotation = -95;
      }
      scene.update(deltaTime);
    }
    if (objective.name === 'space') {
      if (ship.y < objective.y) {
        // update the objective
        objective.name = 'correct position';
        objective.text = 'Move into the correct position';
        objective.x = 5000;
        objective.y = -25000;
      }
    } /* if the objective is correct position */ else if (objective.name === 'correct position') {
      // if the Starship is less than 5km away from the location
      if (Math.sqrt((ship.x - objective.x) ** 2 + (ship.y - objective.y) ** 2) < 1000) {
        // update the objective
        objective.name = 'Stage separation';
        objective.text = 'Initiate stage separation (press e)';
        objective.type = 'interact';
        objective.control = false;
      }
    } else if (objective.name === 'Stage separation') {
      if (Input.KeyE) {
        Input.KeyE = false;
        shipBottom.x = shipTop.x = ship.x;
        shipBottom.y = shipTop.y = ship.y;
        shipBottom.rotation = shipTop.rotation = ship.rotation;
        shipBottom.velocity.x = shipTop.velocity.x = shipBottom.velocity.y = shipTop.velocity.y = 0;
        shipBottom.velocity.rotation = shipTop.velocity.rotation = ship.velocity.rotation;
        shipTop.x += Math.cos(ship.rotation * PI_ON_180) * 30;
        shipTop.y += Math.sin(ship.rotation * PI_ON_180) * 30;
        shipTop.thrust(0.15);
        shipBottom.x += Math.cos(ship.rotation * PI_ON_180) * -30;
        shipBottom.y += Math.sin(ship.rotation * PI_ON_180) * -30;
        shipBottom.thrust(-0.15);
        scene.remove(ship);
        ship = shipTop;
        ship.addEventListener('update', ShipUpdate);
        scene.add(ship);
        scene.add(shipBottom);
        Input.KeyE = false;
        objective.name = 'Starlink satellites';
        objective.text = 'Release the starlink satellites (press e)';
        objective.type = 'interact';
        objective.control = false;
      }
    } else if (objective.name === 'Starlink satellites') {
      ship.velocity.x = ship.velocity.y = ship.velocity.rotation = 0;
      if (!starlinksReleased && Input.KeyE) {
        Input.KeyE = false;
        for (let i = 1; i <= 10; i += 1) {
          const starlink = new GameObject(0, 0, 0, Images.starlink);
          starlink.id = i;
          starlink.addEventListener('update', function update(deltaTime2) {
            this.velocity.x += Math.cos(this.rotation * PI_ON_180) * 15 * deltaTime2;
            this.velocity.y += Math.sin(this.rotation * PI_ON_180) * 15 * deltaTime2;
            if (Math.abs(ship.x - this.x) > canvas.width || Math.abs(ship.y - this.y) > canvas.height) {
              scene.remove(this);
              if (this.id === 10) {
                objective.name = 'Earth';
                objective.text = 'Land the bottom half of the Starship (c to catch Starship)';
                objective.type = 'location';
                objective.control = true;
                objective.x = 0;
                objective.y = -80;
                ship.removeEventListener('update');
                ship = shipBottom;
                ship.addEventListener('update', ShipUpdate);
              }
            }
          });
          setTimeout(() => {
            starlink.x = ship.x + Math.cos((ship.rotation) * PI_ON_180) * -5;
            starlink.y = ship.y + Math.sin((ship.rotation) * PI_ON_180) * -5;
            starlink.rotation = ship.rotation - 90;
            scene.add(starlink);
          }, starlink.id * 500);
        }
        starlinksReleased = true;
      }
    } else if (objective.name === 'Earth') {
      if (objective.text === 'Land the bottom half of the Starship (c to catch Starship)') {
        if (Input.KeyC && Math.abs(ship.x - objective.x) < 50 && Math.abs(ship.y - objective.y) < 50 && (ship.rotation > 250 && ship.rotation < 290)) {
          Input.KeyC = false;
          ship.removeEventListener('update');
          ship.addEventListener('update', LandBottom);
          ship = shipTop;
          ship.addEventListener('update', ShipUpdate);
          objective.text = 'Land the top half of the Starship (c to catch Starship)';
        }
      } else if (objective.text === 'Land the top half of the Starship (c to catch Starship)') {
        if (Input.KeyC && Math.abs(ship.x - objective.x) < 50 && Math.abs(ship.y - objective.y) < 50 && (ship.rotation > 250 && ship.rotation < 290)) {
          Input.KeyC = false;
          ship.removeEventListener('update');
          ship.addEventListener('update', LandTop);
          objective.text = '';
          objective.control = false;
          objective.type = 'animation';
        }
      }
    }
    if (objective.control && (Input.KeyW || Input.ArrowUp || Input.Space) && particles.length < 100) {
      for (let i = 0; i < 4; i += 1) {
        const angleInRadians = (ship.rotation + 180) * PI_ON_180;
        const particle = new Particle(ship.x + Math.cos(angleInRadians) * (80 + Math.random() * 40 - 20), ship.y + Math.sin(angleInRadians) * (80 + Math.ceil(Math.random() * 20)), ship.rotation + 180 + Math.random() * 30 - 15, 800, [140, 20, 252]);
        particle.created_at = performance.now();
        particle.addEventListener('update', function update() {
          if (performance.now() - particle.created_at >= 100) {
            particles.splice(particles.indexOf(this), 1);
          }
        });
        particles.push(particle);
      }
    }
  } else if (Input.Space || Input.Enter) {
    started = true;
    launchTime = performance.now() + 5000;
    launched = false;
  }
  for (let i = 0; i < particles.length; i += 1) {
    particles[i].update(deltaTime);
  }
  // stars
  if (ship.y < -15000) {
    const starCount = (canvas.width * canvas.height) / 5000;
    while (stars.length < starCount) {
      const starY = ship.y + Math.random() * canvas.height - canvas.height / 2;
      const star = new Particle(ship.x + Math.random() * canvas.width - canvas.width / 2, starY, Math.random() * 360, 0, [255, 255, 255, starY > -18000 ? 1 - (18000 + starY) / 3000 : 1]);
      star.addEventListener('update', function update() {
        if (Math.abs(ship.x - this.x) > canvas.width || Math.abs(ship.y - this.y) > canvas.height) {
          stars.splice(stars.indexOf(this), 1);
        }
      });
      stars.push(star);
    }
  } else {
    stars.splice(0, stars.length);
  }
  for (let i = 0; i < stars.length; i += 1) {
    stars[i].update(deltaTime);
  }
  // smooth camera follow
  Camera.x += ((canvas.width / 2 - ship.x) - Camera.x) * Camera.smoothing;
  Camera.y += ((canvas.height / 2 - ship.y) - Camera.y) * Camera.smoothing;
  // camera shake (based on the ships velocity)
  if (started) {
    const averageVelocity = Math.floor(Math.abs(ship.velocity.x + ship.velocity.y) / 2);
    const SHAKE_CONSTANT = 0.05;
    Camera.x += Math.random() * averageVelocity * SHAKE_CONSTANT - (averageVelocity * SHAKE_CONSTANT) / 2;
    Camera.y += Math.random() * averageVelocity * SHAKE_CONSTANT - (averageVelocity * SHAKE_CONSTANT) / 2;
    if (!launched && objective.name === 'space' && (Input.KeyW || Input.ArrowUp || Input.Space)) {
      Camera.x += Math.random() * 100 * SHAKE_CONSTANT - (100 * SHAKE_CONSTANT) / 2;
      Camera.y += Math.random() * 100 * SHAKE_CONSTANT - (100 * SHAKE_CONSTANT) / 2;
    }
  }
}

// render
function Render() {
  // reset the canvas transform matrix (undo any tranformations/rotations)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Background {
  // scale = the distance between the ship and space scaled to be from 0 to 1
  let scale = 1 - Math.abs((Math.max(ship.y, -20000) + 20000) / 20000);
  // set the fillStyle to gradually turn black as the scale increases to 1
  ctx.fillStyle = `rgb(${116 - 116 * scale},${162 - 162 * scale}, ${255 - 255 * scale})`;
  // fill the screen (also clearing the previous screen)
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // }
  // Ground {
  // if the camera can see the ground
  if (Camera.y + canvas.width > Camera.y + GROUND_LEVEL + 150) {
    // draw the ground
    // (a darker green line)
    ctx.strokeStyle = 'rgb(10,142,47)';
    // make the line thicker
    ctx.lineWidth = 8;
    // draw the line
    ctx.beginPath();
    ctx.moveTo(0, Camera.y + GROUND_LEVEL + 168);
    ctx.lineTo(canvas.width, Camera.y + GROUND_LEVEL + 168);
    ctx.closePath();
    // display the line
    ctx.stroke();
    // (a lighter green rectangle from ground level to the bottom of the screen)
    ctx.fillStyle = 'rgb(11,176,58)';
    ctx.fillRect(0, Camera.y + GROUND_LEVEL + 168, canvas.width, canvas.height - Camera.y + GROUND_LEVEL + 150);
  }
  // }
  // Stars {
  // for each star
  for (let i = 0; i < stars.length; i += 1) {
    // render it (passing in the canvas context and the Camera)
    stars[i].render(ctx, Camera);
  }
  // }
  // Earth {
  // if the ship is less than 25km from space
  if (ship.y < -15000) {
    scale = 2 - Math.min(-(ship.y + 15000) / 7500, 2);
    const yOffset = Math.max((ship.y + 15000) / 100, -200);
    ctx.drawImage(Images.earth, canvas.width / 2 - (canvas.width * scale) / 2, canvas.height + yOffset, canvas.width * scale, canvas.width * scale);
  }
  // }
  // Scene {
  scene.render(ctx, Camera);
  // }
  // Particles {
  for (let i = 0; i < particles.length; i += 1) {
    if (Camera.x + particles[i].x >= 0 && Camera.x + particles[i].x <= canvas.width && Camera.y + particles[i].y >= 0 && Camera.y + particles[i].y <= canvas.height) {
      particles[i].render(ctx, Camera);
    }
  }
  // }
  // UI {
  ctx.fillStyle = '#ffffff';
  ctx.font = '2em Trebuchet MS';
  ctx.textAlign = 'center';
  if (started) {
    if (!launched) {
      ctx.fillText(`Launch in T${((performance.now() - launchTime) / 1000).toFixed(2)}`, Math.floor(canvas.width / 2), Math.floor(canvas.height / 4));
    } else if (won) {
      ctx.fillText('Mission Success!', Math.floor(canvas.width / 2), Math.floor(canvas.height / 4));
    }
  } else {
    ctx.fillText('Press space to start!', Math.floor(canvas.width / 2), Math.floor(canvas.height / 4));
  }
  // objective
  ctx.font = '1.5em Trebuchet MS';
  ctx.textAlign = 'left';
  ctx.fillText(objective.text, 10, 30);
  ctx.fillText(`Rotation: ${Math.round(ship.rotation) % 360}°`, 10, 55);
  ctx.fillText(`Altitude: ${Math.abs(ship.y / 200).toFixed(2)}km`, 10, 80);
  // arrow pointing to the objective
  if (objective.type === 'location') {
    ctx.translate(canvas.width / 2, 60);
    ctx.rotate(Math.atan2(objective.y - ship.y, objective.x - ship.x) + Math.PI / 2);
    ctx.drawImage(Images.arrow_white, -Images.arrow_white.width / 2, -Images.arrow_white.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = 'center';
    ctx.fillText(`${(Math.sqrt((ship.x - objective.x) ** 2 + (ship.y - objective.y) ** 2) / 200).toFixed(2)}km to ${objective.name}`, canvas.width / 2, 130);
  }
  // }
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

  // performance control/measurement
  const MAX_FRAME = 100; // ensures that physics don't break on slow devices or when tabs are switched
  let previousFrame = 0; // stores the last time that the game loop was run
  // game loop (an IIFE that returns a function inside the `requestAnimationFrame`)
  window.requestAnimationFrame((function main(currentFrame) {
    // update (pass in `deltaTime`: the time in seconds since the last frame, restricted by an upper bound of 100ms)
    Update(Math.min(currentFrame - previousFrame, MAX_FRAME) / 1000);
    // render
    Render();
    // reset `previousFrame` to allow measurement of `deltaTime`
    previousFrame = currentFrame;
    // indirect recursion
    window.requestAnimationFrame(main);
  }));
});
