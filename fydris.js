//run the some function on a grid
function gridSome(grid, func) {
  return grid.some((row, rowNum) => {
    return row.some((cell, colNum) => {
      return func(cell, rowNum, colNum)
    })
  })
}

//run the for each function on a grid
function gridForEach(grid, func) {
  grid.forEach((row, rowNum) => {
    row.forEach((cell, colNum) => {
      func(cell, rowNum, colNum);
    });
  });
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 40;
const BUFFER_ZONE_HEIGHT = 20; //tetris guideline
//pixels per cell
const CELL_SIZE = 30;
//amount of tetros you can see in advance, tetris guideline
const NEXT_SIZE = 6;
const MAX_LEVEL = 15; //tetris guideline
const FIXED_GOAL = 10; //lines per level
const AUTO_REPEAT_FREQ = 50; //tetris guideline
const AUTO_REPEAT_DELAY = 300; //tetris guideline

const LOCKDOWN_TIME = 500; //tetris guideline for ext. lockdown
const LOCKDOWN_MOVE_LIMIT = 15; //tetris guideline for ext. lockdown

const LEFT_MARGIN = 8 * CELL_SIZE;
const RIGHT_MARGIN = 8 * CELL_SIZE;

const DIRECTION = {
  NONE: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
  DOWN: 4,
  CLOCKWISE: 5,
  ANTI_CLOCKWISE: 6
};

const COLOUR = {
  ALMOST_WHITE: [200, 200, 200],
  RED: [209, 41, 0],
  ORANGE: [209, 121, 0],
  YELLOW: [209, 205, 0],
  GREEN: [0, 209, 66],
  LIGHT_BLUE: [0, 209, 209],
  BLUE: [0, 62, 209],
  PURPLE: [128, 0, 209],
  MAGENTA: [255, 0, 255],
  NIGHT: [34, 34, 41],
  GRAY: [90, 90, 90],
  LIGHT_GRAY: [160, 160, 160],
  ALMOST_BLACK: [35, 35, 35]
};

const KEY = {
  W: ('W').charCodeAt(0),
  S: ('S').charCodeAt(0),
  A: ('A').charCodeAt(0),
  D: ('D').charCodeAt(0),
  Q: ('Q').charCodeAt(0),
  E: ('E').charCodeAt(0),
  R: ('R').charCodeAt(0),
  C: ('C').charCodeAt(0),
  P: ('P').charCodeAt(0),
  SPACE: (' ').charCodeAt(0)
};

const STATE = {
  NONE: 0,
  MENU: 1,
  PAUSED: 2,
  PLAYING: 3,
  GAME_OVER: 4,
  GAME_END: 5
};

const MOVE = {
  NONE: 0,
  TSPIN: 1,
  TSPIN_MINI: 2
};

class Tetro {
  constructor(colour, grid, srsObj) {
    this.rotations = [];
    this.colour = colour;
    
    //the given grid will be rotation[0] of the Tetro
    this.rotations[0] = grid;

    //private function for generating the rotations of the tetro
    //around srs point 1
    const rotateGrid = function(grid, direction) {
      const newGrid = []; //will hold all the new rows
      const oldWidth = grid[0].length;
      const oldHeight = grid.length;
        
      for (let y = 0; y < oldWidth; ++y) {
        const newRow = []; //first row of the new shape
  
        for (let x = 0; x < oldHeight; ++x) {
          if (direction == DIRECTION.CLOCKWISE) {
            newRow[x] = grid[oldHeight - x - 1][y];
          }
          else { //rotate anti-clockwise
            newRow[x] = grid[x][oldWidth - y - 1];
          }
        }
        //add the new row
        newGrid[y] = newRow;
      }
  
      return newGrid
    };

    //generate the other 3 rotations
    for(let i = 0; i < 3; ++i) {
      this.rotations.push(rotateGrid(this.rotations[i], DIRECTION.CLOCKWISE));
    }

    this.rotations[0].points = srsObj.NORTH;
    this.rotations[1].points = srsObj.EAST;
    this.rotations[2].points = srsObj.SOUTH;
    this.rotations[3].points = srsObj.WEST;
  }
}


//defines a tetro that can be moved and spun by the player
class ActiveTetro {
  constructor(tetro = TETRO.iShape) {
    this.tetro = tetro;
    this.pos = { row: 19, col: BOARD_WIDTH / 2 - 1 };
    this.orientation = 0;
    this.grid = this.tetro.rotations[this.orientation];

    //make sure that the l piece is centered
    if (this.tetro == TETRO.iShape) {
      this.pos.col = BOARD_WIDTH / 2 - 2;
    }
  }
}


class TetroBag {
  constructor() {
    this.bag = [];
    this.fillBag();
  }

  
  fillBag() {
    this.bag = Object.values(TETRO);

    //shuffle the bag
    for (let i = this.bag.length - 1; i > 0; --i) {
      const r = Math.floor(Math.random() * i);
      [this.bag[i], this.bag[r]] = [this.bag[r], this.bag[i]];
    }
  }


  take() {
    if (this.bag.length === 0) {
      this.fillBag();
    }

    return this.bag.shift()
  }
}


class SRSPoint {
  constructor(rowOffset, colOffset) {
    this.row = rowOffset;
    this.col = colOffset;
  }
}


const TETRO = {
  iShape: new Tetro(COLOUR.LIGHT_BLUE, [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  { //Offsets for SRS Points
    NORTH: [
      [1, 0], //point 2
      [1, 3], //point 3
      [1, 0], //point 4
      [1, 3]  //point 5
    ],

    EAST: [
      [1, 2],
      [1, 2],
      [0, 2],
      [3, 2]
    ],

    SOUTH: [
      [1, 3],
      [1, 0],
      [2, 3],
      [2, 0]
    ],

    WEST: [
      [1, 1],
      [1, 1],
      [3, 1],
      [0, 1]
    ]
  }),

  jShape: new Tetro(COLOUR.BLUE, [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ], {
    NORTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    EAST: [
      [1, 2],
      [2, 2],
      [-1, 1],
      [-1, -2]
    ],

    SOUTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    WEST: [
      [0, 1],
      [2, 0],
      [-1, 1],
      [-1, 0]
    ]
  }),

  lShape: new Tetro(COLOUR.ORANGE, [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ], {
    NORTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    EAST: [
      [1, 2],
      [2, 2],
      [-1, 1],
      [-1, 2]
    ],

    SOUTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    WEST: [
      [1, 0],
      [2, 0],
      [-1, 1],
      [-1, 0]
    ]
  }),

  oShape: new Tetro(COLOUR.YELLOW, [
    [1, 1],
    [1, 1]
  ], {
    NORTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    EAST: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    SOUTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    WEST: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ]
  }),

  sShape: new Tetro(COLOUR.GREEN, [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ], {
    NORTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    EAST: [
      [1, 2],
      [2, 2],
      [-1, 1],
      [-1, 2]
    ],

    SOUTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    WEST: [
      [1, 0],
      [2, 0],
      [-1, 1],
      [-1, 0]
    ]
  }),

  tShape: new Tetro(COLOUR.PURPLE, [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ], {
    NORTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    EAST: [
      [1, 2],
      [2, 2],
      [-1, 1],
      [-1, 2]
    ],

    SOUTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    WEST: [
      [1, 0],
      [2, 0],
      [-1, 1],
      [-1, 0]
    ]
  }),

  zShape: new Tetro(COLOUR.RED, [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ], {
    NORTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    EAST: [
      [1, 2],
      [2, 2],
      [-1, 1],
      [-1, 2]
    ],

    SOUTH: [
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1]
    ],

    WEST: [
      [1, 0],
      [2, 0],
      [-1, 1],
      [-1, 0]
    ]
  })
};

