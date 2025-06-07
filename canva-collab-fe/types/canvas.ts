type DrawingMode =
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

type DrawingType = "draw" | "shape" | "text" | "group";

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
  name: string;
  type: DrawingType;
  mode: DrawingMode;
  points: Point[];
  color: string;
  size: number;
  filled: boolean;
  text?: string;
  layerId: number;
  boundingBox: BoundingBox;
  children: DrawingObject[]; // For groups
  groupId?: string; // Reference to parent group
  createdAt: string;
}

export interface Layer {
  id: number;
  name: string;
  visible: boolean;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
