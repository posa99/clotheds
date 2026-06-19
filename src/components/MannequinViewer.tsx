import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ClothingItem, BodyConfig, ClothesCategory } from '../types';
import { RotateCw, Move3d, Compass } from 'lucide-react';

interface MannequinViewerProps {
  items: Record<ClothesCategory, ClothingItem>;
  body: BodyConfig;
  activeZoom: 'full' | 'head' | 'torso' | 'feet';
}

export const MannequinViewer: React.FC<MannequinViewerProps> = ({
  items,
  body,
  activeZoom
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Animation/Interaction state
  const [autoRotate, setAutoRotate] = useState(true);
  const yawRef = useRef<number>(0);
  const pitchRef = useRef<number>(0.1); // Slightly tilted downwards for 3D depth
  const isDraggingRef = useRef<boolean>(false);
  const originalMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startRotationRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0.1 });
  const lastInteractTime = useRef<number>(0);

  // Group hosting the rotated model
  const rotationGroupRef = useRef<THREE.Group | null>(null);
  // Group hosting actual geometry meshes (rebuilds dynamically)
  const modelGroupRef = useRef<THREE.Group | null>(null);

  const [sceneReady, setSceneReady] = useState(false);
  const activeZoomRef = useRef(activeZoom);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => {
    activeZoomRef.current = activeZoom;
  }, [activeZoom]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // PRESET SKIN TONES HEX mapped to nice 3D materials
  const getSkinToneColor = (tone: string) => {
    switch (tone) {
      case 'porcelain': return '#FFF0E5';
      case 'sand': return '#F3D2C1';
      case 'caramel': return '#C58F71';
      case 'cocoa': return '#8D5B4C';
      case 'obsidian': return '#452A22';
      case 'emerald': return '#6EE7B7';
      case 'violet': return '#C4B5FD';
      case 'silver': return '#CBD5E1';
      default: return tone;
    }
  };

  // Helper: Generates beautiful procedural repeating canvas textures for pattern support in 3D!
  const createPatternTexture = (
    patternType: 'solid' | 'stripes-h' | 'stripes-v' | 'dots' | 'checkerboard' | 'stars',
    colors: { primary: string; secondary: string; accent: string },
    opacity: number
  ): THREE.Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Background base
    ctx.fillStyle = colors.primary;
    ctx.fillRect(0, 0, 256, 256);

    if (patternType === 'solid') {
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }

    // Secondary layer config
    ctx.fillStyle = colors.secondary;
    ctx.strokeStyle = colors.secondary;
    ctx.globalAlpha = opacity;

    if (patternType === 'stripes-h') {
      ctx.lineWidth = 14;
      for (let y = 0; y < 256; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    } else if (patternType === 'stripes-v') {
      ctx.lineWidth = 14;
      for (let x = 0; x < 256; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }
    } else if (patternType === 'dots') {
      const spacing = 32;
      for (let y = spacing / 2; y < 256; y += spacing) {
        for (let x = spacing / 2; x < 256; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (patternType === 'checkerboard') {
      const size = 32;
      for (let y = 0; y < 256; y += size * 2) {
        for (let x = 0; x < 256; x += size * 2) {
          ctx.fillRect(x, y, size, size);
          ctx.fillRect(x + size, y + size, size, size);
        }
      }
    } else if (patternType === 'stars') {
      const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
      };

      const spacing = 64;
      for (let y = spacing / 2; y < 256; y += spacing) {
        for (let x = spacing / 2; x < 256; x += spacing) {
          drawStar(x, y, 5, 8, 4);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  };

  // Setup basic WebGL Three.js viewport
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene with fog for nice production presentation edge
    const scene = new THREE.Scene();
    scene.background = null; // transparent to use CSS backdrop gradient
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      35,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 4.8);
    cameraRef.current = camera;

    // WebGL Renderer with drawing buffer preservation for high quality image export
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      preserveDrawingBuffer: true 
    });
    renderer.domElement.id = 'mannequin-canvas';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Wipe any stale canvas
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85); // elegant warm tint
    scene.add(ambientLight);

    // Warm Directional Sunlight
    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    dirLight.position.set(4, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Cool Counter Rim Light from back
    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 0.85);
    rimLight.position.set(-4, 0.5, -5);
    scene.add(rimLight);

    // Floor Platform with soft grid marker
    const floorGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.1, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // elegant dark anchor slate
      roughness: 0.6,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -1.18;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle Grid on Floor for modeling depth
    const gridObj = new THREE.GridHelper(2.5, 10, 0x334155, 0x1e293b);
    gridObj.position.y = -1.13;
    scene.add(gridObj);

    // Dynamic rotation nodes
    const rotationGroup = new THREE.Group();
    scene.add(rotationGroup);
    rotationGroupRef.current = rotationGroup;

    const modelGroup = new THREE.Group();
    rotationGroup.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Frame resize support
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // Drag-to-rotate event listeners
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      originalMouseRef.current = { x: e.clientX, y: e.clientY };
      startRotationRef.current = { yaw: yawRef.current, pitch: pitchRef.current };
      lastInteractTime.current = Date.now();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - originalMouseRef.current.x;
      const deltaY = e.clientY - originalMouseRef.current.y;
      
      // Update Rotations
      yawRef.current = startRotationRef.current.yaw + deltaX * 0.0075;
      pitchRef.current = Math.max(-0.4, Math.min(0.6, startRotationRef.current.pitch + deltaY * 0.005));
      lastInteractTime.current = Date.now();
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support for mobile layouts
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      isDraggingRef.current = true;
      originalMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startRotationRef.current = { yaw: yawRef.current, pitch: pitchRef.current };
      lastInteractTime.current = Date.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - originalMouseRef.current.x;
      const deltaY = e.touches[0].clientY - originalMouseRef.current.y;
      
      yawRef.current = startRotationRef.current.yaw + deltaX * 0.009;
      pitchRef.current = Math.max(-0.4, Math.min(0.6, startRotationRef.current.pitch + deltaY * 0.006));
      lastInteractTime.current = Date.now();
    };

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onMouseUp);

    // Kinetic Animation loop
    let animeId: number;
    let cameraTargetY = 0.4;
    let cameraTargetZ = 4.8;

    const animate = () => {
      animeId = requestAnimationFrame(animate);

      // Smooth camera updates based on active zoom levels
      let desiredY = 0.4;
      let desiredZ = 4.8;

      if (activeZoomRef.current === 'head') {
        desiredY = 1.05;
        desiredZ = 1.6;
      } else if (activeZoomRef.current === 'torso') {
        desiredY = 0.45;
        desiredZ = 2.4;
      } else if (activeZoomRef.current === 'feet') {
        desiredY = -0.7;
        desiredZ = 1.8;
      }

      // Smooth damp
      cameraTargetY += (desiredY - cameraTargetY) * 0.08;
      cameraTargetZ += (desiredZ - cameraTargetZ) * 0.08;

      camera.position.y = cameraTargetY;
      camera.position.z = cameraTargetZ;
      camera.lookAt(0, cameraTargetY - (activeZoomRef.current === 'feet' ? 0.1 : 0.05), 0);

      // Slower rotation backup when user is idle
      const now = Date.now();
      if (autoRotateRef.current && !isDraggingRef.current && (now - lastInteractTime.current > 3000)) {
        yawRef.current += 0.004; // steady gentle rotation
      }

      // Apply coordinates safely
      if (rotationGroup) {
        rotationGroup.rotation.y = yawRef.current;
        rotationGroup.rotation.x = pitchRef.current;
      }

      renderer.render(scene, camera);
    };
    animate();
    setSceneReady(true);

    // Deep resource cleanup
    return () => {
      setSceneReady(false);
      cancelAnimationFrame(animeId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onMouseUp);
      
      floorGeo.dispose();
      floorMat.dispose();
      renderer.dispose();
    };
  }, []);

  // Main React effect listening to physique & clothe updates to reconstruct meshes in real-time
  useEffect(() => {
    const scene = sceneRef.current;
    const modelGroup = modelGroupRef.current;
    if (!scene || !modelGroup) return;

    // Clear everything from old group
    while (modelGroup.children.length > 0) {
      const child = modelGroup.children[0];
      modelGroup.remove(child);
      
      // Memory cleanup for geometries and materials
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    }

    // Capture dynamic physique configs
    const scaleX = body.bodyScaleX;
    const scaleY = body.bodyScaleY;

    // Dynamic Skin Material
    const skinHex = getSkinToneColor(body.skinTone);
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinHex),
      roughness: 0.42,
      metalness: 0.02
    });

    // Materials helpers for garments
    const makeClotheMat = (item: ClothingItem) => {
      const colors = item.color;
      const texture = createPatternTexture(item.pattern.type, colors, item.pattern.opacity);
      
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.primary),
        map: item.pattern.type !== 'solid' ? texture : null,
        roughness: 0.65,
        metalness: 0.08,
      });
    };

    const makeAccentMat = (item: ClothingItem) => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(item.color.secondary),
        roughness: 0.55,
        metalness: 0.12
      });
    };

    const makePipingMat = (item: ClothingItem) => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(item.color.accent),
        roughness: 0.4,
        metalness: 0.2
      });
    };

    // ==========================================
    // 1. ANATOMICAL SKELETAL BASE (PERFECTLY ALIGNED)
    // ==========================================
    
    // Core head ball
    const headGeo = new THREE.SphereGeometry(0.183, 64, 48);
    const head = new THREE.Mesh(headGeo, skinMat);
    // Align head vertically relative to dynamic Y physique
    const headY = 1.05 * scaleY;
    head.position.set(0, headY, 0);
    head.scale.set(scaleX, 1, scaleX);
    head.castShadow = true;
    head.receiveShadow = true;
    modelGroup.add(head);

    // Cute Anime Face Detailing (Slight black cylinders for eyelash arches, small spheres for blush)
    const eyeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 32);
    // Left Eyelash
    const eyeL = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: 0x1e293b }));
    eyeL.rotation.z = Math.PI / 2;
    eyeL.rotation.y = 0.2;
    eyeL.position.set(-0.048 * scaleX, headY - 0.015 * scaleY, 0.150 * scaleX);
    modelGroup.add(eyeL);

    // Right Eyelash
    const eyeR = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: 0x1e293b }));
    eyeR.rotation.z = Math.PI / 2;
    eyeR.rotation.y = -0.2;
    eyeR.position.set(0.048 * scaleX, headY - 0.015 * scaleY, 0.150 * scaleX);
    modelGroup.add(eyeR);

    // Rosy Blush Cheek Spheres
    const blushGeo = new THREE.SphereGeometry(0.018, 32, 32);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.5 });
    
    const blushL = new THREE.Mesh(blushGeo, blushMat);
    blushL.position.set(-0.08 * scaleX, headY - 0.05 * scaleY, 0.141 * scaleX);
    modelGroup.add(blushL);

    const blushR = new THREE.Mesh(blushGeo, blushMat);
    blushR.position.set(0.08 * scaleX, headY - 0.05 * scaleY, 0.141 * scaleX);
    modelGroup.add(blushR);

    // Symmetrical Ears
    const earGeo = new THREE.SphereGeometry(0.028 * scaleX, 32, 32);
    const earL = new THREE.Mesh(earGeo, skinMat);
    earL.position.set(-0.177 * scaleX, headY, 0);
    earL.castShadow = true;
    earL.receiveShadow = true;
    modelGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, skinMat);
    earR.position.set(0.177 * scaleX, headY, 0);
    earR.castShadow = true;
    earR.receiveShadow = true;
    modelGroup.add(earR);

    // Neck Column
    const neckHeight = 0.18 * scaleY;
    const neckGeo = new THREE.CylinderGeometry(0.05 * scaleX, 0.058 * scaleX, neckHeight, 64);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    const neckY = headY - 0.18 * scaleY;
    neck.position.set(0, neckY, 0);
    neck.castShadow = true;
    neck.receiveShadow = true;
    modelGroup.add(neck);

    // Symmetrical Collar Bones (visualized via slim capsule bar)
    const collarbarGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.38 * scaleX, 32);
    const collarbar = new THREE.Mesh(collarbarGeo, new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.7 }));
    collarbar.rotation.z = Math.PI / 2;
    collarbar.position.set(0, neckY - neckHeight/2, 0.05 * scaleX);
    modelGroup.add(collarbar);

    // Upper Chest/Torso Container
    const chestHeight = 0.52 * scaleY;
    const chestGeo = new THREE.CylinderGeometry(0.21 * scaleX, 0.17 * scaleX, chestHeight, 64);
    const chest = new THREE.Mesh(chestGeo, skinMat);
    const chestY = neckY - neckHeight/2 - chestHeight/2;
    chest.position.set(0, chestY, 0);
    chest.castShadow = true;
    chest.receiveShadow = true;
    modelGroup.add(chest);

    // Pelvis / Waist hip base
    const pelvisHeight = 0.3 * scaleY;
    const pelvisGeo = new THREE.CylinderGeometry(0.17 * scaleX, 0.2 * scaleX, pelvisHeight, 64);
    const pelvis = new THREE.Mesh(pelvisGeo, skinMat);
    const pelvisY = chestY - chestHeight/2 - pelvisHeight/2;
    pelvis.position.set(0, pelvisY, 0);
    pelvis.castShadow = true;
    pelvis.receiveShadow = true;
    modelGroup.add(pelvis);

    // Absolute alignment positions for limbs (Guarantees identical left and right sides!)
    const legXOffset = 0.12 * scaleX; // Equal spacing from alignment center
    const upperLegLength = 0.52 * scaleY;
    const lowerLegLength = 0.52 * scaleY;
    const kneeY = pelvisY - pelvisHeight/2 - upperLegLength/2;
    const ankleY = kneeY - lowerLegLength;
    const actualKneeY = pelvisY - pelvisHeight/2 - upperLegLength;
    const actualAnkleY = ankleY - lowerLegLength / 2;

    // Symmetrical LEGS & KNEES (Addressing identical scaling & straightness)
    // Left Leg Upper
    const legUpperLGeo = new THREE.CylinderGeometry(0.082 * scaleX, 0.072 * scaleX, upperLegLength, 64);
    const legUpperL = new THREE.Mesh(legUpperLGeo, skinMat);
    legUpperL.position.set(-legXOffset, pelvisY - pelvisHeight/2 - upperLegLength/2, 0);
    legUpperL.castShadow = true;
    legUpperL.receiveShadow = true;
    modelGroup.add(legUpperL);

    // Right Leg Upper (Mirroring Left Upper perfectly)
    const legUpperRGeo = new THREE.CylinderGeometry(0.082 * scaleX, 0.072 * scaleX, upperLegLength, 64);
    const legUpperR = new THREE.Mesh(legUpperRGeo, skinMat);
    legUpperR.position.set(legXOffset, pelvisY - pelvisHeight/2 - upperLegLength/2, 0);
    legUpperR.castShadow = true;
    legUpperR.receiveShadow = true;
    modelGroup.add(legUpperR);

    // Left Leg Lower
    const legLowerLGeo = new THREE.CylinderGeometry(0.068 * scaleX, 0.055 * scaleX, lowerLegLength, 64);
    const legLowerL = new THREE.Mesh(legLowerLGeo, skinMat);
    legLowerL.position.set(-legXOffset, ankleY, 0);
    legLowerL.castShadow = true;
    legLowerL.receiveShadow = true;
    modelGroup.add(legLowerL);

    // Right Leg Lower (Mirroring Left Lower perfectly)
    const legLowerRGeo = new THREE.CylinderGeometry(0.068 * scaleX, 0.055 * scaleX, lowerLegLength, 64);
    const legLowerR = new THREE.Mesh(legLowerRGeo, skinMat);
    legLowerR.position.set(legXOffset, ankleY, 0);
    legLowerR.castShadow = true;
    legLowerR.receiveShadow = true;
    modelGroup.add(legLowerR);

    // Joint Spheres (Knees - perfectly aligned at anatomical thigh-calf transition)
    const jointGeo = new THREE.SphereGeometry(0.072 * scaleX, 32, 32);
    
    const kneeL = new THREE.Mesh(jointGeo, skinMat);
    kneeL.position.set(-legXOffset, actualKneeY, 0.005);
    kneeL.castShadow = true;
    kneeL.receiveShadow = true;
    modelGroup.add(kneeL);

    const kneeR = new THREE.Mesh(jointGeo, skinMat);
    kneeR.position.set(legXOffset, actualKneeY, 0.005);
    kneeR.castShadow = true;
    kneeR.receiveShadow = true;
    modelGroup.add(kneeR);

    // Symmetrical Ankle Joint Spheres
    const ankleJointGeo = new THREE.SphereGeometry(0.055 * scaleX, 32, 32);
    
    const ankleL = new THREE.Mesh(ankleJointGeo, skinMat);
    ankleL.position.set(-legXOffset, actualAnkleY, 0);
    ankleL.castShadow = true;
    ankleL.receiveShadow = true;
    modelGroup.add(ankleL);

    const ankleR = new THREE.Mesh(ankleJointGeo, skinMat);
    ankleR.position.set(legXOffset, actualAnkleY, 0);
    ankleR.castShadow = true;
    ankleR.receiveShadow = true;
    modelGroup.add(ankleR);

    // Symmetrical Feet (Sleek natural anatomical wedge shape)
    const footBaseGeo = new THREE.BoxGeometry(0.085 * scaleX, 0.06 * scaleY, 0.165 * scaleX);
    
    const footL = new THREE.Mesh(footBaseGeo, skinMat);
    footL.position.set(-legXOffset, actualAnkleY - 0.02 * scaleY, 0.045 * scaleX);
    footL.castShadow = true;
    footL.receiveShadow = true;
    modelGroup.add(footL);

    const footR = new THREE.Mesh(footBaseGeo, skinMat);
    footR.position.set(legXOffset, actualAnkleY - 0.02 * scaleY, 0.045 * scaleX);
    footR.castShadow = true;
    footR.receiveShadow = true;
    modelGroup.add(footR);

    // Symmetrical ARMS and Joint Spheres (Shoulders & Elbows)
    const armXOffset = 0.28 * scaleX;
    const armLength = 0.44 * scaleY;
    const armY = chestY + 0.12 * scaleY;

    // Symmetrical Shoulder Joint Spheres
    const shoulderGeo = new THREE.SphereGeometry(0.055 * scaleX, 32, 32);
    
    const shoulderL = new THREE.Mesh(shoulderGeo, skinMat);
    shoulderL.position.set(-armXOffset, armY, 0);
    shoulderL.castShadow = true;
    shoulderL.receiveShadow = true;
    modelGroup.add(shoulderL);

    const shoulderR = new THREE.Mesh(shoulderGeo, skinMat);
    shoulderR.position.set(armXOffset, armY, 0);
    shoulderR.castShadow = true;
    shoulderR.receiveShadow = true;
    modelGroup.add(shoulderR);

    // Left Arm (Base Skin)
    const armLGeo = new THREE.CylinderGeometry(0.048 * scaleX, 0.04 * scaleX, armLength, 64);
    const armL = new THREE.Mesh(armLGeo, skinMat);
    armL.position.set(-armXOffset, armY - armLength/2, 0);
    armL.rotation.z = -0.05; // natural posture angle
    armL.castShadow = true;
    armL.receiveShadow = true;
    modelGroup.add(armL);

    // Right Arm (Base Skin - Mirrored)
    const armRGeo = new THREE.CylinderGeometry(0.048 * scaleX, 0.04 * scaleX, armLength, 64);
    const armR = new THREE.Mesh(armRGeo, skinMat);
    armR.position.set(armXOffset, armY - armLength/2, 0);
    armR.rotation.z = 0.05;
    armR.castShadow = true;
    armR.receiveShadow = true;
    modelGroup.add(armR);

    // Symmetrical Elbow Joint Spheres
    const elbowGeo = new THREE.SphereGeometry(0.042 * scaleX, 32, 32);
    
    const elbowL = new THREE.Mesh(elbowGeo, skinMat);
    elbowL.position.set(-armXOffset - 0.01 * scaleX, armY - armLength, 0.01 * scaleX);
    elbowL.castShadow = true;
    elbowL.receiveShadow = true;
    modelGroup.add(elbowL);

    const elbowR = new THREE.Mesh(elbowGeo, skinMat);
    elbowR.position.set(armXOffset + 0.01 * scaleX, armY - armLength, 0.01 * scaleX);
    elbowR.castShadow = true;
    elbowR.receiveShadow = true;
    modelGroup.add(elbowR);

    // Left Forearm
    const forearmLGeo = new THREE.CylinderGeometry(0.038 * scaleX, 0.032 * scaleX, armLength, 64);
    const forearmL = new THREE.Mesh(forearmLGeo, skinMat);
    forearmL.position.set(-armXOffset - 0.02 * scaleX, armY - armLength * 1.4, 0.02 * scaleX);
    forearmL.rotation.x = 0.1;
    forearmL.castShadow = true;
    forearmL.receiveShadow = true;
    modelGroup.add(forearmL);

    // Right Forearm
    const forearmRGeo = new THREE.CylinderGeometry(0.038 * scaleX, 0.032 * scaleX, armLength, 64);
    const forearmR = new THREE.Mesh(forearmRGeo, skinMat);
    forearmR.position.set(armXOffset + 0.02 * scaleX, armY - armLength * 1.4, 0.02 * scaleX);
    forearmR.rotation.x = 0.1;
    forearmR.castShadow = true;
    forearmR.receiveShadow = true;
    modelGroup.add(forearmR);

    // Symmetrical Hands (clean small rounded boxes/capsules)
    const handGeo = new THREE.SphereGeometry(0.032 * scaleX, 32, 32);
    
    const handL = new THREE.Mesh(handGeo, skinMat);
    handL.position.set(-armXOffset - 0.02 * scaleX, armY - armLength * 1.9, 0.04 * scaleX);
    handL.castShadow = true;
    handL.receiveShadow = true;
    modelGroup.add(handL);

    const handR = new THREE.Mesh(handGeo, skinMat);
    handR.position.set(armXOffset + 0.02 * scaleX, armY - armLength * 1.9, 0.04 * scaleX);
    handR.castShadow = true;
    handR.receiveShadow = true;
    modelGroup.add(handR);


    // ==========================================
    // 2. TOPS LAYER (Styled 3D Garments)
    // ==========================================
    const topItem = items.top;
    if (topItem.visible) {
      const topMat = makeClotheMat(topItem);
      const topAccent = makeAccentMat(topItem);
      const topPiping = makePipingMat(topItem);

      // Overlap offset for clothing layers
      const fitOffset = 0.022;

      // Check tops styles
      if (topItem.style === 'tshirt') {
        // Torso container
        const shirtTorsoGeo = new THREE.CylinderGeometry(
          (0.21 + fitOffset) * scaleX,
          (0.17 + fitOffset) * scaleX,
          chestHeight * 1.020,
          64
        );
        const shirt = new THREE.Mesh(shirtTorsoGeo, topMat);
        shirt.position.set(0, chestY, 0);
        shirt.castShadow = true;
        shirt.receiveShadow = true;
        modelGroup.add(shirt);

        // Shoulder short sleeve sleeves
        const sleeveLength = 0.18 * scaleY;
        const sleeveGeo = new THREE.CylinderGeometry(
          (0.055 + fitOffset) * scaleX,
          (0.046 + fitOffset) * scaleX,
          sleeveLength,
          64
        );

        const sleeveL = new THREE.Mesh(sleeveGeo, topMat);
        sleeveL.position.set(-armXOffset, armY - sleeveLength/2, 0);
        sleeveL.rotation.z = -0.05;
        sleeveL.castShadow = true;
        modelGroup.add(sleeveL);

        const sleeveR = new THREE.Mesh(sleeveGeo, topMat);
        sleeveR.position.set(armXOffset, armY - sleeveLength/2, 0);
        sleeveR.rotation.z = 0.05;
        sleeveR.castShadow = true;
        modelGroup.add(sleeveR);

        // High fidelity neck collar collar ring
        const collarRingGeo = new THREE.TorusGeometry(0.082 * scaleX, 0.015, 16, 64);
        const collarRing = new THREE.Mesh(collarRingGeo, topAccent);
        collarRing.rotation.x = Math.PI / 2;
        collarRing.position.set(0, chestY + chestHeight/2 - 0.01, 0);
        modelGroup.add(collarRing);

      } else if (topItem.style === 'hoodie') {
        // Bulkier fit
        const hoodieFit = 0.048;
        const hoodieHeight = chestHeight * 1.08;
        const hoodieTorsoGeo = new THREE.CylinderGeometry(
          (0.21 + hoodieFit) * scaleX,
          (0.18 + hoodieFit) * scaleX,
          hoodieHeight,
          64
        );
        const hoodie = new THREE.Mesh(hoodieTorsoGeo, topMat);
        hoodie.position.set(0, chestY - 0.02 * scaleY, 0);
        hoodie.castShadow = true;
        hoodie.receiveShadow = true;
        modelGroup.add(hoodie);

        // Bulky pockets kangaroo pouch on stomach
        const pouchGeo = new THREE.BoxGeometry(0.22 * scaleX, 0.15 * scaleY, 0.055 * scaleX);
        const pouch = new THREE.Mesh(pouchGeo, topAccent);
        pouch.position.set(0, chestY - 0.12 * scaleY, (0.17 + hoodieFit) * scaleZOffset(scaleX));
        pouch.castShadow = true;
        modelGroup.add(pouch);

        // Long slouched sleeves that extend past elbows
        const longSleeveLength = 0.72 * scaleY;
        const sleeveGeo = new THREE.CylinderGeometry(
          (0.055 + hoodieFit) * scaleX,
          (0.042 + hoodieFit) * scaleX,
          longSleeveLength,
          64
        );

        const sleeveL = new THREE.Mesh(sleeveGeo, topMat);
        sleeveL.position.set(-armXOffset - 0.01, armY - longSleeveLength/2, 0.01);
        sleeveL.rotation.z = -0.06;
        sleeveL.castShadow = true;
        modelGroup.add(sleeveL);

        const sleeveR = new THREE.Mesh(sleeveGeo, topMat);
        sleeveR.position.set(armXOffset + 0.01, armY - longSleeveLength/2, 0.01);
        sleeveR.rotation.z = 0.06;
        sleeveR.castShadow = true;
        modelGroup.add(sleeveR);

        // Cozy fabric fold hood on reverse back shoulder area
        const hoodGeo = new THREE.SphereGeometry(0.18, 32, 24);
        const hood = new THREE.Mesh(hoodGeo, topAccent);
        hood.position.set(0, headY - 0.15 * scaleY, -0.15 * scaleX);
        hood.castShadow = true;
        modelGroup.add(hood);

        // Hoodie metallic drawstring ropes
        const ropeGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.28 * scaleY, 16);
        const ropeTipGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 16);
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.2 });

        const ropeL = new THREE.Mesh(ropeGeo, topPiping);
        ropeL.position.set(-0.06 * scaleX, chestY + 0.15 * scaleY, 0.21 * scaleX);
        ropeL.rotation.z = 0.08;
        modelGroup.add(ropeL);

        const tipL = new THREE.Mesh(ropeTipGeo, silverMat);
        tipL.position.set(-0.07 * scaleX, chestY + 0.01 * scaleY, 0.21 * scaleX);
        modelGroup.add(tipL);

        const ropeR = new THREE.Mesh(ropeGeo, topPiping);
        ropeR.position.set(0.06 * scaleX, chestY + 0.15 * scaleY, 0.21 * scaleX);
        ropeR.rotation.z = -0.08;
        modelGroup.add(ropeR);

        const tipR = new THREE.Mesh(ropeTipGeo, silverMat);
        tipR.position.set(0.07 * scaleX, chestY + 0.01 * scaleY, 0.21 * scaleX);
        modelGroup.add(tipR);

      } else if (topItem.style === 'sweater') {
        const knitFit = 0.04;
        const sweaterHeight = chestHeight * 1.05;
        const sweaterTorsoGeo = new THREE.CylinderGeometry(
          (0.21 + knitFit) * scaleX,
          (0.18 + knitFit) * scaleX,
          sweaterHeight,
          64
        );
        const sweater = new THREE.Mesh(sweaterTorsoGeo, topMat);
        sweater.position.set(0, chestY - 0.01 * scaleY, 0);
        sweater.castShadow = true;
        sweater.receiveShadow = true;
        modelGroup.add(sweater);

        // Long sweater sleeves
        const longSleeveLength = 0.74 * scaleY;
        const sleeveGeo = new THREE.CylinderGeometry(
          (0.055 + knitFit) * scaleX,
          (0.042 + knitFit) * scaleX,
          longSleeveLength,
          64
        );

        const sleeveL = new THREE.Mesh(sleeveGeo, topMat);
        sleeveL.position.set(-armXOffset, armY - longSleeveLength/2, 0);
        sleeveL.rotation.z = -0.05;
        sleeveL.castShadow = true;
        modelGroup.add(sleeveL);

        const sleeveR = new THREE.Mesh(sleeveGeo, topMat);
        sleeveR.position.set(armXOffset, armY - longSleeveLength/2, 0);
        sleeveR.rotation.z = 0.05;
        sleeveR.castShadow = true;
        modelGroup.add(sleeveR);

        // Ribbed cuffs
        const cuffGeo = new THREE.CylinderGeometry((0.042 + knitFit) * scaleX, (0.042 + knitFit) * scaleX, 0.04, 64);
        
        const cuffL = new THREE.Mesh(cuffGeo, topAccent);
        cuffL.position.set(-armXOffset, armY - longSleeveLength + 0.02, 0);
        modelGroup.add(cuffL);

        const cuffR = new THREE.Mesh(cuffGeo, topAccent);
        cuffR.position.set(armXOffset, armY - longSleeveLength + 0.02, 0);
        modelGroup.add(cuffR);

        // Thick Crewneck collar ribbed rim
        const sweaterBandGeo = new THREE.CylinderGeometry((0.10 * scaleX) + knitFit * scaleX, (0.10 * scaleX) + knitFit * scaleX, 0.033, 64);
        const band = new THREE.Mesh(sweaterBandGeo, topAccent);
        band.position.set(0, chestY + sweaterHeight/2, 0);
        modelGroup.add(band);

      } else if (topItem.style === 'croptop') {
        // High waist exposure crop fit
        const cropHeight = chestHeight * 0.55;
        const cropTorsoGeo = new THREE.CylinderGeometry(
          (0.215 + fitOffset) * scaleX,
          (0.198 + fitOffset) * scaleX,
          cropHeight,
          64
        );
        const croptop = new THREE.Mesh(cropTorsoGeo, topMat);
        croptop.position.set(0, chestY + cropHeight / 2.2, 0);
        croptop.castShadow = true;
        modelGroup.add(croptop);

        // Shoulder thin support straps
        const strapGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.18 * scaleY, 32);
        
        const strapL = new THREE.Mesh(strapGeo, topAccent);
        strapL.position.set(-0.11 * scaleX, chestY + cropHeight * 0.9, 0.12 * scaleX);
        strapL.rotation.z = 0.1;
        modelGroup.add(strapL);

        const strapR = new THREE.Mesh(strapGeo, topAccent);
        strapR.position.set(0.11 * scaleX, chestY + cropHeight * 0.9, 0.12 * scaleX);
        strapR.rotation.z = -0.1;
        modelGroup.add(strapR);

      } else if (topItem.style === 'tanktop') {
        const tankFit = 0.022;
        const tankTorsoGeo = new THREE.CylinderGeometry(
          (0.21 + tankFit) * scaleX,
          (0.17 + tankFit) * scaleX,
          chestHeight * 1.01,
          64
        );
        const tank = new THREE.Mesh(tankTorsoGeo, topMat);
        tank.position.set(0, chestY, 0);
        tank.castShadow = true;
        tank.receiveShadow = true;
        modelGroup.add(tank);

        // Detailed sleeveless racer armholes layout outlines
        const armholeTrimGeo = new THREE.TorusGeometry(0.09 * scaleX, 0.01, 16, 64);
        
        const holeL = new THREE.Mesh(armholeTrimGeo, topAccent);
        holeL.position.set(-armXOffset + 0.08 * scaleX, armY, 0);
        holeL.rotation.y = Math.PI / 2;
        modelGroup.add(holeL);

        const holeR = new THREE.Mesh(armholeTrimGeo, topAccent);
        holeR.position.set(armXOffset - 0.08 * scaleX, armY, 0);
        holeR.rotation.y = Math.PI / 2;
        modelGroup.add(holeR);

      } else if (topItem.style === 'blazer') {
        // Blazer jacket shell left and right open folds
        const blazerFit = 0.038;
        const blazerHeight = chestHeight * 1.05;
        const blazerGeo = new THREE.CylinderGeometry(
          (0.222 + blazerFit) * scaleX,
          (0.185 + blazerFit) * scaleX,
          blazerHeight,
          64,
          1,
          true,
          0.65, // partial cylinder to simulate open double breasted outer look
          Math.PI * 1.65
        );
        const blazer = new THREE.Mesh(blazerGeo, topMat);
        blazer.position.set(0, chestY, 0);
        blazer.rotation.y = Math.PI;
        blazer.castShadow = true;
        modelGroup.add(blazer);

        // Sleek white dynamic inner collar shirt inside blazer
        const innerShirtGeo = new THREE.CylinderGeometry(0.198 * scaleX, 0.17 * scaleX, chestHeight * 0.95, 64);
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 });
        const innerShirt = new THREE.Mesh(innerShirtGeo, whiteMat);
        innerShirt.position.set(0, chestY, 0.01 * scaleX);
        modelGroup.add(innerShirt);

        // Highly detailed 3D Tie hanging down
        const tieGeo = new THREE.BoxGeometry(0.038 * scaleX, 0.28 * scaleY, 0.015 * scaleX);
        const tie = new THREE.Mesh(tieGeo, topPiping);
        tie.position.set(0, chestY + 0.05 * scaleY, 0.187 * scaleX);
        tie.rotation.x = 0.05;
        tie.castShadow = true;
        modelGroup.add(tie);

        // Golden metallic closure button in lower chest
        const btnGeo = new THREE.SphereGeometry(0.016, 16, 16);
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.85, roughness: 0.1 });
        const button = new THREE.Mesh(btnGeo, goldMat);
        button.position.set(0, chestY - 0.08 * scaleY, 0.225 * scaleX);
        modelGroup.add(button);

        // Tailored tailored long coat sleeves
        const coatSleeveLength = 0.72 * scaleY;
        const sleeveGeo = new THREE.CylinderGeometry(
          (0.055 + blazerFit) * scaleX,
          (0.042 + blazerFit) * scaleX,
          coatSleeveLength,
          64
        );

        const sleeveL = new THREE.Mesh(sleeveGeo, topMat);
        sleeveL.position.set(-armXOffset, armY - coatSleeveLength/2, 0);
        sleeveL.rotation.z = -0.05;
        sleeveL.castShadow = true;
        modelGroup.add(sleeveL);

        const sleeveR = new THREE.Mesh(sleeveGeo, topMat);
        sleeveR.position.set(armXOffset, armY - coatSleeveLength/2, 0);
        sleeveR.rotation.z = 0.05;
        sleeveR.castShadow = true;
        modelGroup.add(sleeveR);
      }
    }


    // ==========================================
    // 3. BOTTOMS LAYER (Jeans, Skirts, etc.)
    // ==========================================
    const bottomItem = items.bottom;
    if (bottomItem.visible) {
      const bMat = makeClotheMat(bottomItem);
      const bAccent = makeAccentMat(bottomItem);
      const bPiping = makePipingMat(bottomItem);

      const pantsFit = 0.022;

      if (bottomItem.style === 'jeans') {
        // Waistband / hip wrap
        const waistGeo = new THREE.CylinderGeometry(
          (0.185 + pantsFit) * scaleX,
          (0.208 + pantsFit) * scaleX,
          pelvisHeight * 1.05,
          64
        );
        const waist = new THREE.Mesh(waistGeo, bMat);
        waist.position.set(0, pelvisY, 0);
        waist.castShadow = true;
        waist.receiveShadow = true;
        modelGroup.add(waist);

        // Left full leg sleeve
        const legSleeveHeight = (upperLegLength + lowerLegLength) * 0.98;
        const legSleeveGeo = new THREE.CylinderGeometry(
          (0.088 + pantsFit) * scaleX,
          (0.065 + pantsFit) * scaleX,
          legSleeveHeight,
          64
        );

        const legL = new THREE.Mesh(legSleeveGeo, bMat);
        legL.position.set(-legXOffset, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0);
        legL.castShadow = true;
        modelGroup.add(legL);

        // Right full leg sleeve (Mirrored perfectly)
        const legR = new THREE.Mesh(legSleeveGeo, bMat);
        legR.position.set(legXOffset, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0);
        legR.castShadow = true;
        modelGroup.add(legR);

        // Contrast denim copper waist belt loops
        const beltLoopGeo = new THREE.BoxGeometry(0.012, 0.05, 0.015);
        for (let i = 0; i < 5; i++) {
          const loop = new THREE.Mesh(beltLoopGeo, bAccent);
          const angle = (i - 2) * 0.55;
          const r = (0.19 + pantsFit) * scaleX;
          loop.position.set(Math.sin(angle) * r, pelvisY + 0.08 * scaleY, Math.cos(angle) * r);
          loop.rotation.y = angle;
          modelGroup.add(loop);
        }

      } else if (bottomItem.style === 'shorts') {
        const waistGeo = new THREE.CylinderGeometry(
          (0.185 + pantsFit) * scaleX,
          (0.208 + pantsFit) * scaleX,
          pelvisHeight * 1.05,
          64
        );
        const waist = new THREE.Mesh(waistGeo, bMat);
        waist.position.set(0, pelvisY, 0);
        waist.castShadow = true;
        modelGroup.add(waist);

        // Short leg cuffs cut in upper thighs
        const shortHeight = upperLegLength * 0.55;
        const legSleeveGeo = new THREE.CylinderGeometry(
          (0.09 + pantsFit) * scaleX,
          (0.08 + pantsFit) * scaleX,
          shortHeight,
          64
        );

        const legL = new THREE.Mesh(legSleeveGeo, bMat);
        legL.position.set(-legXOffset, pelvisY - pelvisHeight/2 - shortHeight/2, 0);
        legL.castShadow = true;
        modelGroup.add(legL);

        const legR = new THREE.Mesh(legSleeveGeo, bMat);
        legR.position.set(legXOffset, pelvisY - pelvisHeight/2 - shortHeight/2, 0);
        legR.castShadow = true;
        modelGroup.add(legR);

      } else if (bottomItem.style === 'skirt') {
        // High fidelity flared pleated cone/skirt
        const skirtTopRad = (0.17 + pantsFit) * scaleX;
        const skirtBotRad = (0.42 + pantsFit) * scaleX;
        const skirtLength = 0.44 * scaleY;

        const skirtGeo = new THREE.CylinderGeometry(skirtTopRad, skirtBotRad, skirtLength, 64, 1, true);
        const skirt = new THREE.Mesh(skirtGeo, bMat);
        skirt.position.set(0, pelvisY - skirtLength/3, 0);
        skirt.castShadow = true;
        skirt.receiveShadow = true;
        modelGroup.add(skirt);

        // Skirt high waist solid belt strap banding
        const beltBandGeo = new THREE.CylinderGeometry((0.185 + pantsFit) * scaleX, (0.185 + pantsFit) * scaleX, 0.05, 64);
        const belt = new THREE.Mesh(beltBandGeo, bAccent);
        belt.position.set(0, pelvisY + 0.08 * scaleY, 0);
        modelGroup.add(belt);

        // Polished golden rectangular belt buckle
        const buckleGeo = new THREE.BoxGeometry(0.05 * scaleX, 0.038 * scaleY, 0.02 * scaleX);
        const buckle = new THREE.Mesh(buckleGeo, bPiping);
        buckle.position.set(0, pelvisY + 0.08 * scaleY, (0.188 + pantsFit) * scaleZOffset(scaleX));
        modelGroup.add(buckle);

      } else if (bottomItem.style === 'cargo') {
        const cargoFit = 0.040;
        const waistGeo = new THREE.CylinderGeometry(
          (0.185 + cargoFit) * scaleX,
          (0.208 + cargoFit) * scaleX,
          pelvisHeight * 1.05,
          64
        );
        const waist = new THREE.Mesh(waistGeo, bMat);
        waist.position.set(0, pelvisY, 0);
        waist.castShadow = true;
        modelGroup.add(waist);

        // Symmetrical baggy cargo legs
        const legSleeveHeight = (upperLegLength + lowerLegLength) * 0.98;
        const legSleeveGeo = new THREE.CylinderGeometry(
          (0.10 + cargoFit) * scaleX,
          (0.08 + cargoFit) * scaleX,
          legSleeveHeight,
          64
        );

        const legL = new THREE.Mesh(legSleeveGeo, bMat);
        legL.position.set(-legXOffset, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0);
        legL.castShadow = true;
        modelGroup.add(legL);

        const legR = new THREE.Mesh(legSleeveGeo, bMat);
        legR.position.set(legXOffset, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0);
        legR.castShadow = true;
        modelGroup.add(legR);

        // Symmetrical 3D Pocket blocks protruding from side of cargo legs!
        const pocketGeo = new THREE.BoxGeometry(0.07 * scaleX, 0.12 * scaleY, 0.06 * scaleX);
        
        const pocketL = new THREE.Mesh(pocketGeo, bAccent);
        pocketL.position.set(-legXOffset - (0.10 + cargoFit) * scaleX, pelvisY - pelvisHeight/2 - upperLegLength + 0.05, 0);
        pocketL.rotation.y = Math.PI / 2;
        pocketL.castShadow = true;
        modelGroup.add(pocketL);

        const pocketR = new THREE.Mesh(pocketGeo, bAccent);
        pocketR.position.set(legXOffset + (0.10 + cargoFit) * scaleX, pelvisY - pelvisHeight/2 - upperLegLength + 0.05, 0);
        pocketR.rotation.y = -Math.PI / 2;
        pocketR.castShadow = true;
        modelGroup.add(pocketR);

      } else if (bottomItem.style === 'joggers') {
        const jogFit = 0.032;
        const waistGeo = new THREE.CylinderGeometry(
          (0.185 + jogFit) * scaleX,
          (0.208 + jogFit) * scaleX,
          pelvisHeight * 1.05,
          64
        );
        const waist = new THREE.Mesh(waistGeo, bMat);
        waist.position.set(0, pelvisY, 0);
        waist.castShadow = true;
        modelGroup.add(waist);

        // Symmetrical joggers leg sleeves
        const legSleeveHeight = (upperLegLength + lowerLegLength) * 0.95;
        const legSleeveGeo = new THREE.CylinderGeometry(
          (0.095 + jogFit) * scaleX,
          (0.068 + jogFit) * scaleX,
          legSleeveHeight,
          64
        );

        const legL = new THREE.Mesh(legSleeveGeo, bMat);
        legL.position.set(-legXOffset, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0);
        legL.castShadow = true;
        modelGroup.add(legL);

        const legR = new THREE.Mesh(legSleeveGeo, bMat);
        legR.position.set(legXOffset, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0);
        legR.castShadow = true;
        modelGroup.add(legR);

        // Sporty side vertical contrast mesh piping tape running down the legs
        const stripeGeo = new THREE.BoxGeometry(0.015 * scaleX, legSleeveHeight, 0.015 * scaleX);
        
        const stripeL = new THREE.Mesh(stripeGeo, bPiping);
        stripeL.position.set(-legXOffset - (0.095 + jogFit) * scaleX, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0.01);
        modelGroup.add(stripeL);

        const stripeR = new THREE.Mesh(stripeGeo, bPiping);
        stripeR.position.set(legXOffset + (0.095 + jogFit) * scaleX, pelvisY - pelvisHeight/2 - legSleeveHeight/2, 0.01);
        modelGroup.add(stripeR);

        // elastic cuff cuffs on ankles wrapping ankles
        const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.068 * scaleX, 0.068 * scaleX, 0.05, 64), bAccent);
        cuffL.position.set(-legXOffset, actualAnkleY + 0.025 * scaleY, 0);
        modelGroup.add(cuffL);

        const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.068 * scaleX, 0.068 * scaleX, 0.05, 64), bAccent);
        cuffR.position.set(legXOffset, actualAnkleY + 0.025 * scaleY, 0);
        modelGroup.add(cuffR);
      }
    }


    // ==========================================
    // 4. FOOTWEAR LAYER (Beautiful Symmetrical Shoes)
    // ==========================================
    const footItem = items.footwear;
    if (footItem.visible) {
      const fMat = makeClotheMat(footItem);
      const fAccent = makeAccentMat(footItem);
      const fPiping = makePipingMat(footItem);

      const footYPos = actualAnkleY - 0.02 * scaleY;

      if (footItem.style === 'sneakers') {
        // Left athletic shoe box
        const footLGeo = new THREE.BoxGeometry(0.12 * scaleX, 0.09 * scaleY, 0.22 * scaleX);
        const shoeL = new THREE.Mesh(footLGeo, fMat);
        shoeL.position.set(-legXOffset, footYPos, 0.05 * scaleX);
        shoeL.castShadow = true;
        modelGroup.add(shoeL);

        // Chunky sneakers platform sole
        const soleLGeo = new THREE.BoxGeometry(0.13 * scaleX, 0.03 * scaleY, 0.24 * scaleX);
        const soleL = new THREE.Mesh(soleLGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
        soleL.position.set(-legXOffset, footYPos - 0.05 * scaleY, 0.05 * scaleX);
        soleL.castShadow = true;
        modelGroup.add(soleL);

        // Right Shoe (Symmetrical mirror)
        const shoeR = new THREE.Mesh(footLGeo, fMat);
        shoeR.position.set(legXOffset, footYPos, 0.05 * scaleX);
        shoeR.castShadow = true;
        modelGroup.add(shoeR);

        const soleR = new THREE.Mesh(soleLGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
        soleR.position.set(legXOffset, footYPos - 0.05 * scaleY, 0.05 * scaleX);
        soleR.castShadow = true;
        modelGroup.add(soleR);

      } else if (footItem.style === 'boots') {
        const bootHeight = 0.22 * scaleY;
        const bootLegGeo = new THREE.CylinderGeometry(0.082 * scaleX, 0.085 * scaleX, bootHeight, 32);
        
        // Left rugged boot leg sleeve
        const bootLegL = new THREE.Mesh(bootLegGeo, fMat);
        bootLegL.position.set(-legXOffset, footYPos + bootHeight/2.5, 0.01);
        bootLegL.castShadow = true;
        modelGroup.add(bootLegL);

        const bootFootGeo = new THREE.BoxGeometry(0.12 * scaleX, 0.11 * scaleY, 0.23 * scaleX);
        const bootFootL = new THREE.Mesh(bootFootGeo, fAccent);
        bootFootL.position.set(-legXOffset, footYPos, 0.05 * scaleX);
        bootFootL.castShadow = true;
        modelGroup.add(bootFootL);

        // Right Boot (Perfect mirror)
        const bootLegR = new THREE.Mesh(bootLegGeo, fMat);
        bootLegR.position.set(legXOffset, footYPos + bootHeight/2.5, 0.01);
        bootLegR.castShadow = true;
        modelGroup.add(bootLegR);

        const bootFootR = new THREE.Mesh(bootFootGeo, fAccent);
        bootFootR.position.set(legXOffset, footYPos, 0.05 * scaleX);
        bootFootR.castShadow = true;
        modelGroup.add(bootFootR);

        // Chunky tactical lug soles
        const soleGeo = new THREE.BoxGeometry(0.13 * scaleX, 0.045 * scaleY, 0.24 * scaleX);
        
        const soleL = new THREE.Mesh(soleGeo, fPiping);
        soleL.position.set(-legXOffset, footYPos - 0.06 * scaleY, 0.05 * scaleX);
        modelGroup.add(soleL);

        const soleR = new THREE.Mesh(soleGeo, fPiping);
        soleR.position.set(legXOffset, footYPos - 0.06 * scaleY, 0.05 * scaleX);
        modelGroup.add(soleR);

      } else if (footItem.style === 'sandals') {
        // Flat sole slice
        const soleGeo = new THREE.BoxGeometry(0.12 * scaleX, 0.02 * scaleY, 0.22 * scaleX);
        
        const soleL = new THREE.Mesh(soleGeo, fMat);
        soleL.position.set(-legXOffset, footYPos - 0.04 * scaleY, 0.05 * scaleX);
        modelGroup.add(soleL);

        const soleR = new THREE.Mesh(soleGeo, fMat);
        soleR.position.set(legXOffset, footYPos - 0.04 * scaleY, 0.05 * scaleX);
        modelGroup.add(soleR);

        // Elegant cross-strap arches
        const strapGeo = new THREE.TorusGeometry(0.06 * scaleX, 0.012, 16, 24);
        
        const strapL = new THREE.Mesh(strapGeo, fAccent);
        strapL.position.set(-legXOffset, footYPos, 0.04 * scaleX);
        strapL.rotation.y = Math.PI / 2;
        modelGroup.add(strapL);

        const strapR = new THREE.Mesh(strapGeo, fAccent);
        strapR.position.set(legXOffset, footYPos, 0.04 * scaleX);
        strapR.rotation.y = Math.PI / 2;
        modelGroup.add(strapR);

      } else if (footItem.style === 'dress_shoes') {
        const shoeGeo = new THREE.BoxGeometry(0.11 * scaleX, 0.075 * scaleY, 0.21 * scaleX);
        // Deep shiny patent leather material for luxury appearance!
        const glossyDressMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(footItem.color.primary),
          roughness: 0.12, // highly reflective
          metalness: 0.15
        });

        // Left shoe
        const shoeL = new THREE.Mesh(shoeGeo, glossyDressMat);
        shoeL.position.set(-legXOffset, footYPos, 0.04 * scaleX);
        shoeL.castShadow = true;
        modelGroup.add(shoeL);

        // Right Shoe (Symmetrical mirror)
        const shoeR = new THREE.Mesh(shoeGeo, glossyDressMat);
        shoeR.position.set(legXOffset, footYPos, 0.04 * scaleX);
        shoeR.castShadow = true;
        modelGroup.add(shoeR);

        // Elegant gold buckle strap
        const buckleGeo = new THREE.BoxGeometry(0.02 * scaleX, 0.012 * scaleY, 0.12 * scaleX);
        const buckleL = new THREE.Mesh(buckleGeo, fPiping);
        buckleL.position.set(-legXOffset - 0.045 * scaleX, footYPos + 0.03 * scaleY, 0.03 * scaleX);
        modelGroup.add(buckleL);

        const buckleR = new THREE.Mesh(buckleGeo, fPiping);
        buckleR.position.set(legXOffset + 0.045 * scaleX, footYPos + 0.03 * scaleY, 0.03 * scaleX);
        modelGroup.add(buckleR);
      }
    }


    // ==========================================
    // 5. HAIR LAYER (Layered 3D Flow Sculpt)
    // ==========================================
    const hairItem = items.hair;
    if (hairItem.visible && hairItem.style !== 'none') {
      const hMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(hairItem.color.primary),
        roughness: 0.85,
        metalness: 0.01 // realistic organic matte
      });
      const hAccent = new THREE.MeshStandardMaterial({
        color: new THREE.Color(hairItem.color.secondary),
        roughness: 0.8
      });

      if (hairItem.style === 'crop') {
        // Close-cut cap wrap around skull top
        const cropGeo = new THREE.SphereGeometry(0.233, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const crop = new THREE.Mesh(cropGeo, hMat);
        crop.position.set(0, headY + 0.01, 0);
        crop.scale.set(scaleX, 1, scaleX);
        modelGroup.add(crop);

        // Spiky tufts in front
        const fringeGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
        for (let i = 0; i < 4; i++) {
          const spike = new THREE.Mesh(fringeGeo, hMat);
          spike.rotation.x = 2.2;
          spike.position.set((-0.1 + i * 0.06) * scaleX, headY + 0.12, 0.18 * scaleX);
          modelGroup.add(spike);
        }

      } else if (hairItem.style === 'waves') {
        // Floating waves flanking head sphere sides and falling down shoulders
        const cropGeo = new THREE.SphereGeometry(0.235, 16, 16);
        const base = new THREE.Mesh(cropGeo, hMat);
        base.position.set(0, headY, 0.01);
        modelGroup.add(base);

        // Wave loops
        for (let i = 0; i < 6; i++) {
          const waveGeo = new THREE.SphereGeometry(0.12, 12, 12);
          const loop = new THREE.Mesh(waveGeo, hAccent);
          const angle = (i * Math.PI) / 3;
          loop.position.set(
            Math.sin(angle) * 0.22 * scaleX,
            headY - 0.05 - (i % 2) * 0.08,
            Math.cos(angle) * 0.18 * scaleX
          );
          loop.castShadow = true;
          modelGroup.add(loop);
        }

      } else if (hairItem.style === 'bob') {
        // Symmetric helmet/straight cut bob hair draping sides of face
        const domeGeo = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
        const dome = new THREE.Mesh(domeGeo, hMat);
        dome.position.set(0, headY + 0.02, 0);
        dome.scale.set(scaleX, 1, scaleX);
        modelGroup.add(dome);

        // Flanking straight extensions
        const strandGeo = new THREE.BoxGeometry(0.06 * scaleX, 0.22 * scaleY, 0.16 * scaleX);
        
        const strandL = new THREE.Mesh(strandGeo, hMat);
        strandL.position.set(-0.21 * scaleX, headY - 0.1 * scaleY, 0.05 * scaleX);
        modelGroup.add(strandL);

        const strandR = new THREE.Mesh(strandGeo, hMat);
        strandR.position.set(0.21 * scaleX, headY - 0.1 * scaleY, 0.05 * scaleX);
        modelGroup.add(strandR);

      } else if (hairItem.style === 'mohawk') {
        // Center strip punk mohawk spiky blocks
        const mohawkGeo = new THREE.BoxGeometry(0.05 * scaleX, 0.12 * scaleY, 0.38 * scaleX);
        const hawk = new THREE.Mesh(mohawkGeo, hMat);
        hawk.position.set(0, headY + 0.18 * scaleY, -0.05 * scaleX);
        hawk.rotation.x = -0.15;
        hawk.castShadow = true;
        modelGroup.add(hawk);

        // Highlight tips
        const tipsGeo = new THREE.BoxGeometry(0.052 * scaleX, 0.05 * scaleY, 0.385 * scaleX);
        const tips = new THREE.Mesh(tipsGeo, hAccent);
        tips.position.set(0, headY + 0.23 * scaleY, -0.05 * scaleX);
        tips.rotation.x = -0.15;
        modelGroup.add(tips);

      } else if (hairItem.style === 'bun') {
        // High crown top ball
        const cropGeo = new THREE.SphereGeometry(0.233, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const crop = new THREE.Mesh(cropGeo, hMat);
        crop.position.set(0, headY + 0.01, 0);
        crop.scale.set(scaleX, 1, scaleX);
        modelGroup.add(crop);

        // Bun sphere sitting perfectly centered atop back crown
        const bunBallGeo = new THREE.SphereGeometry(0.09, 12, 12);
        const bunBall = new THREE.Mesh(bunBallGeo, hAccent);
        bunBall.position.set(0, headY + 0.2 * scaleY, -0.09 * scaleX);
        bunBall.castShadow = true;
        modelGroup.add(bunBall);

      } else if (hairItem.style === 'braids') {
        // Strands dropping down symmetrically on chest front face
        const domeGeo = new THREE.SphereGeometry(0.235, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const base = new THREE.Mesh(domeGeo, hMat);
        base.position.set(0, headY + 0.01, 0);
        base.scale.set(scaleX, 1, scaleX);
        modelGroup.add(base);

        // Plait braids dropping on chest front
        for (let i = 0; i < 5; i++) {
          const nodGeo = new THREE.SphereGeometry(0.032, 8, 8);
          // Left braid chain link
          const lNode = new THREE.Mesh(nodGeo, hMat);
          lNode.position.set(-0.16 * scaleX, headY - 0.12 - i * 0.06, 0.17 * scaleX);
          modelGroup.add(lNode);

          // Right braid chain link
          const rNode = new THREE.Mesh(nodGeo, hMat);
          rNode.position.set(0.16 * scaleX, headY - 0.12 - i * 0.06, 0.17 * scaleX);
          modelGroup.add(rNode);
        }
      }
    }


    // ==========================================
    // 6. HEADWEAR LAYER (Visors, Crowns, Beanies)
    // ==========================================
    const hwItem = items.headwear;
    if (hwItem.visible && hwItem.style !== 'none') {
      const hwMat = makeClotheMat(hwItem);
      const hwAccent = makeAccentMat(hwItem);

      if (hwItem.style === 'cap') {
        // Sleek baseball cap visor forward
        const capDomeGeo = new THREE.SphereGeometry(0.245, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.9);
        const capDome = new THREE.Mesh(capDomeGeo, hwMat);
        capDome.position.set(0, headY + 0.03, -0.01);
        capDome.rotation.x = -0.08;
        capDome.scale.set(scaleX, 1, scaleX);
        capDome.castShadow = true;
        modelGroup.add(capDome);

        // Forward elongated peak visor shield
        const visorGeo = new THREE.BoxGeometry(0.21 * scaleX, 0.015 * scaleY, 0.14 * scaleX);
        const visor = new THREE.Mesh(visorGeo, hwAccent);
        visor.position.set(0, headY + 0.06, 0.2 * scaleX);
        visor.rotation.x = 0.11;
        modelGroup.add(visor);

      } else if (hwItem.style === 'beanie') {
        // Elongated snug dome beanies
        const beanGeo = new THREE.CylinderGeometry(0.18 * scaleX, 0.245 * scaleX, 0.25, 32);
        const beanie = new THREE.Mesh(beanGeo, hwMat);
        beanie.position.set(0, headY + 0.12, 0);
        beanie.rotation.x = -0.05;
        beanie.castShadow = true;
        modelGroup.add(beanie);

        // Soft crown puff ball on beanie tip
        const puffGeo = new THREE.SphereGeometry(0.045, 24, 24);
        const puff = new THREE.Mesh(puffGeo, hwAccent);
        puff.position.set(0, headY + 0.24, -0.02 * scaleX);
        modelGroup.add(puff);

      } else if (hwItem.style === 'sunhat') {
        // Large horizontal disk flange
        const capDomeGeo = new THREE.SphereGeometry(0.24, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const capDome = new THREE.Mesh(capDomeGeo, hwMat);
        capDome.position.set(0, headY + 0.02, 0);
        capDome.scale.set(scaleX, 1, scaleX);
        modelGroup.add(capDome);

        // Enormous brim halo plate
        const brimGeo = new THREE.CylinderGeometry(0.55 * scaleX, 0.55 * scaleX, 0.012, 64);
        const brim = new THREE.Mesh(brimGeo, hwMat);
        brim.position.set(0, headY + 0.01, 0);
        brim.castShadow = true;
        modelGroup.add(brim);

        // Decorative ribbon band wrapped at base
        const ribbonGeo = new THREE.CylinderGeometry(0.246 * scaleX, 0.246 * scaleX, 0.02, 48);
        const ribbon = new THREE.Mesh(ribbonGeo, hwAccent);
        ribbon.position.set(0, headY + 0.03, 0);
        modelGroup.add(ribbon);

      } else if (hwItem.style === 'crown') {
        // Real gold spiked royalty crown
        const crownBaseGeo = new THREE.CylinderGeometry(0.222 * scaleX, 0.222 * scaleX, 0.04, 48);
        const goldRoyalMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.85, roughness: 0.1 });
        const crownBase = new THREE.Mesh(crownBaseGeo, goldRoyalMat);
        crownBase.position.set(0, headY + 0.21, 0);
        crownBase.castShadow = true;
        modelGroup.add(crownBase);

        // Spikes surrounding boundary rim
        const spikeGeo = new THREE.ConeGeometry(0.03 * scaleX, 0.09, 16);
        for (let i = 0; i < 6; i++) {
          const spike = new THREE.Mesh(spikeGeo, goldRoyalMat);
          const angle = (i * Math.PI) / 3;
          const r = 0.211 * scaleX;
          spike.position.set(Math.sin(angle) * r, headY + 0.25, Math.cos(angle) * r);
          spike.rotation.y = angle;
          modelGroup.add(spike);
        }

      } else if (hwItem.style === 'headband') {
        // Sleek headband hoop
        const headbandGeo = new THREE.TorusGeometry(0.233 * scaleX, 0.016, 16, 48);
        const headband = new THREE.Mesh(headbandGeo, hwMat);
        headband.rotation.x = Math.PI / 1.8;
        headband.position.set(0, headY + 0.02, 0.01);
        modelGroup.add(headband);
      }
    }


    // ==========================================
    // 7. ACCESSORIES (Wings, Necklaces, Glasses)
    // ==========================================
    const accItem = items.accessories;
    if (accItem.visible && accItem.style !== 'none') {
      const aMat = makeClotheMat(accItem);
      const aAccent = makeAccentMat(accItem);

      if (accItem.style === 'glasses') {
        // Frame wire structures centered on head coordinates
        const frameGeo = new THREE.TorusGeometry(0.046 * scaleX, 0.008, 6, 16);
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.2 });

        const lFrame = new THREE.Mesh(frameGeo, glassMat);
        lFrame.position.set(-0.07 * scaleX, headY - 0.01, 0.22 * scaleX);
        modelGroup.add(lFrame);

        const rFrame = new THREE.Mesh(frameGeo, glassMat);
        rFrame.position.set(0.07 * scaleX, headY - 0.01, 0.22 * scaleX);
        modelGroup.add(rFrame);

        // Center nose-bridge segment
        const bridgeGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.05 * scaleX, 8);
        const bridge = new THREE.Mesh(bridgeGeo, glassMat);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(0, headY - 0.01, 0.221 * scaleX);
        modelGroup.add(bridge);

      } else if (accItem.style === 'scarf') {
        // Thick cozy wrap ring around neck
        const scarfGeo = new THREE.TorusGeometry(0.09 * scaleX, 0.038, 12, 24);
        const mainWreath = new THREE.Mesh(scarfGeo, aMat);
        mainWreath.rotation.x = Math.PI / 2;
        mainWreath.position.set(0, neckY, 0);
        mainWreath.castShadow = true;
        modelGroup.add(mainWreath);

        // Tail wrap draping down front chest chest
        const scarfTailGeo = new THREE.BoxGeometry(0.06 * scaleX, 0.3 * scaleY, 0.03 * scaleX);
        const tail = new THREE.Mesh(scarfTailGeo, aAccent);
        tail.position.set(0.06 * scaleX, neckY - 0.15 * scaleY, 0.21 * scaleX);
        tail.rotation.z = -0.12;
        tail.rotation.y = 0.1;
        tail.castShadow = true;
        modelGroup.add(tail);

      } else if (accItem.style === 'necklace') {
        // Slim gold necklace chain loop
        const chainGeo = new THREE.TorusGeometry(0.095 * scaleX, 0.006, 8, 24);
        const goldRoyalMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.15 });
        const chain = new THREE.Mesh(chainGeo, goldRoyalMat);
        chain.rotation.x = Math.PI / 1.7; // resting on chests collar
        chain.position.set(0, neckY - 0.05 * scaleY, 0.02 * scaleX);
        modelGroup.add(chain);

        // Crystal gem pendant
        const gemGeo = new THREE.ConeGeometry(0.018 * scaleX, 0.035, 4);
        const gemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accItem.color.primary), metalness: 0.7, roughness: 0.05 });
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.set(0, neckY - 0.12 * scaleY, 0.13 * scaleX);
        gem.rotation.x = 0.2;
        modelGroup.add(gem);

      } else if (accItem.style === 'wings') {
        // Symmetrical magnificent feathered wing planes extending behind the back!
        const wingLGeo = new THREE.BoxGeometry(0.85 * scaleX, 0.25 * scaleY, 0.015 * scaleX);
        
        // Left Wing (angled elegantly out and back)
        const wingL = new THREE.Mesh(wingLGeo, aMat);
        wingL.position.set(-0.48 * scaleX, chestY + 0.1 * scaleY, -0.15 * scaleX);
        wingL.rotation.y = 0.35; // angled backwards
        wingL.rotation.z = 0.25; // elegant raised wing posture
        wingL.castShadow = true;
        modelGroup.add(wingL);

        // Inner layered feathers Left
        const innerWingLGeo = new THREE.BoxGeometry(0.65 * scaleX, 0.18 * scaleY, 0.012 * scaleX);
        const innerWingL = new THREE.Mesh(innerWingLGeo, aAccent);
        innerWingL.position.set(-0.4 * scaleX, chestY + 0.1 * scaleY, -0.13 * scaleX);
        innerWingL.rotation.y = 0.35;
        innerWingL.rotation.z = 0.25;
        modelGroup.add(innerWingL);

        // Right Wing (Perfect symmetrical mirror)
        const wingR = new THREE.Mesh(wingLGeo, aMat);
        wingR.position.set(0.48 * scaleX, chestY + 0.1 * scaleY, -0.15 * scaleX);
        wingR.rotation.y = -0.35;
        wingR.rotation.z = -0.25;
        wingR.castShadow = true;
        modelGroup.add(wingR);

        const innerWingR = new THREE.Mesh(innerWingLGeo, aAccent);
        innerWingR.position.set(0.4 * scaleX, chestY + 0.1 * scaleY, -0.13 * scaleX);
        innerWingR.rotation.y = -0.35;
        innerWingR.rotation.z = -0.25;
        modelGroup.add(innerWingR);

      } else if (accItem.style === 'satchel') {
        // Crossbody diagonal cylinder belt strap
        const satchelFit = 0.01;
        const strapGeo = new THREE.TorusGeometry((0.21 + satchelFit) * scaleX, 0.012, 8, 32, Math.PI * 1.5);
        const strap = new THREE.Mesh(strapGeo, aMat);
        strap.rotation.y = Math.PI / 2;
        strap.rotation.z = 0.65; // diagonal crossbody tilt
        strap.position.set(0, chestY + 0.05 * scaleY, 0);
        modelGroup.add(strap);

        // Leather hip storage pack box
        const pouchGeo = new THREE.BoxGeometry(0.06 * scaleX, 0.15 * scaleY, 0.12 * scaleX);
        const pouch = new THREE.Mesh(pouchGeo, aAccent);
        pouch.position.set(0.2 * scaleX, pelvisY - 0.02 * scaleY, 0.08 * scaleX);
        pouch.rotation.z = -0.15;
        pouch.rotation.y = 0.45;
        pouch.castShadow = true;
        modelGroup.add(pouch);
      }
    }

    // Symmetrical and robust floor auto-alignment math
    const currentFootYPos = actualAnkleY - 0.02 * scaleY;
    let lowestY = actualAnkleY - 0.05 * scaleY; // default bare feet bottom
    if (footItem.visible) {
      if (footItem.style === 'sneakers') {
        lowestY = currentFootYPos - 0.065 * scaleY;
      } else if (footItem.style === 'boots') {
        lowestY = currentFootYPos - 0.0825 * scaleY;
      } else if (footItem.style === 'sandals') {
        lowestY = currentFootYPos - 0.05 * scaleY;
      } else if (footItem.style === 'dress_shoes') {
        lowestY = currentFootYPos - 0.03 * scaleY;
      }
    }

    // Vertically translate the entire mannequin structure so its feet/shoes rest flat on the floor level (y = -1.13)
    modelGroup.position.y = -1.13 - lowestY;

  }, [items, body, sceneReady]);

  // Utility helpers to scale coordinates correctly
  const scaleZOffset = (sx: number) => {
    return Math.max(0.65, Math.min(1.35, sx));
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl bg-gradient-to-b from-slate-900 to-[#1e293b] flex items-center justify-center shadow-2xl border border-slate-800 overflow-hidden">
      {/* Background spot ambiance light flare */}
      <div className="absolute inset-x-0 top-1/4 h-2/3 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Background technical alignment line grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Primary WebGL canvas container mounting zone */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Realistic interactive UI HUD overlay controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.2 rounded-full border border-slate-800 bg-slate-950/80 backdrop-blur-md text-[10px] uppercase tracking-wider font-semibold text-indigo-300 shadow-md">
          <Move3d className="h-3 w-3 animate-pulse" />
          Interactive 3D Mannequin
        </span>
      </div>

      {/* Rotating control triggers on bottom panel */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium tracking-wide transition-all shadow-md ${
            autoRotate
              ? 'border-indigo-500 bg-indigo-950/90 text-indigo-200'
              : 'border-slate-800 bg-slate-950/90 text-slate-400 hover:text-slate-200'
          }`}
          title={autoRotate ? 'Pause Auto-Rotation' : 'Unpause Auto-Rotation'}
        >
          <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          <span>{autoRotate ? 'Auto Spinning' : 'Stationary'}</span>
        </button>

        <div className="flex h-8 px-2.5 items-center bg-slate-950/80 border border-slate-800 text-slate-500 rounded-xl text-[10px] gap-1 shadow-md">
          <Compass className="h-3.5 w-3.5 text-slate-400" />
          <span>Drag 360°</span>
        </div>
      </div>
    </div>
  );
};