//return the 4 tSpin points based on the orientation
//given. Only needs to be called when precomputing the points
function getTPoints(orientation) {
  let p = [ //MAYBE CHANGE THIS TO CONST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    [0, 0], //A
    [0, 2], //B
    [2, 2], //C
    [2, 0]  //D
  ];

  //because the tspin points are the corners of a grid
  //rotating them is just the same as cycling their position
  for (let i = 0; i < orientation; ++i) {
    [p[0], p[1], p[2], p[3]] = [p[1], p[2], p[3], p[0]];
  }

  return p
}

//precompute all tSpin Points. This should be
//indexed by the t piece's orientation to
//get the points in the right order
const TPOINTS = [
  getTPoints(0),
  getTPoints(1),
  getTPoints(2),
  getTPoints(3)
];


function checkTPoints(board, pos, orientation) {
  const tPoints = TPOINTS[orientation];
  const freePoints = [];

  TPOINTS[orientation].forEach((tPoint, index) => {
    const row = pos.row + tPoint[0];
    const col = pos.col + tPoint[1];

    freePoints[index] = !board[row] || board[row][col] != 0;
  });

  return freePoints
}


class Game {
  constructor() {
    this.gameOver = false;
    this.gameCompleted = false;
    this.ghostOffset = 0;
    this.tetroBag = new TetroBag();
    this.next = [];
    this.holdSlot = null;
    this.score = 0;
    this.moveData = {
      move: MOVE.NONE,
      rows: 0,
      backToBack: false
    };
    this.backToBackStarted = false;
    this.level = 1;
    this.goal = 5;
    this.fallTime = 1; //seconds per line
    this.softDropping = false;

    this.stats = {
      rowsCleared: 0,
      tetrises: 0,
      tSpins: 0,
      tSpinMinis: 0
    };

    this.initBoard();
    this.initNext();
    this.nextTetro();
  }
  
  
  initBoard() {
    this.board = [];
    
    //fill the board with height arrays of length width
    //all filled with zeroes
    for(let y = 0; y < BOARD_HEIGHT; ++y) {
      const row = [];
      
      for(let x = 0; x < BOARD_WIDTH; ++x) {
        row.push(0);
      }
      
      this.board.push(row);
    }
  }
  

