export interface CanvasElement {
  id: string;
  type: "text" | "rectangle" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string; // For text elements
  backgroundColor?: string; // For shapes
  borderRadius?: number; // For shapes
  src?: string; // For images
  alt?: string; // For images
}

export interface Canvas {
  id?: string;
  name: string;
  width: number;
  height: number;
  elements: CanvasElement[];
  createdAt: string;
}

export type DrawingMode =
  | "select"
  | "freehand"
  | "rectangle"
  | "circle"
  | "triangle"
  | "line"
  | "eraser"
  | "text"
  | "star"
  | "arrow"
  | "hexagon";

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawingObject {
  id: string;
  type: "draw" | "shape" | "text" | "group";
  mode: DrawingMode;
  points: Point[];
  color: string;
  size: number;
  filled: boolean;
  text?: string;
  layerId: number;
  boundingBox: BoundingBox;
  children?: DrawingObject[]; // For groups
  groupId?: string; // Reference to parent group
  createdAt: string;
}

export interface Layer {
  id: number;
  name: string;
  visible: boolean;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
