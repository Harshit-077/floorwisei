export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
  roomType?: 'room' | 'hallway' | 'open-area' | 'staircase' | 'garage' | 'gate';
}

export interface DoorItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  wallSide: 'top' | 'bottom' | 'left' | 'right';
}

export interface WindowItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface FurnitureItem {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  variant?: string;
}

export interface AnalysisScore {
  label: string;
  score: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ProjectData {
  id: string;
  name: string;
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  createdAt: string;
  updatedAt: string;
}

export type EditorTool = 'select' | 'room' | 'door' | 'window' | 'delete';

export const DOOR_PRESETS = [
  { label: 'Standard Door', width: 40, height: 8 },
  { label: 'Double Door', width: 60, height: 8 },
  { label: 'Sliding Door', width: 50, height: 6 },
  { label: 'Main Gate', width: 80, height: 10 },
  { label: 'Garage Door', width: 100, height: 10 },
] as const;

export const WINDOW_PRESETS = [
  { label: 'Standard Window', width: 40, height: 6 },
  { label: 'Large Window', width: 60, height: 6 },
  { label: 'Small Window', width: 25, height: 5 },
  { label: 'Bay Window', width: 70, height: 10 },
  { label: 'Sliding Window', width: 50, height: 7 },
] as const;

export interface FurnitureCatalogItem {
  type: string;
  label: string;
  width: number;
  height: number;
  category: string;
  variant?: string;
  parentType?: string;
}

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  // Living — Sofa variants
  { type: 'sofa-2', label: 'Sofa (2-Seater)', width: 75, height: 40, category: 'Living', variant: '2-Seater', parentType: 'sofa' },
  { type: 'sofa-3', label: 'Sofa (3-Seater)', width: 110, height: 42, category: 'Living', variant: '3-Seater', parentType: 'sofa' },
  { type: 'sofa-l', label: 'Sofa (L-Shape)', width: 130, height: 90, category: 'Living', variant: 'L-Shape', parentType: 'sofa' },
  { type: 'armchair', label: 'Armchair', width: 40, height: 40, category: 'Living' },
  { type: 'recliner', label: 'Recliner', width: 45, height: 45, category: 'Living' },
  { type: 'coffee-table', label: 'Coffee Table', width: 60, height: 35, category: 'Living' },
  { type: 'tv-unit', label: 'TV Unit', width: 80, height: 25, category: 'Living' },
  { type: 'bookshelf', label: 'Bookshelf', width: 60, height: 20, category: 'Living' },
  // Bedroom — Bed variants
  { type: 'bed-king', label: 'King Bed', width: 100, height: 110, category: 'Bedroom', variant: 'King', parentType: 'bed' },
  { type: 'bed-queen', label: 'Queen Bed', width: 85, height: 105, category: 'Bedroom', variant: 'Queen', parentType: 'bed' },
  { type: 'bed-double', label: 'Double Bed', width: 80, height: 100, category: 'Bedroom', variant: 'Double', parentType: 'bed' },
  { type: 'bed-single', label: 'Single Bed', width: 50, height: 100, category: 'Bedroom', variant: 'Single', parentType: 'bed' },
  { type: 'wardrobe', label: 'Wardrobe', width: 60, height: 30, category: 'Bedroom' },
  { type: 'wardrobe-walk-in', label: 'Walk-in Closet', width: 80, height: 60, category: 'Bedroom' },
  { type: 'nightstand', label: 'Nightstand', width: 25, height: 25, category: 'Bedroom' },
  { type: 'dresser', label: 'Dresser', width: 50, height: 25, category: 'Bedroom' },
  // Dining — Table variants
  { type: 'dining-4', label: 'Dining Table (4-seat)', width: 80, height: 50, category: 'Dining', variant: '4-Seat', parentType: 'dining-table' },
  { type: 'dining-6', label: 'Dining Table (6-seat)', width: 110, height: 55, category: 'Dining', variant: '6-Seat', parentType: 'dining-table' },
  { type: 'dining-8', label: 'Dining Table (8-seat)', width: 140, height: 60, category: 'Dining', variant: '8-Seat', parentType: 'dining-table' },
  { type: 'chair', label: 'Chair', width: 22, height: 22, category: 'Dining' },
  // Kitchen
  { type: 'kitchen-counter', label: 'Counter', width: 100, height: 30, category: 'Kitchen' },
  { type: 'kitchen-island', label: 'Kitchen Island', width: 80, height: 60, category: 'Kitchen' },
  { type: 'stove', label: 'Stove', width: 35, height: 30, category: 'Kitchen' },
  { type: 'fridge', label: 'Fridge', width: 35, height: 35, category: 'Kitchen' },
  { type: 'sink', label: 'Sink', width: 30, height: 25, category: 'Kitchen' },
  // Bathroom
  { type: 'bathtub', label: 'Bathtub', width: 80, height: 40, category: 'Bathroom' },
  { type: 'shower', label: 'Shower Cabin', width: 45, height: 45, category: 'Bathroom' },
  { type: 'toilet', label: 'Toilet', width: 25, height: 30, category: 'Bathroom' },
  { type: 'basin', label: 'Basin', width: 30, height: 20, category: 'Bathroom' },
  { type: 'shower', label: 'Shower', width: 35, height: 35, category: 'Bathroom' },
  // Office
  { type: 'desk', label: 'Desk', width: 70, height: 35, category: 'Office' },
  { type: 'l-desk', label: 'L-Shape Desk', width: 80, height: 70, category: 'Office' },
  { type: 'office-chair', label: 'Office Chair', width: 28, height: 28, category: 'Office' },
  { type: 'filing-cabinet', label: 'Filing Cabinet', width: 35, height: 25, category: 'Office' },
  // Exterior
  { type: 'car', label: 'Car', width: 100, height: 50, category: 'Exterior' },
  { type: 'staircase', label: 'Staircase', width: 50, height: 100, category: 'Exterior' },
];

