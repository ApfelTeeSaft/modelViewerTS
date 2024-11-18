import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import gsap from 'gsap';

const fileSelectionPage = document.getElementById('fileSelectionPage') as HTMLDivElement;
const threeJSCanvasContainer = document.getElementById('threeJSCanvasContainer') as HTMLDivElement;
const displayButton = document.getElementById('displayButton') as HTMLButtonElement;
const objInput = document.getElementById('objFile') as HTMLInputElement;
const textureInput = document.getElementById('textureFile') as HTMLInputElement;

const backButton = document.createElement('button');
backButton.textContent = 'Back';
backButton.style.position = 'absolute';
backButton.style.top = '10px';
backButton.style.left = '10px';
backButton.style.padding = '10px 15px';
backButton.style.border = 'none';
backButton.style.borderRadius = '5px';
backButton.style.fontSize = '14px';
backButton.style.backgroundColor = '#0056D2';
backButton.style.color = '#fff';
backButton.style.cursor = 'pointer';
backButton.style.boxShadow = '0px 3px 6px rgba(0, 0, 0, 0.2)';
backButton.style.transition = 'background-color 0.3s ease';
backButton.addEventListener('mouseover', () => (backButton.style.backgroundColor = '#003C9E'));
backButton.addEventListener('mouseout', () => (backButton.style.backgroundColor = '#0056D2'));

const toggleMovementButton = document.createElement('button');
toggleMovementButton.textContent = 'Toggle Freecam (unused)';
toggleMovementButton.style.position = 'absolute';
toggleMovementButton.style.bottom = '20px';
toggleMovementButton.style.left = '20px';
toggleMovementButton.style.padding = '10px 15px';
toggleMovementButton.style.border = 'none';
toggleMovementButton.style.borderRadius = '5px';
toggleMovementButton.style.fontSize = '14px';
toggleMovementButton.style.backgroundColor = '#28a745';
toggleMovementButton.style.color = '#fff';
toggleMovementButton.style.cursor = 'pointer';
toggleMovementButton.style.boxShadow = '0px 3px 6px rgba(0, 0, 0, 0.2)';
toggleMovementButton.style.transition = 'background-color 0.3s ease';
toggleMovementButton.addEventListener('mouseover', () => (toggleMovementButton.style.backgroundColor = '#1E7A3B'));
toggleMovementButton.addEventListener('mouseout', () => (toggleMovementButton.style.backgroundColor = '#28a745'));

let objFile: File | null = null;
let textureFile: File | null = null;

let isFreecam = false;

gsap.to(fileSelectionPage, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' });

objInput.addEventListener('change', (event) => {
  objFile = (event.target as HTMLInputElement).files?.[0] || null;
});

textureInput.addEventListener('change', (event) => {
  textureFile = (event.target as HTMLInputElement).files?.[0] || null;
});

displayButton.addEventListener('click', () => {
  if (!objFile) {
    alert('Please select an .obj file!');
    return;
  }

  gsap.to(fileSelectionPage, {
    opacity: 0,
    scale: 0.8,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: () => {
      fileSelectionPage.style.display = 'none';
      threeJSCanvasContainer.style.display = 'block';
      threeJSCanvasContainer.appendChild(backButton);
      threeJSCanvasContainer.appendChild(toggleMovementButton);
      initialize3DViewer(objFile, textureFile);
    },
  });
});

backButton.addEventListener('click', () => {
  objInput.value = '';
  textureInput.value = '';
  objFile = null;
  textureFile = null;

  gsap.to(threeJSCanvasContainer, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: () => {
      threeJSCanvasContainer.style.display = 'none';
      fileSelectionPage.style.display = 'flex';
      gsap.fromTo(
        fileSelectionPage,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    },
  });
});

function createFallbackTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

function initialize3DViewer(objFile: File, textureFile: File | null) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  threeJSCanvasContainer.appendChild(renderer.domElement);

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;

  const objLoader = new OBJLoader();
  const textureLoader = new THREE.TextureLoader();

  const debugInfoContainer = document.createElement('div');
  debugInfoContainer.style.position = 'absolute';
  debugInfoContainer.style.top = '10px';
  debugInfoContainer.style.right = '10px';
  debugInfoContainer.style.padding = '10px';
  debugInfoContainer.style.border = '1px solid #ccc';
  debugInfoContainer.style.borderRadius = '5px';
  debugInfoContainer.style.fontSize = '12px';
  debugInfoContainer.style.backgroundColor = '#F9FAFC';
  debugInfoContainer.style.color = '#333';
  debugInfoContainer.style.boxShadow = '0px 3px 6px rgba(0, 0, 0, 0.1)';
  debugInfoContainer.style.width = '200px';
  debugInfoContainer.style.zIndex = '1000';
  threeJSCanvasContainer.appendChild(debugInfoContainer);

  const updateDebugInfo = (object: THREE.Object3D | null) => {
    if (!object) {
      debugInfoContainer.innerHTML = 'No model loaded.';
      return;
    }

    let polygonCount = 0;
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry as THREE.BufferGeometry;
        polygonCount += geometry.index
          ? geometry.index.count / 3
          : geometry.attributes.position.count / 3;
      }
    });

    debugInfoContainer.innerHTML = `
      <strong>Debug Info:</strong><br />
      - Object Type: ${object.type}<br />
      - Children: ${object.children.length}<br />
      - Polygons: ${Math.round(polygonCount)}<br />
      - Position: ${object.position.toArray().join(', ')}
    `;
  };

  const reader = new FileReader();
  reader.onload = () => {
    const obj = objLoader.parse(reader.result as string);

    if (textureFile) {
      const textureReader = new FileReader();
      textureReader.onload = () => {
        textureLoader.load(
          textureReader.result as string,
          (texture) => {
            obj.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({ map: texture });
              }
            });
            scene.add(obj);
            updateDebugInfo(obj);
          },
          undefined,
          () => {
            alert('Failed to load the selected texture. Falling back to white texture.');
            const fallbackTexture = createFallbackTexture();
            obj.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({ map: fallbackTexture });
              }
            });
            scene.add(obj);
            updateDebugInfo(obj);
          }
        );
      };
      textureReader.readAsDataURL(textureFile);
    } else {
      const fallbackTexture = createFallbackTexture();
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({ map: fallbackTexture });
        }
      });
      scene.add(obj);
      updateDebugInfo(obj);
    }
  };
  reader.readAsText(objFile);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);

    if (isFreecam) {
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      const velocity = new THREE.Vector3();

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, up).normalize();

      if (keys.w) velocity.add(forward);
      if (keys.s) velocity.sub(forward);
      if (keys.a) velocity.sub(right);
      if (keys.d) velocity.add(right);
      if (keys.space) velocity.add(up);
      if (keys.shift) velocity.sub(up);

      if (!velocity.equals(new THREE.Vector3())) {
        velocity.normalize().multiplyScalar(0.2);
        camera.position.add(velocity);
      }
    } else {
      orbitControls.update();
    }

    renderer.render(scene, camera);
  }

  animate();
}