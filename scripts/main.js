var map = [/*0 1 2 3 4 5 6 7 8 9*/
			[1,1,1,1,1,1,1,1,1,1], //0
			[1,0,0,0,0,0,0,0,0,1], //1
			[1,0,2,2,2,2,0,0,0,1], //2
			[1,0,0,2,0,0,0,2,2,1], //3
			[1,0,0,0,2,0,0,0,0,1], //4
			[1,0,0,0,0,2,0,0,0,1], //5
			[1,0,0,0,0,2,0,2,2,1], //6
			[1,0,0,0,2,2,0,0,0,1], //7
			[1,0,0,0,0,0,0,0,0,1], //8
			[1,1,1,1,1,1,1,1,1,1], //9
];

//parameters
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	UNITSIZE = 250,
	WALLHEIGHT = UNITSIZE * 1.5;
	MOVESPEED = 100,
	LOOKSPEED = 0.075,
	BULLETMOVESPEED = MOVESPEED * 5,
	NUMAI = 5,
	PROJECTILEDAMAGE = 20,
	MAP_WIDTH = map.length,
	MAP_HEIGHT = map[0].length,
	NUMBER_OF_OPPONENTS = 10,
	OPPONENT_VELOCITY_X = Math.random() * 2 - 1,
	OPPONENT_VELOCITY_Y = Math.random() * 2 - 1,
	OPPONENT_VELOCITY_Z = Math.random() * 2 - 1;

//global variables
var scene, camera, controls, geometry, material, mesh, loader, renderer, clock, backgroundCamera, backgroundScene;
var aiGeo = new THREE.CubeGeometry(120, 120, 120);
var aiGeo2 = new THREE.CylinderGeometry( 1, 40*3, 40*3, 4 );
var canvas, context, score, scoreContext, weapon, weaponContext;
var opponents = [], bullets = [];
var maxHealth = 300;
var mouse = { x: 0, y: 0 }, kills = 0, health = maxHealth;

//health bar
var object1 = {
	x: 20,
	y: 30,
	width: 300,
	height: 20
};

var wandImg = new Image(450,337);
wandImg.src = 'imports/wand.png';
	
$(document).ready(function(){
	$('body').append('<div id="intro" class="custom" >Click to start</div>');
		//health bar
	$('body').append('<canvas id="canvas" width="500"></canvas>');
	$('body').append('<canvas id="score"></canvas>');
	$('body').append('<canvas id="weapon" width="450" height="337" ></canvas>');
	
	$('#intro').css({width: WIDTH, height: HEIGHT}).one('click', function(e) {
		e.preventDefault();
		$(this).fadeOut();
		init();
		animate();
	});
});

//window resizing
$(window).resize(function() {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	ASPECT = WIDTH / HEIGHT;
	if (camera) {
		camera.aspect = ASPECT;
		camera.updateProjectionMatrix();
	}
	
	if (renderer) {
		renderer.setSize(WIDTH, HEIGHT);
	}
	$('#intro, #hurt').css({width: WIDTH, height: HEIGHT,});
});

function  init(){

	clock = new THREE.Clock();
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xcccfbc, 0.00125); // color, density
	
	camera = new THREE.PerspectiveCamera(60, ASPECT, 1, 10000); //FOV, aspect, near, far
	camera.position.y = UNITSIZE * .2;
	camera.position.z = -315;
	scene.add(camera);
	
	controls = new THREE.FirstPersonControls(camera); //First Person Shooter view
	controls.movementSpeed = MOVESPEED;
	controls.lookSpeed = LOOKSPEED;
	controls.lookVertical = false;
	controls.noFly = true;
	
	//load the background texture
    var textureLoader = new THREE.TextureLoader();	 
    var texture = textureLoader.load('imports/sky.jpg');
    var backgroundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2, 0),
            new THREE.MeshBasicMaterial({
                map: texture
            }));

    backgroundMesh.material.depthTest = false;
    backgroundMesh.material.depthWrite = false;

    //create background scene
    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.Camera();
    backgroundScene.add(backgroundCamera);
    backgroundScene.add(backgroundMesh);

	//setup canvas for health bar
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');

	//setup canvas for score count
	score = document.getElementById('score');
	scoreContext = score.getContext('2d');
	
	//setup canvas for weapon
	weapon = document.getElementById('weapon');
	weaponContext = weapon.getContext('2d');
	
	//renderer
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(WIDTH, HEIGHT);
	renderer.domElement.style.backgroundColor = '#D6F1FF';
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);
	
	//register event listener functions
	document.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('keyup',onKeyUp, false);
	document.addEventListener('keydown',onKeyDown, false);
	document.addEventListener('keypress',onKeyPress, false);

	
	initWorld();

	initOpponents();
	
	//shoot on click
	$(document).click(function(e) {
		e.preventDefault();
		if (e.which === 1) { //left click only
			createBullet();
		}
	});
	
}

