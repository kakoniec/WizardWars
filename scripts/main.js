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

var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	UNITSIZE = 250,
	WALLHEIGHT = UNITSIZE * 1.5;
	MOVESPEED = 100,
	LOOKSPEED = 0.075,
	BULLETMOVESPEED = MOVESPEED * 10,
	NUMAI = 5,
	PROJECTILEDAMAGE = 20,
	MAP_WIDTH = map.length,
	MAP_HEIGHT = map[0].length,
	NUMBER_OF_OPPONENTS = 10,
	OPPONENT_VELOCITY_X = Math.random() * 2 - 1,
	OPPONENT_VELOCITY_Y = Math.random() * 2 - 1,
	OPPONENT_VELOCITY_Z = Math.random() * 2 - 1;

var scene, camera, controls, geometry, material, mesh, loader, renderer, clock, backgroundCamera, backgroundScene, projector;

var aiGeo = new THREE.CubeGeometry(40, 40, 40);
var aiGeo2 = new THREE.CylinderGeometry( 1, 40*3, 40*3, 4 );

var canvas, context;

var opponents = [], bullets = [];
var runAnim = true, mouse = { x: 0, y: 0 }, kills = 0, health = 100;

	var object1 = {
		x: 20,
		y: 30,
		width: 300,
		height: 20
	};

	var maxHealth = 100;
	
$(document).ready(function(){
	$('body').append('<div id="intro" class="custom" >Click to start</div>');
		//health bar
	$('body').append('<canvas id="canvas" width="500" height="50"></canvas>');
	$('#intro').css({width: WIDTH, height: HEIGHT}).one('click', function(e) {
		e.preventDefault();
		$(this).fadeOut();
		init();
		animate();
	});
});

// Handle window resizing
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
	scene = new THREE.Scene(); // Holds all objects in the canvas
	projector = new THREE.Projector();
	scene.fog = new THREE.FogExp2(0xcccfbc, 0.00125); // color, density
	
	camera = new THREE.PerspectiveCamera(60, ASPECT, 1, 10000); // FOV, aspect, near, far
	camera.position.y = UNITSIZE * .2;
	camera.position.z = -315;
	scene.add(camera);
	
	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = MOVESPEED;
	controls.lookSpeed = LOOKSPEED;
	controls.lookVertical = false; // Temporary solution; play on flat surfaces only
	controls.noFly = true;
	
	
	 // Load the background texture
    var textureLoader = new THREE.TextureLoader();	 
    var texture = textureLoader.load( 'imports/sky.jpg' );
    var backgroundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2, 0),
            new THREE.MeshBasicMaterial({
                map: texture
            }));

    backgroundMesh.material.depthTest = false;
    backgroundMesh.material.depthWrite = false;

    // Create your background scene
    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.Camera();
    backgroundScene .add(backgroundCamera );
    backgroundScene .add(backgroundMesh );

	// setup canvas for health bar
	canvas = document.getElementById('canvas');
	canvas.width = 500;
	canvas.height = 50;
	context = canvas.getContext('2d');

	
	//renderer
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(WIDTH, HEIGHT);
	renderer.domElement.style.backgroundColor = '#D6F1FF'; // easier to see
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);
	
	document.addEventListener('mousemove', onMouseMove, false);
	
	initWorld();

	initOpponents();
	
	// Shoot on click
	$(document).click(function(e) {
		e.preventDefault();
		if (e.which === 1) { // Left click only
			createBullet();
		}
	});
	
}