export const ROOM_PRESETS = [
  { name: 'Living Room', width: 250, height: 200, color: 'hsl(30 20% 92%)', roomType: 'room' as const },
  { name: 'Bedroom', width: 200, height: 180, color: 'hsl(30 15% 89%)', roomType: 'room' as const },
  { name: 'Kitchen', width: 180, height: 150, color: 'hsl(30 12% 86%)', roomType: 'room' as const },
  { name: 'Bathroom', width: 120, height: 100, color: 'hsl(30 10% 83%)', roomType: 'room' as const },
  { name: 'Dining Room', width: 180, height: 160, color: 'hsl(30 18% 90%)', roomType: 'room' as const },
  { name: 'Office', width: 160, height: 140, color: 'hsl(30 14% 87%)', roomType: 'room' as const },
  { name: 'Store Room', width: 100, height: 80, color: 'hsl(30 10% 84%)', roomType: 'room' as const },
  { name: 'Laundry', width: 100, height: 80, color: 'hsl(30 12% 85%)', roomType: 'room' as const },
] as const;

export const AREA_PRESETS = [
  { name: 'Hallway / Corridor', width: 120, height: 50, color: 'hsl(210 15% 88%)', roomType: 'hallway' as const },
  { name: 'Open Area', width: 200, height: 160, color: 'hsl(140 15% 88%)', roomType: 'open-area' as const },
  { name: 'Staircase', width: 80, height: 100, color: 'hsl(45 20% 85%)', roomType: 'staircase' as const },
  { name: 'Garage', width: 200, height: 180, color: 'hsl(210 10% 80%)', roomType: 'garage' as const },
  { name: 'Main Gate Area', width: 100, height: 60, color: 'hsl(30 25% 80%)', roomType: 'gate' as const },
] as const;

export const PLOT_PRESETS = [
  { label: '3 Marla (675 sq ft)', sqft: 675, widthFt: 25, depthFt: 27 },
  { label: '5 Marla (1125 sq ft)', sqft: 1125, widthFt: 25, depthFt: 45 },
  { label: '7 Marla (1575 sq ft)', sqft: 1575, widthFt: 35, depthFt: 45 },
  { label: '10 Marla (2250 sq ft)', sqft: 2250, widthFt: 35, depthFt: 65 },
  { label: '1 Kanal (4500 sq ft)', sqft: 4500, widthFt: 50, depthFt: 90 },
] as const;

export interface PlotLayout {
  rooms: Room[];
  doors: DoorItem[];
  windows: WindowItem[];
  furniture: FurnitureItem[];
}