  initNext() {
    for(let i = 0; i < NEXT_SIZE; ++i) {
      this.next.push(this.tetroBag.take());
    }
  }


  fall() {
    let newObject = null;

    if (!this.move(DIRECTION.DOWN)) {
      this.lockdown();
      
      newObject = {};
      Object.assign(newObject, this.moveData);

      //reset the move for the next turn
      this.moveData.move = MOVE.NONE;
      this.moveData.rows = 0;
      this.moveData.backToBack = 0;
    }

    return newObject
  }


  //move the tetro to its ghost then fall
  hardDrop() {
    this.score += 2 * this.ghostOffset;

    //move the tetro to its ghost
    this.activeTetro.pos.row += this.ghostOffset;
    this.ghostOffset = 0;
    return this.fall()
  }


  calculateFallSpeed() {
    //algorithm from the tetris guideline
    this.fallTime = Math.pow((0.8 - ((this.level - 1) * 0.007)), this.level - 1);
  }


  isPieceOnSurface() {
    return this.ghostOffset == 0
  }


  lockdown() {
    this.placeTetro();
    
    let rowClears = this.clearFullRows();
    this.moveData.rows = rowClears;
    let moveScore = 0;

    //tracks whether the move contributes to a back to back bonus
    let backToBack = false;

    switch (this.moveData.move) {
      case MOVE.NONE:
        moveScore = [0, 100, 300, 500, 800][rowClears];

        if (rowClears == 4) {
          backToBack = true;
          ++this.stats.tetrises;
        }
        break

      case MOVE.TSPIN_MINI:
        moveScore = [100, 200][rowClears];
        ++this.stats.tSpinMinis;
        backToBack = true;
        break

      case MOVE.TSPIN:
        moveScore = [400, 800, 1200, 1600][rowClears];
        ++this.stats.tSpins;
        backToBack = true;
        break
    }

    let awardedRowClears = Math.floor(moveScore / 100);

    //back to back bonuses only apply if rowsCleared > 0
    if (rowClears > 0) {
      this.moveData.backToBack = this.backToBackStarted && backToBack;
  
      //apply back to back bonuses
      if (this.moveData.backToBack) {
        awardedRowClears = Math.floor(awardedRowClears * 1.5);
        moveScore = Math.floor(moveScore * 1.5);
      }
  
      //t spins with 0 moves don't break back to back
      this.backToBackStarted = backToBack;
    }

    this.score += moveScore * this.level;
    this.stats.rowsCleared += awardedRowClears;

    //needs to be after the rows are cleared so 
    //ghost offset is correct
    this.nextTetro();

    while (!this.gameOver && this.stats.rowsCleared >= this.goal) {
      if (this.level == MAX_LEVEL) {
        this.gameOver = true;
        this.gameCompleted = true;
      }
      else {
        ++this.level;
        this.goal += this.level * 5;
        this.calculateFallSpeed();
      }
    }
  }


  handleMove() {

  }


  tetroFitsOnBoard(tetroGrid, rowPos, colPos) {
    //return !someCell is full
    return !gridSome(tetroGrid, (cell, r, c) => {
      let cellFree = true;
      //if the cell of tetroGrid is not empty
      if (cell) {
        const row = this.board[r + rowPos];
        
        //if row is undefined then the cell won't be checked
        cellFree = row && row[c + colPos] === 0;
      }
  
      return !cellFree
    })
  }


