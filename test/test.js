var scene, camera, controls, renderer, bullets = [];
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT;
var mouse = { x: 0, y: 0 };	


document.addEventListener('mousemove', onMouseMove, false);
	
init();
animate();

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(60, ASPECT, 1, 10000);
	scene.add(camera);
	camera.position.z = 300;

	var light = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add(light);
	
	// create a point light
	var pointLight = new THREE.PointLight(0xFFFFFF);

	// set its position
	pointLight.position.x = 10;
	pointLight.position.y = 50;
	pointLight.position.z = 130;

	// add to the scene
	scene.add(pointLight);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(WIDTH, HEIGHT);
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);
	
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.minDistance = 200;
	controls.maxDistance = 500;
	
	importVoldi();
	
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

function importVoldi() {
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setPath('obj/Lord_Voldemort/');
	mtlLoader.load('Lord_Voldemort.mtl', function(materials) {
		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setPath('obj/Lord_Voldemort/');
		objLoader.setMaterials(materials);
		objLoader.load('Lord_Voldemort.obj', function(o) {
//			o.scale.set(0.5, 0.5, 0.5);
			
			scene.add(o);
		});
	});
}

function createBox() {
	var boxGeometry = new THREE.BoxGeometry(10,10,10);
	var boxMaterial = new THREE.MeshLambertMaterial( { color: 0xb00000, wireframe: false } );
	var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
	boxMesh.position.x = 100;
	boxMesh.position.y = 100;
	boxMesh.position.z = 100;
	scene.add(boxMesh);
}

function createBullet(obj) {
	if (obj === undefined) {
		obj = camera;
	}

	var material1 = new THREE.MeshLambertMaterial( { color: 0xb00000, wireframe: false } );
	var material2 = new THREE.MeshLambertMaterial( { color: 0xff8000, wireframe: false } );

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

	// if (obj instanceof THREE.Camera) {
		// var vector = new THREE.Vector3(mouse.x, mouse.y, 1);

		// vector.unproject(obj);
		// starMesh.ray = new THREE.Ray(
				// obj.position,
				// vector.sub(obj.position).normalize()
		// );
	// }
	// else {
		// var vector = camera.position.clone();
		// starMesh.ray = new THREE.Ray(
				// obj.position,
				// vector.sub(obj.position).normalize()
		// );
	// }
	// starMesh.owner = obj;
	
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

// Follows the mouse event
function onMouseMove(event) {

	// Update the mouse variable
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
};