function animate(){
	var delta = clock.getDelta(), speed = delta * BULLETMOVESPEED;
	var aispeed = delta * MOVESPEED;
	controls.update(delta);
	
	//update bullets
	for (var i = bullets.length-1; i >= 0; i--) {
		var b = bullets[i], p = b.position, d = b.ray.direction;
		if (checkWallCollision(p)) {
			bullets.splice(i, 1); //delete bullet from array
			scene.remove(b); //delete bullet from scene
			continue;
		}
		hit = false;
		//bullet collides with opponent
		var hit = false;
		for (var j = opponents.length-1; j >= 0; j--) {
			var opponent = opponents[j];
			var v = opponent.geometry.vertices[0];
			var c = opponent.position;
			var x = Math.abs(v.x), z = Math.abs(v.z);

			if (p.x < c.x + x && p.x > c.x - x && p.z < c.z + z && p.z > c.z - z && b.owner != opponent) {
				bullets.splice(i, 1);
				scene.remove(b);
				opponent.health -= PROJECTILEDAMAGE;
				var color = opponent.material.color, percent = opponent.health / 100;
				opponent.children[0].material.color.setRGB(
						percent * color.r,
						percent * color.g,
						percent * color.b
				);
				hit = true;
				break;
			}
		}
		//bullet collides with player
		if (distance(p.x, p.z, camera.position.x, camera.position.z) < 25 && b.owner != camera) {
			health -= 10;
			if (health < 0) health = 0;
			bullets.splice(i, 1);
			scene.remove(b);
		}
		if (!hit) { //if bullet didn't hit anything, it mooves along
			b.translateX(speed * d.x);
			b.translateZ(speed * d.z);
		}

	}	
	
	//update opponents
	for (var i = opponents.length-1; i >= 0; i--) {
		var opponent = opponents[i];
		if (opponent.health <= 0) { //opponent killed
			opponents.splice(i, 1);
			scene.remove(opponent);
			parts.push(new ExplodeAnimation(opponent.position.x, opponent.position.y, opponent.position.z)); //new explosion
			kills++;
			$('#score').html(kills * 100);
			addOpponent();
		}
		//move opponents
		var r = Math.random();
		if (r > 0.995) {
			opponent.lastRandomX = Math.random() * 2 - 1;
			opponent.lastRandomZ = Math.random() * 2 - 1;
		}
		opponent.translateX(aispeed * opponent.lastRandomX);
		opponent.translateZ(aispeed * opponent.lastRandomZ);
		var c = getMapSector(opponent.position);
		if (c.x < 0 || c.x >= MAP_WIDTH || c.y < 0 || c.y >= MAP_HEIGHT || checkWallCollision(opponent.position)) {
			opponent.translateX(-2 * aispeed * opponent.lastRandomX);
			opponent.translateZ(-2 * aispeed * opponent.lastRandomZ);
			opponent.lastRandomX = Math.random() * 2 - 1;
			opponent.lastRandomZ = Math.random() * 2 - 1;
		}
		if (c.x < -1 || c.x > MAP_WIDTH || c.z < -1 || c.z > MAP_HEIGHT) {
			opponents.splice(i, 1);
			scene.remove(opponent);
			addOpponent();
		}
		
		var cc = getMapSector(camera.position);
		if (Date.now() > opponent.lastShot + 750 && distance(c.x, c.z, cc.x, cc.z) < 2) {
			createBullet(opponent);
			opponent.lastShot = Date.now();
		}
	}			
	
	//health bar
	canvas.width = canvas.width;//clear the canvas
    var percent = health / maxHealth; //calculate health bar percent

    context.fillStyle = "Red";
    context.font = "18px sans-serif";
    context.fillText("Life " +health+"/"+maxHealth, 20, 20);

    context.fillStyle = "black";
    context.fillRect(object1.x, object1.y, object1.width, object1.height);

    context.fillStyle = "red";
    context.fillRect(object1.x, object1.y, object1.width * percent, object1.height);
	
	score.width = score.width;
	scoreContext.fillStyle = "red";
	scoreContext.font = "28px sans-serif";
    scoreContext.fillText("Score " + kills,20, 20);
	
	//renderer
	renderer.render(backgroundScene, backgroundCamera);
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
	
	//player's death
	if (health <= 0) {
		$(renderer.domElement).fadeOut();
		$('#intro').fadeIn();
		$('#intro').html('Ouch! Click to restart...');
		$('#intro').one('click', function() {
			location = location;
		});
	}
	
	//update explosion animations
	var pCount = parts.length;
        while(pCount--) {
			parts[pCount].update();
        }
		  
	//wand rotation
	weaponContext.clearRect(0, 0, weapon.width, weapon.height);
	weaponContext.translate(weapon.width/2, weapon.height/2);
	if (mouse.x < 0.0) {
		weaponContext.rotate(mouse.x / 10.0);
		weaponContext.translate(-weapon.width/2, -weapon.height/2);
		weaponContext.drawImage(wandImg, 0, 30);
		weaponContext.translate(weapon.width/2, weapon.height/2);
		weaponContext.rotate(-mouse.x / 10.0);
	} else {
		weaponContext.rotate(mouse.x);
		weaponContext.translate(-weapon.width/2, -weapon.height/2);
		weaponContext.drawImage(wandImg, 0, 30);
		weaponContext.translate(weapon.width/2, weapon.height/2);
		weaponContext.rotate(-mouse.x);
	}
	weaponContext.translate(-weapon.width/2, -weapon.height/2);

	var delta = clock.getDelta();
	controls.update(delta); // Move camera
	
}

