import {
  AmbientLight,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer
} from "./assets/vendor/three.module.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

bootstrapHeroScenes();

async function bootstrapHeroScenes() {
  if (prefersReducedMotion) {
    return;
  }

  if ("fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Use fallback fonts if the Tamil webfont is unavailable.
    }
  }

  document.querySelectorAll("[data-hero-three]").forEach((root) => {
    initHeroScene(root);
  });
}

function initHeroScene(root) {
  const interactiveSurface = root.closest(".hero-visual") || root;
  const renderer = createRenderer();

  if (!renderer) {
    return;
  }

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.transform = "translate3d(0px, 0px, 0)";
  renderer.domElement.style.willChange = "transform";
  root.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0, 7.4);

  scene.add(new AmbientLight(0xf8f0df, 1.28));

  const keyLight = new DirectionalLight(0xfff8e8, 1.2);
  keyLight.position.set(3.2, 4.4, 6.4);
  scene.add(keyLight);

  const accentLight = new PointLight(0xc48e5d, 1.55, 16, 2);
  accentLight.position.set(-2.8, -0.8, 4.8);
  scene.add(accentLight);

  const sceneGroup = new Group();
  scene.add(sceneGroup);

  const ringMaterial = new MeshStandardMaterial({
    color: 0xdab46f,
    emissive: 0x5d3a22,
    emissiveIntensity: 0.08,
    metalness: 0.28,
    roughness: 0.52,
    transparent: true,
    opacity: 0.42
  });

  const haloRing = new Mesh(
    new TorusGeometry(2.7, 0.08, 16, 84),
    ringMaterial
  );
  haloRing.rotation.set(1.15, 0.18, 0.42);
  haloRing.position.set(0.15, -0.05, -0.6);
  sceneGroup.add(haloRing);

  const glyphDefinitions = [
    { letter: "அ", position: [-2.1, 1.05, 0.25], rotation: [0.38, -0.62, 0.08], bob: 0.12, phase: 0.3, spin: 0.0022, parallax: 0.22 },
    { letter: "ஆ", position: [2.15, 0.65, 0.15], rotation: [0.32, 0.75, -0.12], bob: 0.13, phase: 1.8, spin: -0.0019, parallax: 0.18 },
    { letter: "இ", position: [0.1, -1.55, 0.4], rotation: [0.52, 0.08, 0.18], bob: 0.1, phase: 3.2, spin: 0.0024, parallax: 0.26 }
  ];

  const glyphTokens = glyphDefinitions.map((definition) => createGlyphToken(definition));
  glyphTokens.forEach((token) => sceneGroup.add(token));

  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let isVisible = true;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerCurrentX = 0;
  let pointerCurrentY = 0;
  let pulse = 0;

  const resizeScene = () => {
    width = Math.max(root.clientWidth, 280);
    height = Math.max(root.clientHeight, 320);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const setPointerTarget = (event) => {
    const rect = interactiveSurface.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const normalizedX = MathUtils.clamp((event.clientX - rect.left) / rect.width - 0.5, -0.55, 0.55);
    const normalizedY = MathUtils.clamp((event.clientY - rect.top) / rect.height - 0.5, -0.55, 0.55);
    pointerTargetX = normalizedY;
    pointerTargetY = normalizedX;
  };

  const resetPointerTarget = () => {
    pointerTargetX = 0;
    pointerTargetY = 0;
  };

  const pulseScene = () => {
    pulse = 0.16;
  };

  const animate = (time) => {
    animationFrame = 0;

    if (!isVisible) {
      return;
    }

    const elapsed = time * 0.001;
    pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.09;
    pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.09;
    pulse += (0 - pulse) * 0.08;

    sceneGroup.rotation.x = -0.08 + pointerCurrentX * 0.38;
    sceneGroup.rotation.y = 0.14 + pointerCurrentY * 0.62 + Math.sin(elapsed * 0.24) * 0.03;
    sceneGroup.position.x = pointerCurrentY * 0.18;
    sceneGroup.position.y = -pointerCurrentX * 0.12;

    camera.position.x = pointerCurrentY * 0.42;
    camera.position.y = -pointerCurrentX * 0.22;
    camera.lookAt(0, 0, 0);

    accentLight.position.x = -2.8 + pointerCurrentY * 5.5;
    accentLight.position.y = -0.8 - pointerCurrentX * 3.2;

    haloRing.rotation.z += 0.0012;
    haloRing.rotation.x = 1.15 + pointerCurrentX * 0.18;
    haloRing.rotation.y = 0.18 + pointerCurrentY * 0.22;
    haloRing.scale.setScalar(1 + pulse * 0.7);

    renderer.domElement.style.transform = `translate3d(${(pointerCurrentY * 18).toFixed(2)}px, ${(-pointerCurrentX * 12).toFixed(2)}px, 0)`;

    glyphTokens.forEach((token) => {
      token.position.x = token.userData.baseX + pointerCurrentY * token.userData.parallax;
      token.position.y = token.userData.baseY + Math.sin(elapsed * 0.9 + token.userData.phase) * token.userData.bob - pointerCurrentX * token.userData.parallax * 0.55;
      token.rotation.x = token.userData.baseRotationX + pointerCurrentX * 0.35;
      token.rotation.y += token.userData.spin;
      token.rotation.z = token.userData.baseRotationZ + pointerCurrentY * 0.24;
      token.scale.setScalar(1 + (Math.abs(pointerCurrentX) + Math.abs(pointerCurrentY)) * 0.06 + pulse * 0.5);
    });

    renderer.render(scene, camera);
    animationFrame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  };

  const stop = () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  };

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry?.isIntersecting ?? true;
      if (isVisible && !document.hidden) {
        start();
      } else {
        stop();
      }
    },
    { threshold: 0.08 }
  );

  const resizeObserver = new ResizeObserver(() => {
    resizeScene();
  });

  interactiveSurface.addEventListener("pointermove", setPointerTarget, { passive: true });
  interactiveSurface.addEventListener("pointerleave", resetPointerTarget);
  interactiveSurface.addEventListener("pointerdown", pulseScene);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      return;
    }

    if (isVisible) {
      start();
    }
  });

  resizeObserver.observe(root);
  visibilityObserver.observe(root);
  resizeScene();
  root.classList.add("is-ready");
  start();
}

function createRenderer() {
  try {
    return new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power"
    });
  } catch {
    return null;
  }
}

function createGlyphToken({ letter, position, rotation, bob, phase, spin, parallax }) {
  const texture = createGlyphTexture(letter);
  texture.colorSpace = SRGBColorSpace;

  const geometry = new CylinderGeometry(0.68, 0.68, 0.18, 48);
  const sideMaterial = new MeshStandardMaterial({
    color: 0xa86f42,
    roughness: 0.82,
    metalness: 0.16
  });
  const faceMaterial = new MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.08
  });

  const mesh = new Mesh(geometry, [sideMaterial, faceMaterial, faceMaterial.clone()]);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.userData = {
    baseX: position[0],
    baseY: position[1],
    baseRotationX: rotation[0],
    baseRotationZ: rotation[2],
    bob,
    phase,
    spin,
    parallax
  };

  return mesh;
}

function createGlyphTexture(letter) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    return new CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#fff6e7");
  gradient.addColorStop(1, "#eed7a8");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(142, 94, 45, 0.5)";
  context.lineWidth = 6;
  context.stroke();

  context.fillStyle = "#412016";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = '700 132px "Noto Serif Tamil", serif';
  context.fillText(letter, size / 2, size / 2 + 8);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
