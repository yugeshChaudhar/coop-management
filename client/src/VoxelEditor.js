import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Sky } from '@react-three/drei';
import * as THREE from 'three';

// Block component representing a single voxel
function Voxel({ position, color, onClick, onDelete, isSelected, isHovered }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(position);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onDelete(position);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={hovered ? '#ff6b6b' : color} 
        roughness={0.5}
        metalness={0.1}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
          <lineBasicMaterial color="white" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

// Ghost block showing where block will be placed
function GhostBlock({ position, color }) {
  if (!position) return null;
  
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

// Ground plane for raycasting
function GroundPlane({ onPlaceBlock, onDeleteBlock }) {
  const planeRef = useRef();

  return (
    <mesh 
      ref={planeRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.5, 0]}
      onClick={(e) => {
        e.stopPropagation();
        const point = e.point;
        const x = Math.round(point.x);
        const z = Math.round(point.z);
        onPlaceBlock([x, 0, z]);
      }}
    >
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#333" transparent opacity={0.8} />
    </mesh>
  );
}

// Main voxel scene
function VoxelScene({ voxels, selectedBlock, ghostPosition, onPlaceBlock, onDeleteBlock, currentColor }) {
  const { camera, raycaster, pointer } = useThree();
  const [hoverPos, setHoverPos] = useState(null);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.5);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection) {
      const x = Math.round(intersection.x);
      const z = Math.round(intersection.z);
      setHoverPos([x, 0, z]);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />
      <Sky sunPosition={[100, 20, 100]} />
      <Grid infiniteGrid fadeDistance={50} sectionColor="#4a4a4a" cellColor="#2a2a2a" />
      
      <GroundPlane onPlaceBlock={onPlaceBlock} onDeleteBlock={onDeleteBlock} />
      <GhostBlock position={hoverPos || ghostPosition} color={currentColor} />
      
      {voxels.map((voxel, index) => (
        <Voxel
          key={index}
          position={voxel.position}
          color={voxel.color}
          onClick={() => {}}
          onDelete={onDeleteBlock}
        />
      ))}
      
      <OrbitControls makeDefault />
    </>
  );
}

// Hand tracking component
function useHandTracking(videoRef, onHandDetected) {
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!videoRef.current || isInitialized.current) return;

    const initializeMediaPipe = async () => {
      try {
        const { Hands, Camera } = await import('@mediapipe/hands');
        const { drawUtils } = await import('@mediapipe/camera_utils');

        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Get index finger tip position (landmark 8)
            const indexTip = landmarks[8];
            const indexBase = landmarks[5];
            
            // Get thumb tip position (landmark 4)
            const thumbTip = landmarks[4];
            
            // Calculate distances for gesture detection
            const indexFingerExtended = indexTip.y < indexBase.y;
            const thumbIndexDistance = Math.sqrt(
              Math.pow(indexTip.x - thumbTip.x, 2) + 
              Math.pow(indexTip.y - thumbTip.y, 2)
            );
            
            // Pinch gesture detection (thumb and index close together)
            const isPinching = thumbIndexDistance < 0.05;
            
            onHandDetected({
              x: indexTip.x,
              y: indexTip.y,
              isPointing: indexFingerExtended && !isPinching,
              isPinching: isPinching,
              landmarks
            });
          } else {
            onHandDetected(null);
          }
        });

        handsRef.current = hands;

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        camera.start();
        cameraRef.current = camera;
        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing MediaPipe:', error);
      }
    };

    initializeMediaPipe();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [videoRef, onHandDetected]);
}

// Color picker component
function ColorPicker({ currentColor, onColorChange }) {
  const colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1',
    '#5f27cd', '#ff9ff3', '#54a0ff', '#00d2d3',
    '#ff9f43', '#a55eea', '#2e86de', '#f368e0',
    '#ff4757', '#2ed573', '#ffa502', '#ced6e0'
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      padding: '12px',
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '12px',
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000
    }}>
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onColorChange(color)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: currentColor === color ? '3px solid white' : '2px solid transparent',
            backgroundColor: color,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
        />
      ))}
    </div>
  );
}

// Mode selector
function ModeSelector({ mode, onModeChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      padding: '12px',
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '12px',
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      <button
        onClick={() => onModeChange('place')}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: mode === 'place' ? '#1dd1a1' : '#555',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        ✋ Place
      </button>
      <button
        onClick={() => onModeChange('delete')}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: mode === 'delete' ? '#ff4757' : '#555',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        ✌️ Delete
      </button>
    </div>
  );
}

