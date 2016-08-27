var map = [/*0 1 2 3 4 5 6 7 8 9*/
			[1,1,1,1,1,1,1,1,1,1], //0
			[1,0,0,0,0,0,0,0,0,1], //1
			[1,0,0,0,0,0,0,0,0,1], //2
			[1,0,0,0,0,0,0,0,0,1], //3
			[1,0,0,0,1,0,0,0,0,1], //4
			[1,0,0,0,0,1,0,0,0,1], //5
			[1,0,0,0,0,0,0,0,0,1], //6
			[1,0,0,0,0,0,0,0,0,1], //7
			[1,0,0,0,0,0,0,0,0,1], //8
			[1,1,1,1,1,1,1,1,1,1], //9
];

var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	UNITSIZE = 250,
	WALLHEIGHT = UNITSIZE / 2,
	MOVESPEED = 100,
	LOOKSPEED = 0.075,
	BULLETMOVESPEED = MOVESPEED * 5,
	NUMAI = 5,
	PROJECTILEDAMAGE = 20,
	MAP_WIDTH = map.length,
	MAP_HEIGHT = map[0].length;

var scene, camera, controls, geometry, material, mesh, loader, renderer, clock, backgroundCamera, backgroundScene;

var mouse = {x:0, y:0};

$(document).ready(function(){
	$('body').append('<div id="intro" class="custom" >Click to start</div>');
	$('#intro').css({width: WIDTH, height: HEIGHT}).one('click', function(e) {
		e.preventDefault();
		$(this).fadeOut();
		init();
		animate();
	});
});


function  init(){

	clock = new THREE.Clock();
	scene = new THREE.Scene(); // Holds all objects in the canvas
	scene.fog = new THREE.FogExp2(0xD6F1FF, 0.0005); // color, density
	
	camera = new THREE.PerspectiveCamera(60, ASPECT, 1, 10000); // FOV, aspect, near, far
	camera.position.y = UNITSIZE * .2;
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

	
	
	//renderer
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(WIDTH, HEIGHT);
	renderer.setClearColor(scene.fog.color);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.autoClear = false;
	renderer.domElement.style.position = "relative";
	renderer.domElement.style.backgroundColor = '#D6F1FF'; // easier to see
	document.body.appendChild(renderer.domElement);
	
	document.addEventListener('mousemove', onMouseMove, false);
	
	initWorld();
}


function animate(){
	renderer.render(backgroundScene, backgroundCamera);
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
	
	var delta = clock.getDelta();
	controls.update(delta); // Move camera
}

function initWorld() {	
	
	//floor
	var textureLoader = new THREE.TextureLoader();

	var maxAnisotropy = renderer.getMaxAnisotropy();

	var texture = textureLoader.load("textures/stone.jpg");
	var material = new THREE.MeshPhongMaterial();
	material.map = texture;
	
	texture.anisotropy = maxAnisotropy;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(MAP_WIDTH, MAP_HEIGHT);

	var geometry = new THREE.PlaneBufferGeometry(UNITSIZE * MAP_WIDTH, UNITSIZE * MAP_HEIGHT);

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
	
	scene.add(new THREE.AmbientLight(0xeef0ff));
	
	//walls
	var wallGeometry = new THREE.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
	var materials = [
	                 new THREE.MeshLambertMaterial({map: textureLoader.load('textures/crate.gif')}),
	                 new THREE.MeshLambertMaterial({map: textureLoader.load('textures/crate.gif')}),
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