function animate(){
	var delta = clock.getDelta(), speed = delta * BULLETMOVESPEED;
	var aispeed = delta * MOVESPEED;
	controls.update(delta);
	
	// Update bullets. Walk backwards through the list so we can remove items.
	
	for (var i = bullets.length-1; i >= 0; i--) {
		var b = bullets[i], p = b.position, d = b.ray.direction;
		if (checkWallCollision(p)) {
			bullets.splice(i, 1);
			scene.remove(b);
			continue;
		}
		hit = false;
		//Collide with AI
		var hit = false;
		for (var j = opponents.length-1; j >= 0; j--) {
			var a = opponents[j];
			var v = a.geometry.vertices[0];
			var c = a.position;
			var x = Math.abs(v.x), z = Math.abs(v.z);

			if (p.x < c.x + x && p.x > c.x - x &&
					p.z < c.z + z && p.z > c.z - z &&
					b.owner != a) {
				bullets.splice(i, 1);
				scene.remove(b);
				a.health -= PROJECTILEDAMAGE;
				var color = a.material.color, percent = a.health / 100;
				a.material.color.setRGB(
						percent * color.r,
						percent * color.g,
						percent * color.b
				);
				hit = true;
				break;
			}
		}
		// Bullet hits player
		if (distance(p.x, p.z, camera.position.x, camera.position.z) < 25 && b.owner != camera) {
			$('#hurt').fadeIn(75);
			health -= 10;
			if (health < 0) health = 0;
			val = health < 25 ? '<span style="color: darkRed">' + health + '</span>' : health;
			$('#health').html(val);
			bullets.splice(i, 1);
			scene.remove(b);
			$('#hurt').fadeOut(350);
		}
		if (!hit) {
			b.translateX(speed * d.x);
			//bullets[i].translateY(speed * bullets[i].direction.y);
			b.translateZ(speed * d.z);
		}
		
	
	}	
	
	// Update AI.
	for (var i = opponents.length-1; i >= 0; i--) {
		var a = opponents[i];
		if (a.health <= 0) {
			opponents.splice(i, 1);
			scene.remove(a);
			kills++;
			$('#score').html(kills * 100);
			addOpponent();
		}
		// Move AI
		var r = Math.random();
		if (r > 0.995) {
			a.lastRandomX = Math.random() * 2 - 1;
			a.lastRandomZ = Math.random() * 2 - 1;
		}
		a.translateX(aispeed * a.lastRandomX);
		a.translateZ(aispeed * a.lastRandomZ);
		var c = getMapSector(a.position);
		if (c.x < 0 || c.x >= MAP_WIDTH || c.y < 0 || c.y >= MAP_HEIGHT || checkWallCollision(a.position)) {
			a.translateX(-2 * aispeed * a.lastRandomX);
			a.translateZ(-2 * aispeed * a.lastRandomZ);
			a.lastRandomX = Math.random() * 2 - 1;
			a.lastRandomZ = Math.random() * 2 - 1;
		}
		if (c.x < -1 || c.x > MAP_WIDTH || c.z < -1 || c.z > MAP_HEIGHT) {
			opponents.splice(i, 1);
			scene.remove(a);
			addOpponent();
		}
		
		var cc = getMapSector(camera.position);
		if (Date.now() > a.lastShot + 750 && distance(c.x, c.z, cc.x, cc.z) < 2) {
			createBullet(a);
			a.lastShot = Date.now();
		}
	}			
	
	//health bar
	// Clear the canvas
    canvas.width = canvas.width;
    
    // Calculate health bar percent
    var percent = health / maxHealth;

    context.fillStyle = "Red";
    context.font = "18px sans-serif";
    context.fillText("Life " +health+"/"+maxHealth, 20, 20);

    context.fillStyle = "black";
    context.fillRect(object1.x, object1.y, object1.width, object1.height);

    context.fillStyle = "red";
    context.fillRect(object1.x, object1.y, object1.width * percent, object1.height);
	
	//renderer
	renderer.render(backgroundScene, backgroundCamera);
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
	
	//Death
	if (health <= 0) {
		$(renderer.domElement).fadeOut();
		$('#intro').fadeIn();
		$('#intro').html('Ouch! Click to restart...');
		$('#intro').one('click', function() {
			location = location;
		});
	}
	
	var delta = clock.getDelta();
	controls.update(delta); // Move camera
	
}

function addOpponent() {
	var c = getMapSector(camera.position);
	var aiMaterial =  new THREE.MeshPhongMaterial( { color: 0xEE3333} );
	
//	THREE.GeometryUtils.merge(aiGeo, aiGeo2);
	var o = new THREE.Mesh(aiGeo, aiMaterial);
	o.add(new THREE.Mesh(aiGeo2, aiMaterial));
	do {
		var x = getRandBetween(0, MAP_WIDTH-1);
		var z = getRandBetween(0, MAP_HEIGHT-1);
	} while (map[x][z] > 0 || (x == c.x && z == c.z));
	x = Math.floor(x - MAP_WIDTH/2) * UNITSIZE;
	z = Math.floor(z - MAP_WIDTH/2) * UNITSIZE;
	o.position.set(x, UNITSIZE * 0.15, z);
	o.health = 100;
	//o.path = getAIpath(o);
	o.pathPos = 1;
	o.lastRandomX = Math.random();
	o.lastRandomZ = Math.random();
	o.lastShot = Date.now(); // Higher-fidelity timers aren't a big deal here.
	opponents.push(o);
	scene.add(o);
}

