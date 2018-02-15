// customizations
var DIA       = 4;      // diameter of the original firework
var RES       = 20;     // resolution of the texts
var FPS       = 30;     // framerate
var NOISE     = 0.1;    // the amount of randomness
var CONTOUR   = false;  // contour mode toggle

// initializations
var texts;              // array of texts to be displayed
var firework;           // an instance of Firework
var textsConverted = []; // array of converted texts
var querystring = findGetParameter("msg"); // the whole string after '?' in url

if (querystring) {
  // split the string into an array with a space ' '
  // decodeURI decodes (converts to a normal string) the uri
  texts = querystring.split(' ');
  // modifies the title with first text
  document.title = "Firewords - "+texts[0];
} else {                // when querystring is empty ("")
  texts = ["Hello", "Bonjour", "Hola", "Ciao", "Hallo", "Здравствуйте", "你好", "こんにちは", "안녕하세요", "مرحبا", "नमस्ते"];
  shuffle(texts);       // shuffles the order of the texts
}

function setup() {

  // basic setup
  createCanvas(windowWidth, windowHeight);
  frameRate(FPS);
  colorMode(HSB, 255);  // changes color mode

  // converts texts to textsConverted
  pixelDensity(1);      // turns pixel scaling off
  // iterates all k texts
  for (var k = 0; k < texts.length; k++) {
    var pg = createGraphics(ceil(1000*RES/15), ceil(50*RES/15)); // temporary graphics buffer
    append(textsConverted, []);  // append new array for text k
    pg.background(0);           // sets background 0,0,0,0
    pg.fill(255);               // sets fill 255,255,255,255
    pg.textSize(RES);
    pg.textAlign(CENTER);
    pg.text(texts[k], pg.width/2, 2*RES);
    pg.loadPixels();
    for (var i = 1; i < pg.width - 1; i++) {        // iterate row i, skipping both ends
      for (var j = 1; j < pg.height - 1; j++) {     // iterate column j, skipping both ends
        var idx = 4 * (j * pg.width + i);           // index of the pixel (i, j)
        if (CONTOUR) {
          // checks the edges/contour based on brightness
          if (pg.pixels[idx+2] > 0 &&               // (i, j) is non-black
              (pg.pixels[idx-2] == 0                // (i-1, j) is black
            || pg.pixels[idx+6] == 0                // (i+1, j) is black
            || pg.pixels[idx+2-pg.width*4] == 0     // (i, j-1) is black
            || pg.pixels[idx+2+pg.width*4] == 0)) { // (i, j+1) is black
            // scales the coordinates and appends to the array
            append(textsConverted[k], [(i-pg.width/2)*4/RES, (j-1.5*RES)*4/RES, 255]);
          }
        } else {
          if (pg.pixels[idx+2] > 0) {               // checks all non-black pixels
            // scales the coordinates and appends the coordinate to the text array k
            append(textsConverted[k], [(i-pg.width/2)*4/RES, (j-1.5*RES)*4/RES, pg.pixels[idx+2]]);
          }
        }
      } // ends for j
    } // ends for i
  } // ends for k
  pixelDensity(displayDensity());                   // turns pixel scaling back on

  // setting background here reduces delay
  background(0);
 
  // creates an instance of Firework and stores in firework
  firework = new Firework(createVector(width/2, height),  // center of the bottom
    DIA,
    DIA,
    color(255),                   // color starts with white
    createVector(0, -height/FPS/1.5),
    createVector(0, height/FPS/300),
    FPS);                       // 2 seconds before explosion
  print(color(10,20,1030).levels);
}

function draw() {
  // background with alpha
  fill(0, 50);
  rect(0, 0, width, height);

  // resets the firework if dead
  if (!firework.update()) {
    firework.reset(createVector(width/2, height), // center of the bottom
      createVector(random(-width/FPS/6, width/FPS/6),random(-height/FPS/1.5, -height/FPS/2)),
      color(random(0,255), random(200,255), random(200,255)), // random saturated and bright color
      FPS); 
  }
  // display the firework
  firework.display();
}

function windowResized() {
  // dynamically adjusts the canvas size when window resized
  resizeCanvas(windowWidth, windowHeight);
}