  calculateGhostOffset() {
    const pos = this.activeTetro.pos;
    this.ghostOffset = 0;
    
    while (this.tetroFitsOnBoard(
            this.activeTetro.grid,
            pos.row + this.ghostOffset + 1,
            pos.col)) {
      ++this.ghostOffset;
    }
  }


  clearRow(rowNum) {
    //from the row upwards, copy from the cell above
    for(let r = rowNum; r >= 0; --r) {
      const row = this.board[r];
      
      row.forEach((cell, cellNum) => {
        let newVal = 0; //empty cell
        
        //if not top row
        if (r != 0) {
          newVal = this.board[r - 1][cellNum];
        }
        
        this.board[r][cellNum] = newVal;
      });
    }
  }


  clearFullRows() {
    let rowsCleared = 0;

    this.board.forEach((row, rowNum) => {
      const emptyFound = row.some(cell => cell == 0);

      if (!emptyFound) {
        this.clearRow(rowNum);        
        ++rowsCleared;
      }
    });

    return rowsCleared
  }


  nextTetro() {
    const newTetro = new ActiveTetro(this.next.shift());
    this.next.push(this.tetroBag.take());

    if (this.tetroFitsOnBoard(newTetro.tetro.rotations[0],
                              newTetro.pos.row,
                              newTetro.pos.col)) {
      this.activeTetro = newTetro;
    } else {
      this.gameOver = true;
    }

    this.calculateGhostOffset();
    this.canHold = true;
  }


  holdTetro() {
    const success = this.canHold;

    if (this.canHold) {
      if (this.holdSlot) {
        [this.holdSlot, this.activeTetro] = [this.activeTetro.tetro, 
                                             new ActiveTetro(this.holdSlot)];

        this.calculateGhostOffset();
      } else {
        this.holdSlot = this.activeTetro.tetro;
        this.nextTetro();
      }
      
      this.canHold = false;
    }

    return success
  }


  spin(direction) {
    const thisTetro = this.activeTetro;
    const pos = thisTetro.pos;
    let spinPossible = false;
    let newOrientation = thisTetro.orientation;

    if (direction === DIRECTION.CLOCKWISE) {
      newOrientation = (newOrientation + 1) % 4;
    }
    else if (direction === DIRECTION.ANTI_CLOCKWISE) {
      --newOrientation;

      if (newOrientation < 0) {
        newOrientation = 3;
      }
    }
    
    const spunGrid = this.activeTetro.tetro.rotations[newOrientation];
    const oldPoints = thisTetro.tetro.rotations[thisTetro.orientation].points;
    const newPoints = thisTetro.tetro.rotations[newOrientation].points;
    let rowTranslate = 0;
    let colTranslate = 0;
    let pointCounter = 0; //index 0 is point 2

    //attempt normal spin by checking if new grid fits on board
    spinPossible = this.tetroFitsOnBoard(spunGrid, pos.row, pos.col);
    
    //for each of the rotation points, until a fit is found
    while (!spinPossible && pointCounter < 4) {
      const oldPoint = oldPoints[pointCounter];
      const newPoint = newPoints[pointCounter];

      rowTranslate = oldPoint[0] - newPoint[0];
      colTranslate = oldPoint[1] - newPoint[1];

      spinPossible = this.tetroFitsOnBoard(spunGrid, pos.row + rowTranslate, 
                                                  pos.col + colTranslate);
      ++pointCounter;
    }
    

    //if a valid spin was found apply it
    if (spinPossible) {
      //apply the translation
      thisTetro.pos.row += rowTranslate;
      thisTetro.pos.col += colTranslate;

      //switch to the spunGrid
      thisTetro.orientation = newOrientation;
      thisTetro.grid = spunGrid;
      
      //check for tspin
      if (this.activeTetro.tetro == TETRO.tShape) {
          //these hold a boolean stating whether point a, b, c or d is full
          const [A, B, C, D] = checkTPoints(this.board, thisTetro.pos, newOrientation);

          if (pointCounter == 4 || ((A && B) && (C || D))) {
            this.moveData.move = MOVE.TSPIN;
          }
          else if ((C && D) && (A || B)) {
            this.moveData.move = MOVE.TSPIN_MINI;
          }
      }

    }

    this.calculateGhostOffset();

    return spinPossible
  }