function addOpponent() {
	var c = getMapSector(camera.position);
	var faceMaterial = new THREE.MeshPhongMaterial({color: 0x544393 })
	var cubeMaterial =  new THREE.MeshPhongMaterial({transparent : true, opacity : 0.0});

	var o = new THREE.Mesh(aiGeo, cubeMaterial);
	o.add(new THREE.Mesh(aiGeo2, faceMaterial));
	do {
		var x = getRandBetween(0, MAP_WIDTH-1);
		var z = getRandBetween(0, MAP_HEIGHT-1);
	} while (map[x][z] > 0 || (x == c.x && z == c.z));
	x = Math.floor(x - MAP_WIDTH/2) * UNITSIZE;
	z = Math.floor(z - MAP_WIDTH/2) * UNITSIZE;
	o.position.set(x, UNITSIZE * 0.15, z);
	o.health = 100;
	o.pathPos = 1;
	o.lastRandomX = Math.random();
	o.lastRandomZ = Math.random();
	o.lastShot = Date.now();
	opponents.push(o);
	scene.add(o);
}

function initWorld() {	
	
	//floor
	var textureLoader = new THREE.TextureLoader();
	var maxAnisotropy = renderer.getMaxAnisotropy(); //rozmycie w oddali
	var texture = textureLoader.load("textures/stone.jpg");
	var material = new THREE.MeshPhongMaterial();
	material.map = texture;
	material.bumpMap = textureLoader.load('textures/stone-bump.jpg');
	
	texture.anisotropy = maxAnisotropy;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(MAP_WIDTH, MAP_HEIGHT);

	var geometry = new THREE.PlaneBufferGeometry(UNITSIZE * MAP_WIDTH, UNITSIZE * MAP_HEIGHT);

	geometry.computeVertexNormals();
	var floor = new THREE.Mesh(geometry, material);
	floor.rotation.x = - Math.PI / 2;
	
	scene.add(floor);

	//lighting
	var light = new THREE.DirectionalLight(0xffffff, 1.5);
	light.position.set(1, 1, 1);
	scene.add(light);

	var light = new THREE.DirectionalLight(0xffffff, 0.75);
	light.position.set(-1, -0.5, -1);
	scene.add(light);
	
	var light = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( light );
	
	
	//walls
	var wallGeometry = new THREE.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
	var materials = [
	                 new THREE.MeshPhongMaterial({map: textureLoader.load('textures/brick-wall.jpg'), bumpMap: textureLoader.load('textures/brick-wall-bump.jpg'), side: THREE.DoubleSide}),
	                 new THREE.MeshPhongMaterial({map: textureLoader.load('textures/hedge.jpg'), bumpMap: textureLoader.load('textures/hedge_bump.jpg'), side: THREE.DoubleSide}),
	                 new THREE.MeshLambertMaterial({color: 0xFBEBCD}),
	                 ];
	for (var i = 0; i < MAP_WIDTH; i++) {
		for (var j = 0, m = map[i].length; j < m; j++) {
			if (map[i][j]) {
				var wall = new THREE.Mesh(wallGeometry, materials[map[i][j]-1]);
				wall.position.x = (i - MAP_WIDTH/2) * UNITSIZE;
				wall.position.y = WALLHEIGHT/2;
				wall.position.z = (j - MAP_WIDTH/2) * UNITSIZE;
				scene.add(wall);
			}
		}
	}
	
	initWand();
}

function initWand() {
	weaponContext.drawImage(wandImg,0,0);
}

function onMouseMove(event) {

	//update the mouse variable
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	
};

function onKeyUp(event){
	event.preventDefault();
	if(event.keyCode == 27){
		$(renderer.domElement).fadeOut();
		$('#intro').fadeIn();
		$('#intro').html('Click to start');
		$('#intro').one('click', function() {
			location = location;
		});
	}
	if (event.keyCode == 16) {
		controls.movementSpeed = MOVESPEED;
	}
}

