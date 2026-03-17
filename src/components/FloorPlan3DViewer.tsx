import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Environment } from '@react-three/drei';
import { Room, FurnitureItem, DoorItem, WindowItem } from '@/types/editor';
import { useMemo } from 'react';
import * as THREE from 'three';

const SCALE = 0.02; // SVG units to 3D units
const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.12;

function getRoomColor(color: string): string {
  // Convert HSL string to a hex approximation
  const hslMatch = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    const c = new THREE.Color();
    c.setHSL(h, s, l);
    return '#' + c.getHexString();
  }
  return '#e8e0d8';
}

function getFurnitureColor(type: string): string {
  if (type.includes('bed')) return '#8B7355';
  if (type.includes('sofa') || type.includes('armchair') || type.includes('recliner')) return '#6B8E6B';
  if (type.includes('table') || type.includes('desk')) return '#A0522D';
  if (type.includes('chair')) return '#CD853F';
  if (type.includes('kitchen') || type.includes('stove') || type.includes('fridge') || type.includes('sink')) return '#708090';
  if (type.includes('wardrobe') || type.includes('dresser') || type.includes('bookshelf') || type.includes('cabinet')) return '#8B6914';
  if (type.includes('toilet') || type.includes('bath') || type.includes('shower') || type.includes('basin')) return '#B0C4DE';
  if (type.includes('car')) return '#4682B4';
  return '#A0926B';
}

function getFurnitureHeight(type: string): number {
  if (type.includes('bed')) return 0.5;
  if (type.includes('sofa') || type.includes('armchair') || type.includes('recliner')) return 0.8;
  if (type.includes('table') || type.includes('desk') || type.includes('counter') || type.includes('island')) return 0.75;
  if (type.includes('chair')) return 0.9;
  if (type.includes('wardrobe') || type.includes('bookshelf') || type.includes('cabinet')) return 2.0;
  if (type.includes('fridge')) return 1.8;
  if (type.includes('stove') || type.includes('sink')) return 0.9;
  if (type.includes('toilet')) return 0.7;
  if (type.includes('bath')) return 0.6;
  if (type.includes('shower')) return 2.2;
  if (type.includes('car')) return 1.5;
  if (type.includes('tv')) return 0.5;
  if (type.includes('nightstand')) return 0.5;
  return 0.8;
}

function RoomMesh({ room }: { room: Room }) {
  const color = getRoomColor(room.color);
  const w = room.width * SCALE;
  const d = room.height * SCALE;
  const cx = room.x * SCALE + w / 2;
  const cz = room.y * SCALE + d / 2;

  return (
    <group>
      {/* Floor */}
      <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Walls */}
      {/* Back wall (top in 2D) */}
      <mesh position={[cx, WALL_HEIGHT / 2, room.y * SCALE]} castShadow>
        <boxGeometry args={[w + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#d4ccc4" />
      </mesh>
      {/* Front wall */}
      <mesh position={[cx, WALL_HEIGHT / 2, (room.y + room.height) * SCALE]} castShadow>
        <boxGeometry args={[w + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#d4ccc4" />
      </mesh>
      {/* Left wall */}
      <mesh position={[room.x * SCALE, WALL_HEIGHT / 2, cz]} castShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, d + WALL_THICKNESS]} />
        <meshStandardMaterial color="#cfc7bf" />
      </mesh>
      {/* Right wall */}
      <mesh position={[(room.x + room.width) * SCALE, WALL_HEIGHT / 2, cz]} castShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, d + WALL_THICKNESS]} />
        <meshStandardMaterial color="#cfc7bf" />
      </mesh>

      {/* Room label */}
      <Text
        position={[cx, 0.05, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color="#555"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>
    </group>
  );
}

function FurnitureMesh({ item }: { item: FurnitureItem }) {
  const color = getFurnitureColor(item.type);
  const h = getFurnitureHeight(item.type);
  const w = item.width * SCALE;
  const d = item.height * SCALE;
  const cx = item.x * SCALE + w / 2;
  const cz = item.y * SCALE + d / 2;

  return (
    <mesh position={[cx, h / 2, cz]} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function DoorMesh({ door }: { door: DoorItem }) {
  const w = door.width * SCALE;
  const d = Math.max(door.height * SCALE, WALL_THICKNESS * 1.2);
  const cx = door.x * SCALE + w / 2;
  const cz = door.y * SCALE + d / 2;

  return (
    <mesh position={[cx, 1.0, cz]}>
      <boxGeometry args={[w, 2.0, d]} />
      <meshStandardMaterial color="#8B4513" transparent opacity={0.7} />
    </mesh>
  );
}

function WindowMesh({ win }: { win: WindowItem }) {
  const w = win.width * SCALE;
  const d = Math.max(win.height * SCALE, WALL_THICKNESS * 1.2);
  const cx = win.x * SCALE + w / 2;
  const cz = win.y * SCALE + d / 2;

  return (
    <mesh position={[cx, 1.5, cz]}>
      <boxGeometry args={[w, 1.0, d]} />
      <meshStandardMaterial color="#87CEEB" transparent opacity={0.4} />
    </mesh>
  );
}

interface Props {
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
}

export default function FloorPlan3DViewer({ rooms, furniture, doors, windows }: Props) {
  const center = useMemo(() => {
    if (rooms.length === 0) return { x: 5, z: 3.5 };
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    rooms.forEach(r => {
      minX = Math.min(minX, r.x * SCALE);
      maxX = Math.max(maxX, (r.x + r.width) * SCALE);
      minZ = Math.min(minZ, r.y * SCALE);
      maxZ = Math.max(maxZ, (r.y + r.height) * SCALE);
    });
    return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
  }, [rooms]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-muted/30 to-muted/60">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[center.x + 8, 10, center.z + 8]} fov={50} />
        <OrbitControls
          target={[center.x, 0, center.z]}
          enablePan
          enableZoom
          enableRotate
          minDistance={3}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.1}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 10]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 8, -5]} intensity={0.3} />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, 0, center.z]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#e8e4df" />
        </mesh>

        {/* Rooms */}
        {rooms.map(room => (
          <RoomMesh key={room.id} room={room} />
        ))}

        {/* Furniture */}
        {furniture.map(item => (
          <FurnitureMesh key={item.id} item={item} />
        ))}

        {/* Doors */}
        {doors.map(door => (
          <DoorMesh key={door.id} door={door} />
        ))}

        {/* Windows */}
        {windows.map(win => (
          <WindowMesh key={win.id} win={win} />
        ))}
      </Canvas>
    </div>
  );
}