  move(direction) {
    let rowNum = this.activeTetro.pos.row;
    let colNum = this.activeTetro.pos.col;
    let success = false;

    switch(direction) {
      case DIRECTION.LEFT:
        --colNum;
        break

      case DIRECTION.RIGHT:
        ++colNum;
        break

      case DIRECTION.DOWN:
        if (this.softDropping) {
          ++this.score;
        }
        ++rowNum;
        break
    }

    //when moving down, always successful unless the piece is in
    //the same place as its ghost
    if (direction != DIRECTION.DOWN) {
      success = this.tetroFitsOnBoard(this.activeTetro.grid, rowNum, colNum);
    }
    else {
      if (this.ghostOffset != 0) {
        success = true;

        //when moving down, the ghost offset just needs to decrease by 1
        --this.ghostOffset;
      }
    }
    
    //actually move the piece if the move is allowed
    if (success) {
      this.activeTetro.pos.row = rowNum;
      this.activeTetro.pos.col = colNum;
      this.calculateGhostOffset();
    }

    return success
  }


  placeTetro() {
    gridForEach(this.activeTetro.grid, (cell, r, c) => {
      if(cell) {
        const rowPos = r + this.activeTetro.pos.row;
        const colPos = c + this.activeTetro.pos.col;
        const colour = this.activeTetro.tetro.colour;
        const colourIndex = Object.values(COLOUR).indexOf(colour);

        this.board[rowPos][colPos] = colourIndex;
      }
    });
  }
}

class Notif {
  constructor(text, maxSize, growTime = 80, holdTime = 768) {
    this.text = text;
    this.maxSize = maxSize;
    this.growTime = growTime;
    this.holdTime = holdTime;
    this.animDuration = growTime * 2 + holdTime;
    this.size = 0;
    this.time = 0;
    this.finished = false;
  }


  update(frameTime) {
    this.time += frameTime;

    if (this.time < this.growTime) { //grow
      this.size = Math.floor((this.time / this.growTime) * this.maxSize);
    }
    else if (this.time < this.growTime + this.holdTime) { //hold
      this.size = this.maxSize;
    }
    else if (this.time < this.animDuration) { //shrink
      const time = this.time - (this.growTime + this.holdTime);

      this.size = this.maxSize - Math.floor(time / this.growTime * this.maxSize);
    }
    else {
      this.finished = true;
    }
  }
  
}

//auto pause if the focus moves from the game
window.onblur = () => {
  if (state == STATE.PLAYING) {
    state = STATE.PAUSED;
  }
};


//fix for the weird p5js thing where returning
//false for a key doesn't stop default behaviour
//if it's held down. Look into this
window.addEventListener("keydown", function(e) {
  // space and arrow keys
  if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
  }
}, false);

const FLARGE = 100;
const XLARGE = 80;
const LARGE = 65;
const MEDIUM = 50;
const SMALL = 35;

const centerX = LEFT_MARGIN + (BOARD_WIDTH * CELL_SIZE) / 2;

let lastFallTime = 0;
let lastFrameDrawTime = 0;
let state = STATE.MENU;
let displayScore = 0;
let currentTime = 0;
let frameTime = 0;
let game = null;

const autoRepeats = [];
let autoRepeatStartTime = 0;
let lastAutoRepeatTime = 0;

let lockdownTimer = 0;
let lockdownCounter = 0;
let lockdownStarted = false;
let lockdownRow = 0;

let font = null;

const sound = {};
const notifs = [];

//DEBUG
let lastMove = "";


function preload(){
  const soundRes = 'fydris/resources/sounds';
  soundFormats("wav");

  //sound.move = loadSound(`${soundRes}/move.wav`)
  // sound.rotateA = loadSound(`${soundRes}/rotateA.wav`)
  // sound.rotateC = loadSound(`${soundRes}/rotateC.wav`)
  // sound.hold = loadSound(`${soundRes}/hold.wav`)

  // sound.single = loadSound(`${soundRes}/single.wav`)
  // sound.double = loadSound(`${soundRes}/double.wav`)
  // sound.triple = loadSound(`${soundRes}/triple.wav`)

  // sound.tetris = loadSound(`${soundRes}/tetris.wav`)
  // sound.tetrisBTB = loadSound(`${soundRes}/tetrisBTB.wav`)

  // sound.tSpin = loadSound(`${soundRes}/tSpin.wav`)
  // sound.tSpinBTB = loadSound(`${soundRes}/tSpinBTB.wav`)

  font = loadFont("fydris/resources/CT ProLamina.ttf");
}


function setup() {
  const canvas = createCanvas(CELL_SIZE * BOARD_WIDTH + LEFT_MARGIN + RIGHT_MARGIN, 
                              CELL_SIZE * (BOARD_HEIGHT - BUFFER_ZONE_HEIGHT ));
  
  canvas.parent("game");

  textFont(font);
  strokeWeight(2);

  lastFallTime = millis();
  game = new Game();
}


