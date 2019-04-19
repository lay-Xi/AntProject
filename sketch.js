const WIDTH = 300;
const HEIGHT = 300;
const ants = [];
let surface = null;
let start;
let end;
const GOAL_RADIUS = 20;
const NUM_ANTS = 50;
const TOUCH_TIMER = 70;
const UNFREEZE_TIMER = 30;
const SPEED = 4;
const TURN_SPEED = 0.5;
const JIGGLE_SPEED = 0.2;

function setup() {
  createCanvas(WIDTH, HEIGHT);

  // White surface
  surface = [
    createVector(0, 0),
    createVector(100, 0),
    createVector(100, HEIGHT),
    createVector(0, HEIGHT),
  ];

  // Start dot
  start = createVector(0, HEIGHT / 2);

  // Target dot
  end = createVector(WIDTH - 50, HEIGHT / 2);

  // Creates ants
  for (let i = 0; i < NUM_ANTS; i++) {
    ants.push({
      frozen: false,
      timer: 0,
      speed: SPEED,
      position: createVector(0, HEIGHT / 2),
      target: end,
      angle: random(-Math.PI, Math.PI),
      above: new Set(),
      below: new Set(),
    });
  }
}

function tryStep(ant, nextPosition) {
  // https://github.com/bmoren/p5.collide2D/#collidepointpoly
  const onSurface = collidePointPoly(nextPosition.x, nextPosition.y, surface);

  // Because ant moves, it is removed from the other ant's above set.
  [...ant.below].forEach(a => {
    a.above.delete(ant);
  });

  // Clears ant below set since it won't have those ants below it anymore.
  ant.below.clear();

  // Moves ant to next location on surface
  if (onSurface) {
    ant.position = nextPosition;
    return true;
  } else {
    // Gets list of ants that are frozen and in range
    const antCollisions = ants.filter(a => a != ant && a.frozen && nextPosition.copy().sub(a.position).mag() < 10);

    // If there are ants in range, add the ant's that are below and above
    if (antCollisions.length > 0) {
      antCollisions.forEach(a => {
        a.above.add(ant);
        ant.below.add(a);
      });
      ant.position = nextPosition;
      return true;
    } else {
      return false;
    }
  }
}

function draw() {
  // If ant is within goal, change ant's target
  ants.forEach(ant => {
    if (ant.position.copy().sub(ant.target).mag() < GOAL_RADIUS + 10) {
      ant.target = ant.target == end
        ? start
        : end;
      ant.angle = random(0, Math.PI);
    }

    // Set random jiggle for ants
    if (!ant.frozen) {
      ant.angle += random(-1, 1) * JIGGLE_SPEED;
    }

    // Timer ??????
    if (ant.timer > 0)
      ant.timer--;

    // If ant not part of bridge
    if (!ant.frozen) {
      const toTarget = ant.target.copy().sub(ant.angle).normalize();
      const antAngle = createVector(Math.cos(ant.angle), Math.sin(ant.angle)).normalize();
      const closerToTarget = antAngle.copy().mult(0.7).add(toTarget.copy().mult(0.3));

      // Moves ant based on random angle
      if (tryStep(ant, ant.position.copy().add(antAngle.mult(ant.speed)))) {

      } else if (tryStep(ant, ant.position.copy().add(closerToTarget.mult(ant.speed)))) {
        ant.angle = closerToTarget.heading();
      } else if (tryStep(ant, ant.position.copy().add(antAngle.copy().mult(ant.speed)))) {

      } else if (ant.timer === 0) {
        ant.timer = TOUCH_TIMER;
        ant.frozen = true;

        // Adds ants in range below and above ant
        ants.filter(a => a != ant && a.frozen && ant.position.copy().sub(a.position).mag() < 10).forEach(a => {
          a.above.add(ant);
          ant.below.add(a);
        });
      } else {
        // Random angle the ants move in
        ant.angle -= TURN_SPEED * Math.random(-1, 1);
      }
    }
  });

  ants.forEach(ant => {
    if (ant.frozen) {
      if (ant.above.size > 0) {
        ant.timer = TOUCH_TIMER;
      } else if (ant.timer === 0) {
        ant.frozen = false;
        ant.timer = UNFREEZE_TIMER;
      }
    }
  });

  // Background color
  noStroke();
  fill('#88AADD');
  rect(0, 0, WIDTH, HEIGHT);

  // Begin surface
  fill(200);
  beginShape();
  surface.forEach(v => vertex(v.x, v.y));
  endShape(CLOSE);

  // Start and end dots
  fill('rgba(255, 0, 0, 0.5)');
  [start, end].forEach(v => ellipse(v.x, v.y, 2 * GOAL_RADIUS, 2 * GOAL_RADIUS));

  // Ant colors
  ants.forEach(ant => {
    if (ant.target == end) {
      fill('#555555');
      stroke('#222222');
    } else {
      fill('#AA3333');
      stroke('#881111');
    }

    // Draws the ant
    translate(ant.position.x, ant.position.y);
    rotate(ant.angle);
    ellipse(0, 0, 20, 10);
    resetMatrix();

    // Color of direction of top ant's head
    stroke('#FF0000');
    [...ant.above].forEach(a => {
      line(ant.position.x, ant.position.y, a.position.x, a.position.y);
    });
  });
}