// Firework class
function Firework(position, diameter, maxDiameter, fcolor, velocity, acceleration, frameToExplode, shaped=true) {
  this.p          = position;
  this.d          = diameter;
  this.md         = maxDiameter;
  this.c          = fcolor;
  this.v          = velocity;
  this.a          = acceleration;
  this.fte        = frameToExplode; // number of frames before explosion
  this.shaped     = shaped;         // whether or not its children should be shaped
  this.exploded   = false;          // whether or not the firework is exploded
  this.explosions = []              // an array of child fireworks
  this.fc         = 0;              // framecount since start
  this.idx        = 0;              // the index of text to display

  // reset the firework
  this.reset = function(position, velocity, fcolor, frameToExplode) {
    // increment index until the last text
    if (this.idx < textsConverted.length - 1) {
      this.idx = this.idx + 1;      // increment the index
    } else {
      this.idx = 0;                 // reset the index
    }
    // reset based on parameters
    this.p = position;
    this.v = velocity;
    this.c = fcolor;
    this.fte = frameToExplode;
    // reset default values
    this.fc = 0;
    this.exploded = false;
  }

  // handle firework explosion
  this.explode = function() {
    // compares with the max diameter
    // explodes if large enough
    if (this.d > this.md*0.6) {
      // explodes based on shape
      if (this.shaped) {
        // iterates all coordinates in the converted text
        for (var i = 0; i < textsConverted[this.idx].length; i++) {
          var explosionColor = color(hue(this.c), saturation(this.c), textsConverted[this.idx][i][2]+100);
          // append child firework based on the converted text coordinates
          append(this.explosions,
            new Firework(createVector(this.p.x, this.p.y),  // explosions start from the position of the exploded firework
              this.d*3/4,           // diameter becomes 3/4
              this.md,              // max diameter remains the same
              explosionColor,
              // velocity based on the height, fps and fte
              createVector((textsConverted[this.idx][i][0]+random(-NOISE,NOISE))*height/FPS/this.fte,(textsConverted[this.idx][i][1]-5+random(-NOISE,NOISE))*height/FPS/this.fte),
              this.a,               // acceleration remains the same
              this.fte,             // frame to explode remains the same
              false));              // next generation of explosions unshaped
        } // ends for i
      // explodes at random
      } else {
        // explodes into random number of child fireworks
        for (var i = 0; i < this.fte/random(5,15); i++) {
          var scale;
          if (width > height) {
            scale = height;
          } else {
            scale = width;
          }
          var vx = random(-scale/FPS/8,scale/FPS/8);
          var vy = random(-scale/FPS/5,scale/FPS/20);
          // regenerates vx and vy if not within a circle
          while (dist(vx, vy, 0, scale/FPS/20-scale/FPS/5) > 5) {
            var vx = random(-scale/FPS/8,scale/FPS/8);
            var vy = random(-scale/FPS/5,scale/FPS/20);
          }
          append(this.explosions,
            new Firework(createVector(this.p.x, this.p.y),  // explosions start from the position of the exploded firework
              this.d*3/4,           // diameter beomces 3/4
              this.md,              // max diameter remains the same
              this.c,               // color remains the same
              createVector(vx, vy), // randomly generated velocity within a circle
              this.a,               // acceleration remains the same
              this.fte,             // frame to explode remains the same
              false));              // next generation of explosions unshaped
        } // ends for i
      } // ends for else
      // signals explosion successful
      return true;
    // signals explosion fails if too small
    } else {
      return false;
    }
  }

  // updates the firework
  this.update = function() {
    // not exploded
    if (!this.exploded) {
      if (this.d < this.md*0.6) {
        // dims the color
        this.c = color(hue(this.c), saturation(this.c), brightness(this.c), alpha(this.c)-255/FPS);
      }
      this.fc = this.fc + 1;        // increments the framecount
      this.v.add(this.a);           // updates velocity based on acceleration
      this.p.add(this.v);           // updates position based on velocity
      // ready to explode
      if (this.fc > this.fte) {
        // explosion successful
        if (this.explode()) {
          // updates explosion status
          this.exploded = true;
          // signals update successful
          return true;
        // explosion fails
        } else {
          // signals the death
          return false;
        }
      }
    // exploded
    } else {
      // resets dead to true
      var dead = true;
      // iterates all child fireworks
      for (var i = 0; i < this.explosions.length; i++) {
        // if any of the child firework updates successfully
        if(this.explosions[i].update()) {
          // still not dead
          dead = false;
        }
      }
      // all child fireworks are dead
      if (dead) {
        // clear the child fireworks
        this.explosions = [];
        // signals the death
        return false;
      }
    } // end else
    // signals update successful
    return true;
  }

  // displays the firework or its offsprings
  this.display = function() {
    // not exploded
    if (!this.exploded) {
      // display this firework
      noStroke();
      fill(this.c);
      ellipse(this.p.x, this.p.y, this.d, this.d);
    // exploded
    } else {
      // displays all child fireworks
      for (var i = 0; i < this.explosions.length; i++) {
        this.explosions[i].display();
      }
    }
  }
}


// shuffles array in place.
// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

// get parameter by name
// https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

if (/micromessenger/.test(navigator.userAgent.toLowerCase())) {
  var titles = ['原来烟花还可以这么玩...', '过年啦，我想用烟花对你说...', '新年新玩法，用烟花拜年...']
  document.title = titles[Math.floor((Math.random() * 2))];
}

function apply() {
  if (document.getElementById("msg").value) {
    window.location.search = "msg="+document.getElementById("msg").value;
  } else {
    document.getElementById("edit").style.display = "block";
    document.getElementById("editor").style.display = "none";
    document.getElementsByTagName("canvas")[0].style.filter = "none";
  }
}

function edit() {
  document.getElementById("edit").style.display = "none";
  document.getElementById("editor").style.display = "block";
  document.getElementsByTagName("canvas")[0].style.filter = "blur(5px)";
  document.getElementById("msg").select();
}

document.getElementById("msg").addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode == 13) {
      document.getElementById("apply").click();
    }
});