function draw() {
  currentTime = Math.floor(millis());
  frameTime = currentTime - lastFrameDrawTime;

  lastFrameDrawTime += frameTime;

  //update the displayed score
  if (displayScore < game.score) {
    displayScore += frameTime * game.level;

    if (displayScore > game.score) {
      displayScore = game.score;
    }
  }

  switch(state) {
    case STATE.MENU:
      drawMenu();
      break

    case STATE.PLAYING:
      //track the time passed
      const timeSinceLastFall = lastFrameDrawTime - lastFallTime;
      
      //the amount of time until the fall. / by 20 if softDropping
      const fallTime = game.fallTime * 1000 / (game.softDropping ? 20 : 1);
      
      autoRepeat(currentTime);
    
      if (lockdownStarted) {
        lockdownTimer += frameTime;
        
        //disable lockdown if on the new lowest row
        if (!game.isPieceOnSurface() && game.activeTetro.pos.row > lockdownRow) {
          lockdownStarted = false;
        }
      }

      if (game.gameOver) {
        state = game.gameCompleted ? STATE.GAME_END : STATE.GAME_OVER;
      }
      else if (lockdownStarted) { //lockdown has higher priority than fall timer
        if (lockdownTimer >= LOCKDOWN_TIME || 
          lockdownCounter >= LOCKDOWN_MOVE_LIMIT) {
          handleMoveData(game.fall());
          lockdownStarted = false;
          lastFallTime = lastFrameDrawTime;
        }
      }
      else if (timeSinceLastFall >= fallTime) { //fall timer
        handleMoveData(game.fall());
        checkLockdown();
        lastFallTime = lastFrameDrawTime;
      }

      drawGame();
      break

    case STATE.PAUSED:
      drawPauseMenu();
      break

    case STATE.GAME_OVER:
      drawGameOverScreen();
      break

    case STATE.GAME_END:
      drawGameEndScreen();
      break
  }
}


function keyPressed() {
  //array of keys to ignore default behaviour
  const annoyingKeys = [KEY.SPACE, UP_ARROW, DOWN_ARROW];
  //if returnval is false, browser ignores default behaviour like scrolling
  let returnVal = !annoyingKeys.includes(keyCode);
  
  //stop keys being logged twice
  if (state == STATE.PLAYING) {
    //for non-ascii keys
    switch(keyCode) { 
      case KEY.A:
      case LEFT_ARROW:
        moveAttempt(DIRECTION.LEFT);
        break
  
      case KEY.D:
      case RIGHT_ARROW:
        moveAttempt(DIRECTION.RIGHT);
        break
  
      case KEY.S:
      case DOWN_ARROW:
        game.softDropping = true;
        break

      case KEY.E:
      case KEY.W:
      case UP_ARROW:
        game.spin(DIRECTION.CLOCKWISE);
        //sound.rotateC.play()
        checkLockdown();
        break
      
      case KEY.Q:
        game.spin(DIRECTION.ANTI_CLOCKWISE);
        //sound.rotateA.play()
        checkLockdown();
        break
      
      case KEY.C:
        const holdWorked = game.holdTetro();
        
        if (holdWorked) {
          //sound.hold.play()
          lockdownStarted = false;
          lastFallTime = currentTime;
        }
        break
      
      case KEY.P:
        state = STATE.PAUSED;
        break
      
      case KEY.SPACE:
        handleMoveData(game.hardDrop());
        lastFallTime = currentTime;
        lockdownStarted = false;
        break
    }
  }
  else if (state == STATE.MENU) {
    switch (keyCode) {
      case ENTER:
        state = STATE.PLAYING;
        break
    }
  }
  else if (state == STATE.PAUSED) {
    switch (keyCode) {
      case KEY.P:
        state = STATE.PLAYING;
        break

      case KEY.R:
        newGame();
        break
    }
  }
  else if (state == STATE.GAME_OVER) {
    switch(keyCode) {
      case KEY.R:
        newGame();
        break
    }
  }
  else if (state == STATE.GAME_END) {
    switch(keyCode) {
      case KEY.R:
        newGame();
        break
    }
  }

  return returnVal
}


