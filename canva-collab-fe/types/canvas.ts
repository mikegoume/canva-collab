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
