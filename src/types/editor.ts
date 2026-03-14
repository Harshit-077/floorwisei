export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
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
] as const;

export const WINDOW_PRESETS = [
  { label: 'Standard Window', width: 40, height: 6 },
  { label: 'Large Window', width: 60, height: 6 },
  { label: 'Small Window', width: 25, height: 5 },
  { label: 'Bay Window', width: 70, height: 10 },
] as const;

export const FURNITURE_CATALOG = [
  // Living - Sofa variants
  { type: 'sofa-2-seater', label: '2-Seater Sofa', width: 75, height: 40, category: 'Living' },
  { type: 'sofa-3-seater', label: '3-Seater Sofa', width: 110, height: 45, category: 'Living' },
  { type: 'sofa-l-shape', label: 'L-Shape Sofa', width: 120, height: 90, category: 'Living' },
  { type: 'sofa-sectional', label: 'Sectional Sofa', width: 140, height: 100, category: 'Living' },
  { type: 'armchair', label: 'Armchair', width: 40, height: 40, category: 'Living' },
  { type: 'recliner', label: 'Recliner', width: 45, height: 45, category: 'Living' },
  { type: 'coffee-table', label: 'Coffee Table', width: 60, height: 35, category: 'Living' },
  { type: 'tv-unit', label: 'TV Unit', width: 80, height: 25, category: 'Living' },
  { type: 'bookshelf', label: 'Bookshelf', width: 60, height: 20, category: 'Living' },
  { type: 'side-table', label: 'Side Table', width: 25, height: 25, category: 'Living' },

  // Bedroom
  { type: 'bed-single', label: 'Single Bed', width: 50, height: 100, category: 'Bedroom' },
  { type: 'bed-double', label: 'Double Bed', width: 80, height: 100, category: 'Bedroom' },
  { type: 'bed-king', label: 'King Bed', width: 100, height: 110, category: 'Bedroom' },
  { type: 'wardrobe', label: 'Wardrobe', width: 60, height: 30, category: 'Bedroom' },
  { type: 'wardrobe-walk-in', label: 'Walk-in Closet', width: 80, height: 60, category: 'Bedroom' },
  { type: 'nightstand', label: 'Nightstand', width: 25, height: 25, category: 'Bedroom' },
  { type: 'dresser', label: 'Dresser', width: 50, height: 25, category: 'Bedroom' },
  { type: 'vanity', label: 'Vanity Table', width: 45, height: 25, category: 'Bedroom' },

  // Dining
  { type: 'dining-table-4', label: '4-Seater Table', width: 60, height: 40, category: 'Dining' },
  { type: 'dining-table-6', label: '6-Seater Table', width: 80, height: 50, category: 'Dining' },
  { type: 'dining-table-8', label: '8-Seater Table', width: 100, height: 55, category: 'Dining' },
  { type: 'chair', label: 'Chair', width: 22, height: 22, category: 'Dining' },

  // Kitchen
  { type: 'kitchen-counter', label: 'Counter', width: 100, height: 30, category: 'Kitchen' },
  { type: 'kitchen-island', label: 'Kitchen Island', width: 70, height: 45, category: 'Kitchen' },
  { type: 'stove', label: 'Stove', width: 35, height: 30, category: 'Kitchen' },
  { type: 'fridge', label: 'Fridge', width: 35, height: 35, category: 'Kitchen' },
  { type: 'sink', label: 'Sink', width: 30, height: 25, category: 'Kitchen' },
  { type: 'dishwasher', label: 'Dishwasher', width: 30, height: 30, category: 'Kitchen' },

  // Bathroom
  { type: 'bathtub', label: 'Bathtub', width: 80, height: 40, category: 'Bathroom' },
  { type: 'shower', label: 'Shower Cabin', width: 45, height: 45, category: 'Bathroom' },
  { type: 'toilet', label: 'Toilet', width: 25, height: 30, category: 'Bathroom' },
  { type: 'basin', label: 'Basin', width: 30, height: 20, category: 'Bathroom' },
  { type: 'double-basin', label: 'Double Basin', width: 55, height: 22, category: 'Bathroom' },

  // Office
  { type: 'desk', label: 'Desk', width: 70, height: 35, category: 'Office' },
  { type: 'l-desk', label: 'L-Shape Desk', width: 80, height: 70, category: 'Office' },
  { type: 'office-chair', label: 'Office Chair', width: 28, height: 28, category: 'Office' },
  { type: 'filing-cabinet', label: 'Filing Cabinet', width: 20, height: 25, category: 'Office' },

  // Exterior / Structure
  { type: 'car-porch', label: 'Car Porch', width: 150, height: 120, category: 'Exterior' },
  { type: 'staircase', label: 'Staircase', width: 50, height: 100, category: 'Exterior' },
  { type: 'spiral-staircase', label: 'Spiral Staircase', width: 60, height: 60, category: 'Exterior' },
  { type: 'hallway', label: 'Hallway', width: 120, height: 40, category: 'Exterior' },
  { type: 'open-area', label: 'Open Area', width: 100, height: 80, category: 'Exterior' },
  { type: 'garage', label: 'Garage', width: 160, height: 130, category: 'Exterior' },
] as const;

export const ROOM_PRESETS = [
  { name: 'Living Room', width: 250, height: 200, color: 'hsl(30 20% 92%)' },
  { name: 'Bedroom', width: 200, height: 180, color: 'hsl(30 15% 89%)' },
  { name: 'Kitchen', width: 180, height: 150, color: 'hsl(30 12% 86%)' },
  { name: 'Bathroom', width: 120, height: 100, color: 'hsl(30 10% 83%)' },
  { name: 'Dining Room', width: 180, height: 160, color: 'hsl(30 18% 90%)' },
  { name: 'Office', width: 160, height: 140, color: 'hsl(30 14% 87%)' },
  { name: 'Store Room', width: 100, height: 80, color: 'hsl(30 10% 84%)' },
  { name: 'Laundry', width: 100, height: 80, color: 'hsl(30 12% 85%)' },
  { name: 'Garage', width: 200, height: 180, color: 'hsl(30 8% 82%)' },
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