function onKeyDown(event) {
	if (event.keyCode == 16) {
		controls.movementSpeed = MOVESPEED * 3;
	}
}

function onKeyPress(event) {
	if (event.keyCode == 16) {
		controls.movementSpeed = MOVESPEED * 3;
	}
}

function initOpponents() {
	var opponent; 
	for (var i = 0; i < NUMBER_OF_OPPONENTS; i++) {
		addOpponent();
	}
}

function getMapSector(v) {
	var x = Math.floor((v.x + UNITSIZE / 2) / UNITSIZE + MAP_WIDTH/2);
	var z = Math.floor((v.z + UNITSIZE / 2) / UNITSIZE + MAP_WIDTH/2);
	return {x: x, z: z};
}

function getRandBetween(lo, hi) {
 return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo, 10);
}

function checkWallCollision(v) {
	var c = getMapSector(v);
	return map[c.x][c.z] > 0;
}

function createBullet(obj) {
	if (obj === undefined) {
		obj = camera;
	}

var material1 = new THREE.MeshLambertMaterial({color: new THREE.Color(Math.random(), Math.random(), Math.random()), wireframe: false});
var material2 = new THREE.MeshLambertMaterial({color: new THREE.Color(Math.random(), Math.random(), Math.random()), wireframe: false});

var materials = [material1, material2];

var extrudeSettings = {
				amount			: 20,
				steps			: 1,
				material1		: 1,
				extrudeMaterial : 0,
				bevelEnabled	: true,
				bevelThickness  : 2,
				bevelSize       : 4,
				bevelSegments   : 1,
			};

var pts = [], numPts = 5;
for (var i = 0; i < numPts * 2; i ++) {
	var l = i % 2 == 1 ? 10 : 20;
	var a = i / numPts * Math.PI;
	pts.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l));
}
var starShape = new THREE.Shape(pts);
var starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);

	var starMesh = new THREE.Mesh(starGeometry, new THREE.MultiMaterial(materials));

	if (obj instanceof THREE.Camera) {
		var vector = new THREE.Vector3(mouse.x, mouse.y, 1);

		vector.unproject(obj);
		starMesh.ray = new THREE.Ray(
				obj.position,
				vector.sub(obj.position).normalize()
		);
		starMesh.position.x = camera.position.x;
		starMesh.position.y = camera.position.y;
		starMesh.position.z = camera.position.z;
	}
	else {
		var vector = camera.position.clone();
		starMesh.ray = new THREE.Ray(
				obj.position,
				vector.sub(obj.position).normalize()
		);
		starMesh.position.x = obj.position.x;
		starMesh.position.y = obj.position.y;
		starMesh.position.z = obj.position.z;
		
	}
	starMesh.owner = obj;
	starMesh.scale.set(0.1, 0.1, 0.1);
	
	bullets.push(starMesh);
	scene.add(starMesh);

	return starMesh;
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

//explosion variables
var movementSpeed = 80;
var totalObjects = 1000;
var objectSize = 10;
var dirs = [];
var parts = [];

function ExplodeAnimation(x,y,z)
{
	var loader = new THREE.TextureLoader();
	var geometry = new THREE.Geometry();

	for (i = 0; i < totalObjects; i ++) { 
		var vertex = new THREE.Vector3();
		vertex.x = x;
		vertex.y = y;
		vertex.z = z;

		geometry.vertices.push( vertex );
		dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),y:(Math.random() * movementSpeed)-(movementSpeed/2),z:(Math.random() * movementSpeed)-(movementSpeed/2)});
	}
	var material = new THREE.PointsMaterial( { size: objectSize, map: loader.load('textures/glow.png'), transparent: true,  color: new THREE.Color(Math.random(), Math.random(), Math.random())});
	var particles = new THREE.Points( geometry, material );

	material.size = 100.0;
	this.object = particles;
	this.status = true;

	this.xDir = (Math.random() * movementSpeed)-(movementSpeed/2);
	this.yDir = (Math.random() * movementSpeed)-(movementSpeed/2);
	this.zDir = (Math.random() * movementSpeed)-(movementSpeed/2);

	scene.add(this.object); 

	this.update = function(){
		if (this.status == true){
			var pCount = totalObjects;
			while(pCount--) {
				var particle = this.object.geometry.vertices[pCount]
				particle.y += dirs[pCount].y;
				particle.x += dirs[pCount].x;
				particle.z += dirs[pCount].z;
			}
			this.object.geometry.verticesNeedUpdate = true;
		}
	}
}

//stop moving around when the window is unfocused
$(window).focus(function() {
	if (controls) controls.freeze = false;
});

$(window).blur(function() {
	if (controls) controls.freeze = true;
});