window.onload = () => {
  var difficulty;
  var difficulties = document.getElementsByName('difficulty');
  for (let i = 0; i < difficulties.length; i++) {
    if (difficulties[i].checked) {
      difficulty = Number(difficulties[i].value);
    }
  }
  document.getElementById('play').onclick = function () {
    document.getElementById('play').style.visibility = 'hidden';
    startMainScene(difficulty);
  }
};

function startMainScene(difficulty) {

  document.body.innerHTML =
    '<div id="scoreboard">' +
    '<div id="health">Astronaut Health: 100</div>' +
    '<div id="score">Score: 0</div>' +
    '<img id="audio_image" src="images/audio_on.png"/>' +
    '<img id="audioMute_image" src="images/audio_off.png"/>'+
    '</div>'+
    '<div id="gameover"></div>'

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Renderer
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; //enable shadow
  renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);

  const orbit = new THREE.OrbitControls(camera, renderer.domElement);

  // Make Canvas Responsive
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  const gameInstance = new Game(scene, camera, difficulty);

  function animate() {
    requestAnimationFrame(animate);
    gameInstance.update(scene, camera);
    renderer.render(scene, camera);
  }
  animate();
}