function keyReleased() {
  const autoRepeatKeys = [KEY.A, KEY.D, LEFT_ARROW, RIGHT_ARROW];

  switch(keyCode) {
    case KEY.A:
    case LEFT_ARROW:
      autoRepeatEnd(DIRECTION.LEFT);
      break

    case KEY.S:
    case DOWN_ARROW:
      game.softDropping = false;
      break

    case KEY.D:
    case RIGHT_ARROW:
      autoRepeatEnd(DIRECTION.RIGHT);
      break
  }
}


function moveAttempt(direction) {
  //only update lockdown if the move was successful, otherwise
  //this will tick down the lockdownCounter even when the piece
  //isn't moving, resulting in an unexpected place
  if (game.move(direction)) {
    checkLockdown();
  }

  //sound.move.play()

  if (!autoRepeats.includes(direction)) {
    autoRepeats.unshift(direction);
    autoRepeatStartTime = currentTime;
  }
  else {
    lastAutoRepeatTime = currentTime;
  }
}


function handleMoveData(moveData) {
  if (moveData) {
    //attempt to make the piece fall and record the move
    const {move, rows, backToBack} = moveData;
    const moveName = ["", "T-Spin ", "T-Spin Mini "][move];
    const rowName = ["", "Single", "Double", "Triple", "Tetris"][rows];
    let string = `${backToBack ? "Back to Back\n" : ""} ${moveName}${rowName}`.trim();
  
    // if (move === 0) {
    //   if (rows === 4) {
    //     (backToBack ? sound.tetris : sound.tetrisBTB).play()
    //   }
    //   else if (rows > 0){
    //     [sound.single, sound.double, sound.triple][rows - 1].play()
    //   }
    // } else {
    //   (backToBack ? sound.tSpin : sound.tSpinBTB).play()
    // }

    if (string != "") {
      notifs.push(new Notif(string, LARGE));
    }
  }
}


function checkLockdown() {
  if (lockdownStarted) {
    lockdownTimer = 0;
    ++lockdownCounter;
  }
  else if (game.isPieceOnSurface()) {
    lockdownStarted = true;
    lockdownCounter = 0;
    lockdownTimer = 0;
    lockdownRow = game.activeTetro.pos.row;
  }
}


function autoRepeat(time) {
  const direction = autoRepeats[0];
  //if a movement input should be repeated
  if (direction) {
    const timeSinceKeyHeld = time - autoRepeatStartTime;

    if (timeSinceKeyHeld >= AUTO_REPEAT_DELAY) {
      const timeSinceLastRepeat = time - lastAutoRepeatTime;

      if (timeSinceLastRepeat >= AUTO_REPEAT_FREQ) {
        moveAttempt(direction);
      }
    }
  }
}


function autoRepeatEnd(direction) {
  autoRepeats.splice(autoRepeats.lastIndexOf(direction), 1);
  
  if (autoRepeats.length != 0) {
    game.move(autoRepeats[autoRepeats.length - 1]);
  }

  autoRepeatStartTime = currentTime;
} 


function newGame() {
  game = new Game();
  state = STATE.PLAYING;
  displayScore = 0;
}


function drawGame() {
  background("#272530");
  stroke(COLOUR.GRAY);
  strokeWeight(2);
  drawBoard();

  //ghost
  noFill();
  stroke(game.activeTetro.tetro.colour.concat(180));
  strokeWeight(3);
  drawTetroOnBoard(game.activeTetro.grid,
    game.activeTetro.pos.row + game.ghostOffset,
    game.activeTetro.pos.col);
    
  //active tetro
  fill(game.activeTetro.tetro.colour);
  stroke(COLOUR.NIGHT);
  drawTetroOnBoard(game.activeTetro.grid,
    game.activeTetro.pos.row,
    game.activeTetro.pos.col);

  //notification
  drawNotification();

  strokeWeight(0);
  textSize(LARGE);
  drawNext();
  drawHold();

  strokeWeight(0);
  drawGameInfo();
}


function drawBoard() {
  for(let rowNum = BUFFER_ZONE_HEIGHT; rowNum < BOARD_HEIGHT; ++rowNum) {
    const row = game.board[rowNum];

    row.forEach((cell, colNum) => {
      if (cell != 0) {
        fill(Object.values(COLOUR)[cell]);
      }
      else {
        fill(COLOUR.NIGHT);
      }
      rect(LEFT_MARGIN + colNum * CELL_SIZE, (rowNum - BUFFER_ZONE_HEIGHT) * CELL_SIZE,
           CELL_SIZE, CELL_SIZE);
    });
  }
}


