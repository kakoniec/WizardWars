var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	UNITSIZE = 250,
	WALLHEIGHT = UNITSIZE / 3,
	MOVESPEED = 100,
	LOOKSPEED = 0.075,
	BULLETMOVESPEED = MOVESPEED * 5,
	NUMAI = 5,
	PROJECTILEDAMAGE = 20;

var scene, camera, controls, geometry, material, mesh, loader, renderer;

$(document).ready(function(){
	$('body').append('<div id="intro">Click to start</div>');
	$('#intro').css({width: WIDTH, height: HEIGHT}).one('click', function(e) {
		e.preventDefault();
		$(this).fadeOut();
		init();
		animate();
	});
});


function  init(){
	console.log('init started');
	scene = new THREE.Scene(); // Holds all objects in the canvas
	scene.fog = new THREE.FogExp2(0xD6F1FF, 0.0005); // color, density
	
	camera = new THREE.PerspectiveCamera(60, ASPECT, 1, 10000); // FOV, aspect, near, far
	camera.position.y = UNITSIZE * .2;
	//scene.add(camera);
	
	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = MOVESPEED;
	controls.lookSpeed = LOOKSPEED;
	controls.lookVertical = false; // Temporary solution; play on flat surfaces only
	controls.noFly = true;
	
		//renderer
	renderer = new THREE.WebGLRenderer({ antialias: true } );
	
			// Lighting
	var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
	light.position.set( 1, 1, 1 );
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff, 0.75 );
	light.position.set( -1, - 0.5, -1 );
	scene.add( light );

	
	scene.add( new THREE.AmbientLight( 0xeef0ff ) );
	
	initWorld();
	
	renderer.setSize(WIDTH, HEIGHT);
	renderer.setClearColor( scene.fog.color );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.autoClear = false;
	renderer.domElement.style.position = "relative";
	document.body.appendChild(renderer.domElement);

}


function animate(){
	console.log('animate started');
	renderer.render(scene, camera);

}

function initWorld() {
	console.log('initWorld started');
	

	//floor
	// geometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
	// geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	
	// loader = new THREE.TextureLoader();
	// var floorTex = loader.load('textures/stone.jpg');
	// floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
	// floorTex.repeat.set(200,200);
	// material = new THREE.MeshPhongMaterial({color: 0x3c3c3c, map: floorTex});

	// mesh = new THREE.Mesh( geometry, material );
	// scene.add( mesh );
	
	var textureLoader = new THREE.TextureLoader();

	var maxAnisotropy = renderer.getMaxAnisotropy();

	var texture1 = textureLoader.load( "textures/stone.jpg" );
	var material1 = new THREE.MeshPhongMaterial();
	material1.map = texture1;
	
	texture1.anisotropy = maxAnisotropy;
	texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
	texture1.repeat.set( 512, 512 );

	var geometry = new THREE.PlaneBufferGeometry( 100, 100 );

	var mesh1 = new THREE.Mesh( geometry, material1 );
	mesh1.rotation.x = - Math.PI / 2;
	mesh1.scale.set( 1000, 1000, 1000 );


	scene.add( mesh1 );

	
	
	
}