// Instructions panel
function Instructions() {
  return (
    <div style={{
      padding: '15px',
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '12px',
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      zIndex: 1000,
      color: 'white',
      fontSize: '13px',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#1dd1a1' }}>🎮 Controls</h4>
      <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
        <li><b>Point</b> - Move cursor in 3D</li>
        <li><b>Pinch</b> - Place block</li>
        <li><b>Two fingers pinch</b> - Delete block</li>
        <li><b>Mouse drag</b> - Rotate camera</li>
        <li><b>Scroll</b> - Zoom</li>
        <li><b>Right click</b> - Delete block (mouse)</li>
      </ul>
    </div>
  );
}

// Main VoxelEditor component
export default function VoxelEditor() {
  const [voxels, setVoxels] = useState([]);
  const [currentColor, setCurrentColor] = useState('#ff6b6b');
  const [mode, setMode] = useState('place'); // 'place' or 'delete'
  const [ghostPosition, setGhostPosition] = useState(null);
  const [handPosition, setHandPosition] = useState({ x: 0.5, y: 0.5 });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const videoRef = useRef(null);
  const previousPinchState = useRef(false);
  const previousDeleteGesture = useRef(false);

  const handlePlaceBlock = useCallback((position) => {
    if (mode === 'place') {
      setVoxels((prev) => {
        // Check if block already exists at position
        const exists = prev.some(v => 
          v.position[0] === position[0] && 
          v.position[1] === position[1] && 
          v.position[2] === position[2]
        );
        if (exists) return prev;
        return [...prev, { position, color: currentColor }];
      });
    } else if (mode === 'delete') {
      setVoxels((prev) => 
        prev.filter(v => 
          !(v.position[0] === position[0] && 
            v.position[1] === position[1] && 
            v.position[2] === position[2])
        )
      );
    }
  }, [mode, currentColor]);

  const handleDeleteBlock = useCallback((position) => {
    setVoxels((prev) => 
      prev.filter(v => 
        !(v.position[0] === position[0] && 
          v.position[1] === position[1] && 
          v.position[2] === position[2])
      )
    );
  }, []);

  const handleHandDetected = useCallback((handData) => {
    if (!handData) {
      setIsHandDetected(false);
      return;
    }

    setIsHandDetected(true);
    setHandPosition({ x: handData.x, y: handData.y });

    // Convert hand position to 3D position
    const x = Math.round((handData.x - 0.5) * 20);
    const z = Math.round((0.5 - handData.y) * 20);
    
    setGhostPosition([x, 0, z]);

    // Pinch to place block (detect pinch gesture change)
    if (handData.isPinching && !previousPinchState.current) {
      handlePlaceBlock([x, 0, z]);
    }
    previousPinchState.current = handData.isPinching;

    // Two finger pinch (index and thumb spread) to delete
    // For now, we'll use a different gesture - when pointing with two fingers
    if (handData.landmarks) {
      const indexTip = handData.landmarks[8];
      const middleTip = handData.landmarks[12];
      const distance = Math.sqrt(
        Math.pow(indexTip.x - middleTip.x, 2) + 
        Math.pow(indexTip.y - middleTip.y, 2)
      );
      
      // Two fingers close together = delete mode trigger
      if (distance < 0.05 && !previousDeleteGesture.current) {
        handleDeleteBlock([x, 0, z]);
      }
      previousDeleteGesture.current = distance < 0.05;
    }
  }, [handlePlaceBlock, handleDeleteBlock]);

  useHandTracking(videoRef, handleHandDetected);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#111' }}>
      {/* Hand tracking video */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '200px',
          height: '150px',
          borderRadius: '12px',
          border: isHandDetected ? '3px solid #1dd1a1' : '3px solid #555',
          transform: 'scaleX(-1)',
          zIndex: 1000,
          objectFit: 'cover'
        }}
        autoPlay
        playsInline
        muted
      />
      
      {/* Hand tracking indicator */}
      <div style={{
        position: 'absolute',
        bottom: '180px',
        right: '20px',
        padding: '8px 16px',
        background: isHandDetected ? 'rgba(29, 209, 161, 0.9)' : 'rgba(85, 85, 85, 0.9)',
        borderRadius: '20px',
        color: 'white',
        fontWeight: 'bold',
        zIndex: 1000,
        fontSize: '14px'
      }}>
        {isHandDetected ? '✋ Hand Tracking Active' : '👋 No Hand Detected'}
      </div>

      <ColorPicker currentColor={currentColor} onColorChange={setCurrentColor} />
      <ModeSelector mode={mode} onModeChange={setMode} />
      <Instructions />

      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows
        onPointerMove={(e) => {
          if (!isHandDetected) {
            const x = Math.round(e.point.x);
            const z = Math.round(e.point.z);
            setGhostPosition([x, 0, z]);
          }
        }}
        onPointerDown={(e) => {
          if (e.button === 0 && !isHandDetected) {
            handlePlaceBlock(ghostPosition);
          } else if (e.button === 2 && !isHandDetected) {
            handleDeleteBlock(ghostPosition);
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <VoxelScene
          voxels={voxels}
          selectedBlock={null}
          ghostPosition={ghostPosition}
          onPlaceBlock={handlePlaceBlock}
          onDeleteBlock={handleDeleteBlock}
          currentColor={currentColor}
        />
      </Canvas>
    </div>
  );
}