function addChessFigure() {
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.load('obj/Chess/chess.mtl', function(materials) {
		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);
		objLoader.load('obj/Chess/chess.obj', function(o) {
			o.scale.set(0.01, 0.01, 0.01);
			var c = getMapSector(camera.position);
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
			o.lastShot = Date.now(); // Higher-fidelity timers aren't a big deal here.
			opponents.push(o);
			scene.add(o);
		});
	});
	
	// var mesh = null;

	// var mtlLoader = new THREE.MTLLoader();
	// mtlLoader.setBaseUrl( "obj/Chess/" );
	// mtlLoader.setPath( "obj/Chess/" );
	// mtlLoader.load( 'chess.mtl', function( materials ) {

		// materials.preload();

		// var objLoader = new THREE.OBJLoader();
		// objLoader.setMaterials( materials );
		// objLoader.setPath( "obj/Chess/" );
		// objLoader.load( 'chess.obj', function ( o ) {

		// var c = getMapSector(camera.position);
		// do {
			// var x = getRandBetween(0, MAP_WIDTH-1);
			// var z = getRandBetween(0, MAP_HEIGHT-1);
		// } while (map[x][z] > 0 || (x == c.x && z == c.z));
		// x = Math.floor(x - MAP_WIDTH/2) * UNITSIZE;
		// z = Math.floor(z - MAP_WIDTH/2) * UNITSIZE;
		// o.position.set(x, UNITSIZE * 0.15, z);
		// o.health = 100;
		// o.pathPos = 1;
		// o.lastRandomX = Math.random();
		// o.lastRandomZ = Math.random();
		// o.lastShot = Date.now(); // Higher-fidelity timers aren't a big deal here.
		// opponents.push(o);
		// scene.add(o);

		// } );

	// } );
	
	// var objLoader = new THREE.OBJLoader();
    // var material = new THREE.MeshBasicMaterial({color: 'yellow', side: THREE.DoubleSide});
    // objLoader.load('obj/Chess/chess.obj', function (obj) {
		// console.log(obj.geometry.vertices.length);
        // obj.traverse(function (o) {

            // if (o instanceof THREE.Mesh) {
                // o.material = material;
				// o.scale.set(0.01, 0.01, 0.01);
				// console.log(o.geometry.vertices.length);
				// var c = getMapSector(camera.position);
				// do {
					// var x = getRandBetween(0, MAP_WIDTH-1);
					// var z = getRandBetween(0, MAP_HEIGHT-1);
				// } while (map[x][z] > 0 || (x == c.x && z == c.z));
				// x = Math.floor(x - MAP_WIDTH/2) * UNITSIZE;
				// z = Math.floor(z - MAP_WIDTH/2) * UNITSIZE;
				// o.position.set(x, UNITSIZE * 0.15, z);
				// o.health = 100;
				// o.pathPos = 1;
				// o.lastRandomX = Math.random();
				// o.lastRandomZ = Math.random();
				// o.lastShot = Date.now(); // Higher-fidelity timers aren't a big deal here.
				// opponents.push(o);
				// scene.add(o);
            // }

        // });

    // });
}

function initWorld() {	
	
	//floor
	var textureLoader = new THREE.TextureLoader();

	var maxAnisotropy = renderer.getMaxAnisotropy();

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
	
	//scene.add(new THREE.AmbientLight(0xeef0ff));
	
	//walls
	var wallGeometry = new THREE.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
	//wallGeometry.computeVertexNormals();
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
}


// Follows the mouse event
function onMouseMove(event) {

	// Update the mouse variable
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
};

function initOpponents() {
	var opponent; 
	for (var i = 0; i < NUMBER_OF_OPPONENTS; i++) {
		addOpponent();
//		addChessFigure();
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

	var material1 = new THREE.MeshLambertMaterial( { color: new THREE.Color(Math.random(), Math.random(), Math.random()), wireframe: false } );
var material2 = new THREE.MeshLambertMaterial( { color: new THREE.Color(Math.random(), Math.random(), Math.random()), wireframe: false } );

var materials = [ material1, material2 ];

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
for ( var i = 0; i < numPts * 2; i ++ ) {
	var l = i % 2 == 1 ? 10 : 20;
	var a = i / numPts * Math.PI;
	pts.push( new THREE.Vector2 ( Math.cos( a ) * l, Math.sin( a ) * l ) );
}
var starShape = new THREE.Shape( pts );
var starGeometry = new THREE.ExtrudeGeometry( starShape, extrudeSettings );

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
	//	starMesh.position.x = 100;
	// starMesh.position.y = UNITSIZE * .2;
	// starMesh.position.z = -400;	
	
	bullets.push(starMesh);
	scene.add(starMesh);


	return starMesh;
	
		
	// var sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
	// sphere.position.set(obj.position.x, obj.position.y * 0.8, obj.position.z);


	// if (obj instanceof THREE.Camera) {
		// var vector = new THREE.Vector3(mouse.x, mouse.y, 1);

		// vector.unproject(obj);
		// sphere.ray = new THREE.Ray(
				// obj.position,
				// vector.sub(obj.position).normalize()
		// );
	// }
	// else {
		// var vector = camera.position.clone();
		// sphere.ray = new THREE.Ray(
				// obj.position,
				// vector.sub(obj.position).normalize()
		// );
	// }
	// sphere.owner = obj;
	
	// bullets.push(sphere);
	// scene.add(sphere);
	
	// return sphere;
	
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

// Stop moving around when the window is unfocused (keeps my sanity!)
$(window).focus(function() {
	if (controls) controls.freeze = false;
});

$(window).blur(function() {
	if (controls) controls.freeze = true;
});