//draw a tetro on the game board giving the row and position of
//the tetromino
function drawTetroOnBoard(tetroGrid, rowPos, colPos) {
  drawTetro(tetroGrid, 
    LEFT_MARGIN + (colPos * CELL_SIZE),
    CELL_SIZE * (rowPos - BUFFER_ZONE_HEIGHT));
}


function drawTetro(grid, xPos, yPos, scale = 1.0) {
  const size = CELL_SIZE * scale;

  gridForEach(grid, (cell, rowNum, colNum) => {
    if (cell) {
      rect(xPos + colNum * size, //x
           yPos + rowNum * size, //y
           size, size); //x, y size
    }
  });
}


function drawNotification() {
  if (notifs[0]) {
    notifs[0].update(frameTime);

    if (notifs[0].finished) {
      notifs.shift();
    }
    else {
      notifs[0].text.split('\n').forEach((line, index) => {
        fill(COLOUR.ALMOST_WHITE);
        stroke(COLOUR.NIGHT);
        strokeWeight(16);
        textAlign(CENTER);
        textSize(notifs[0].size);
        text(line, centerX, 100 + index * 60);
        textAlign(LEFT);
      });
    }
  }
}


function drawNext() {
  fill(COLOUR.ALMOST_WHITE);
  text("Next", 570, 40);
  strokeWeight(2);

  game.next.forEach((tetro, queuePos) => {
    const grid = tetro.rotations[0];
    const rowPos = 70 + (queuePos * 3) * CELL_SIZE;

    fill(tetro.colour);
    drawTetro(grid, 570, rowPos);
  });

  strokeWeight(0);
}


function drawHold() {
  const hold = game.holdSlot;

  fill(COLOUR.ALMOST_WHITE);
  text("Hold", 80, 40);

  if (hold) {
    strokeWeight(2);
    fill(hold.colour);
    drawTetro(hold.rotations[0], 80, 70);
  }
}

function drawMenu() {
  background("#272530");

  fill(COLOUR.LIGHT_GRAY);
  textAlign(CENTER);
  textSize(FLARGE);
  text("Fydris", centerX, 100);
  textSize(LARGE);
  text("Press ENTER to start", centerX, 500);
  textAlign(LEFT);

  textSize(MEDIUM);
  text("Controls", 150, 220);

  textSize(SMALL);
  text("Move tetro: A/D or LEFT/RIGHT arrows", 150, 260);
  text("Spin tetro: Q/E or UP arrow", 150, 285);
  text("Hold: C", 150, 310);
  text("Instant drop: SPACE", 150, 335);
  text("Pause/resume: P", 150, 360);

}


function drawPauseMenu() {
  textAlign(CENTER);
  fill(COLOUR.ALMOST_WHITE);
  stroke(35);
  strokeWeight(5);
  textSize(LARGE);
  text("Paused", centerX, 150);
  textAlign(LEFT);

  textSize(MEDIUM);
  text("P: Unpause", 270, 200);
  text("R: Restart", 270, 230);
}


function drawGameOverScreen() {
  textAlign(CENTER);
  fill(COLOUR.ALMOST_WHITE);
  stroke(35);
  strokeWeight(5);
  textSize(LARGE);
  text("Game Over", centerX, 150);

  textSize(MEDIUM);
  text("Press R to restart", centerX, 200);
  textAlign(LEFT);
}


function drawGameEndScreen() {
  textAlign(CENTER);
  fill(COLOUR.ALMOST_WHITE);
  stroke(35);
  strokeWeight(6);
  textSize(LARGE);
  text("Contratulations!", centerX, 150);

  textSize(MEDIUM);
  text("Press R to restart", centerX, 200);
  textAlign(LEFT);
}



function drawGameInfo() {
  const leftPos = 20;
  let topPos = 160;

  fill(COLOUR.ALMOST_WHITE);

  textSize(SMALL);
  text(`Score:`, leftPos, topPos);
  textSize(LARGE);
  text(`${displayScore}`, leftPos + 20, topPos + 40);
  textSize(SMALL);
  text(`Level: ${game.level}`, leftPos, topPos + 70);
  text(`Goal: ${game.goal - game.stats.rowsCleared}`, leftPos, topPos + 100);

  topPos += 130;

  text(`Lines: ${game.stats.rowsCleared}`, leftPos, topPos + 30);
  text(`Tetrises: ${game.stats.tetrises}`, leftPos, topPos + 60);
  text(`T-Spin Minis: ${game.stats.tSpinMinis}`, leftPos, topPos + 90);
  text(`T-Spins: ${game.stats.tSpins}`, leftPos, topPos + 120);
}
