// settings
var s = 15;
var gridWidth = 30;
var gridHeight = 30;
var fps = 10;
var hueStep = 2
var explodeTime = 2;
var bombProbability = .25;

// global variables
var state,
    snake,
    food,
    xSpeed, ySpeed,
    lastXSpeed, lastYspeed,
    startHue,
    bombs = [],
    explodeFrame = 0,
    keyBuffer = [],
    allowKeyPress = true;

function keyPressed() {
  if (allowKeyPress) {
    keyBuffer.push({key: key, keyCode: keyCode});
  }
}

function nextKeyPress() {
  k = keyBuffer.shift();
  if (k === undefined) {
    return;
  }
  if (state === 'PAUSED') {
    if (k.key === ' ') {
      state = 'RUNNING';
    }
    return;
  }
  lastXSpeed = xSpeed;
  lastYSpeed = ySpeed;
  if (state === 'START') {
    start();
  } else if (k.key === ' ') {
    state = 'PAUSED';
  } else if (k.keyCode === UP_ARROW) {
    xSpeed = 0;
    ySpeed = -1;
  } else if (k.keyCode === DOWN_ARROW) {
    xSpeed = 0;
    ySpeed = 1;
  } else if (k.keyCode === LEFT_ARROW) {
    xSpeed = -1;
    ySpeed = 0;
  } else if (k.keyCode === RIGHT_ARROW) {
    xSpeed = 1;
    ySpeed = 0;
  }
}

function setup() {
  createCanvas(gridWidth * s, gridHeight * s);
  frameRate(fps);
  noCursor();
  state = 'START';
}

function start() {
  ellipseMode(CORNER);
  // start in a random position, with some padding
  var padding = .5;
  bombs = [];
  snake = [{
    x: round(random(gridWidth * padding, gridWidth * (1-padding))),
    y: round(random(gridWidth * padding, gridHeight * (1-padding)))
  }];
  explodeFrame = 0;
  startHue = round(random(1, 100));

  // start in a random direction
  xSpeed = round(random(-1, 1));
  ySpeed = xSpeed === 0 ? [-1, 1][round(random())] : 0;

  lastXSpeed = xSpeed;
  lastYSpeed = ySpeed;

  food = randPos();

  state = 'RUNNING';
}

function randPos() {
  var avoid = [snake, bombs];
  pos = constrainPoint({
    x: floor(random() * gridWidth),
    y: floor(random() * gridHeight)
  });
  // check for collision with point-arrays we want to avoid
  for (var i=0; i<avoid.length; i++) {
    if (checkCollision(pos, avoid[i])) {
      return randPos();
    }
  }
  return pos
}

function constrainPoint(point) {
  x = constrain(point.x, 0, (width / s) - 1);
  y = constrain(point.y, 0, (height / s) - 1);
  return {x: x, y: y};
}

function draw() {
  background(51);
  nextKeyPress();

  if (state === 'START') {
    fill('white');
    textSize(32);
    textAlign(CENTER, CENTER);
    text('Press any key to start!', 0, 0, width, height);
    return;
  }

  if (state === 'GAME_OVER') {
    fill('red');
    textSize(32);
    textAlign(CENTER, CENTER);
    text('GAME OVER', 0, 0, width, height);
    return;
  }

  if (state === 'PAUSED') {
    textSize(32);
    textAlign(CENTER, CENTER);
    text('PAUSED', 0, 0, width, height);
    return;
  }

  drawBombs();

  var head = snake[snake.length-1];
  var neck = snake[snake.length-2];
  var tail = snake[0];

  if (state === 'EXPLODE') {
    // Make the snake's head a bit more explosive
    if (explodeFrame === 0) {
      for (var i=0; i<9-snake.length; i++) {
        snake.push({x: head.x, y: head.y});
      }
    }
    allowKeyPress = false;
    xSpeed = 0;
    ySpeed = 0;
    if (explodeFrame > (explodeTime * fps)) {
      gameOver();
      return;
    }
    explodeFrame++;
    for (var i=0; i<snake.length; i++) {
      if (!snake[i].explodeDir) {
        snake[i].explodeDir = randDir();
      }
      snake[i].x += snake[i].explodeDir.x;
      snake[i].y += snake[i].explodeDir.y;
    }
    drawSnake();
    return;
  }

  // calculate new head position
  var newPos = {
    x: head.x + xSpeed,
    y: head.y + ySpeed
  }

  // prevent double-backing on ourselves
  if (neck && newPos.x == neck.x && newPos.y == neck.y) {
    ySpeed = lastYSpeed;
    xSpeed = lastXSpeed;
    newPos.x = head.x + xSpeed;
    newPos.y = head.y + ySpeed;
  }

  // check if snake has collided with a wall, itself, or a bomb
  if (outOfBounds(newPos) || checkCollision(newPos, snake) || checkCollision(newPos, bombs)) {
    state = 'EXPLODE';
    return;
  }

  // check if we've eaten a piece of food
  if (head.x == food.x && head.y == food.y) {
    food = randPos();
    if (random() < bombProbability) {
      bombs.push(randPos());
    }
  } else {
    // remove the tail if we haven't eaten anything
    snake.shift();
  }


  // add the head
  snake.push({
    x: newPos.x,
    y: newPos.y
  })

  drawSnake();
  drawFood();
}

function drawSnake() {
  colorMode(HSB, 100);
  for (var i=0; i<snake.length; i++) {
    fill(getHue(i), 100, 100);
    rect(snake[i].x * s, snake[i].y * s, s, s);
  }
  colorMode(RGB, 255);
}

function drawFood() {
  colorMode(HSB, 100);
  fill(getHue(snake.length), 100, 100);
  rect(food.x * s, food.y * s, s, s);
  colorMode(RGB, 255);
}

function drawBombs() {
  var x, y;
  for (var i=0; i<bombs.length; i++) {
    x = bombs[i].x * s;
    y = bombs[i].y * s;
    stroke('red');
    fill(0);
    triangle(x + (s/2), y, x, y+s, x+s, y+s);
    noStroke();
    fill('red');
    textSize(s*.85);
    textAlign(CENTER, BASELINE);
    text('!', x+(s/2), y+s);
    stroke(0);
  }
}

function randDir() {
  var dir = {
    x: round(random(-1, 1)),
    y: round(random(-1, 1))
  }
  if (dir.x === 0 && dir.y === 0) {
    return randDir();
  }
  return dir;
}

function getHue(n) {
  return (startHue + (n * hueStep)) % 100;
}

function outOfBounds(point) {
  return point.x < 0 || point.x >= gridWidth || point.y < 0 || point.y >= gridHeight;
}

function checkCollision(pos, points) {
  for (var i=0; i<points.length; i++) {
    if (points[i].x == pos.x && points[i].y == pos.y) {
      return true;
    }
  }
  return false;
}

function gameOver() {
  allowKeyPress = false;
  state = 'GAME_OVER';
  setTimeout(function() {
    state = 'START';
    allowKeyPress = true;
  }, 3000);
}
