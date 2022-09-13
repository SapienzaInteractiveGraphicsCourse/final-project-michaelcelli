import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js";

window.onload = () => {

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Make Canvas Responsive
    window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    })

    // Create a green cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);

    // Add it to the scene hierarchy
    scene.add(cube);
    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        
        // add rotate animation to the cube (increment
        // its rotation on the Y axis a little every frame)
       
        cube.rotation.y += 0.05;
        
        renderer.render(scene, camera);
      }
      animate();
}