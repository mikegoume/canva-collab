import {
  BoundingBox,
  DrawingObject,
  Point,
  ResizeHandle,
} from "@/types/canvas";

import {
  drawArrow,
  drawCircle,
  drawCommonSetup,
  DrawContext,
  drawHexagon,
  drawLine,
  drawRectangle,
  drawStar,
  drawTriangle,
} from "./draw-utils";

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getCanvasCoordinates = (
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) => {
  const canvas = canvasRef.current;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();

  let clientX, clientY;
  if ("touches" in e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const x = clientX - rect.left;
  const y = clientY - rect.top;

  return { x, y };
};

export const calculateBoundingBox = (obj: DrawingObject): BoundingBox => {
  if (obj.type === "group" && obj.children) {
    // For groups, calculate bounding box that encompasses all children
    let minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY;

    obj.children.forEach((child) => {
      const childBox = calculateBoundingBox(child);
      minX = Math.min(minX, childBox.x);
      minY = Math.min(minY, childBox.y);
      maxX = Math.max(maxX, childBox.x + childBox.width);
      maxY = Math.max(maxY, childBox.y + childBox.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  if (obj.type === "draw") {
    let minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY;

    obj.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    const padding = obj.size / 2;
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }

  if (obj.type === "text" && obj.text) {
    const textWidth = obj.text.length * obj.size * 0.6;
    const textHeight = obj.size;
    return {
      x: obj.points[0].x,
      y: obj.points[0].y - textHeight,
      width: textWidth,
      height: textHeight,
    };
  }

  // For shapes
  if (obj.points.length >= 2) {
    const start = obj.points[0];
    const end = obj.points[1];

    if (
      obj.mode === "circle" ||
      obj.mode === "star" ||
      obj.mode === "hexagon"
    ) {
      const radius = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
      );
      return {
        x: start.x - radius,
        y: start.y - radius,
        width: radius * 2,
        height: radius * 2,
      };
    }

    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  return { x: 0, y: 0, width: 0, height: 0 };
};

export const isPointInBoundingBox = (
  point: Point,
  box: BoundingBox,
): boolean => {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
};

export const findObjectAtPoint = (
  point: Point,
  objects: DrawingObject[],
): DrawingObject | null => {
  // Check from top to bottom (reverse order)
  return (
    [...objects]
      .reverse()
      .find((obj) => isPointInBoundingBox(point, obj.boundingBox)) ?? null
  );
};

export const getResizeHandle = (
  point: Point,
  box: BoundingBox,
): ResizeHandle | null => {
  const handleSize = 8;
  const handles = [
    { type: "nw" as ResizeHandle, x: box.x, y: box.y },
    { type: "n" as ResizeHandle, x: box.x + box.width / 2, y: box.y },
    { type: "ne" as ResizeHandle, x: box.x + box.width, y: box.y },
    {
      type: "e" as ResizeHandle,
      x: box.x + box.width,
      y: box.y + box.height / 2,
    },
    {
      type: "se" as ResizeHandle,
      x: box.x + box.width,
      y: box.y + box.height,
    },
    {
      type: "s" as ResizeHandle,
      x: box.x + box.width / 2,
      y: box.y + box.height,
    },
    { type: "sw" as ResizeHandle, x: box.x, y: box.y + box.height },
    { type: "w" as ResizeHandle, x: box.x, y: box.y + box.height / 2 },
  ];

  for (const handle of handles) {
    if (
      point.x >= handle.x - handleSize / 2 &&
      point.x <= handle.x + handleSize / 2 &&
      point.y >= handle.y - handleSize / 2 &&
      point.y <= handle.y + handleSize / 2
    ) {
      return handle.type;
    }
  }

  return null;
};

export const drawShape = (
  ctx: CanvasRenderingContext2D,
  obj: DrawingObject,
  isPreview = false,
) => {
  if (obj.type === "group" && obj.children) {
    obj.children.forEach((child) => drawShape(ctx, child, isPreview));
    return;
  }

  if (obj.points.length < 2 && obj.type !== "text" && obj.type !== "draw")
    return;

  drawCommonSetup({ ctx, obj, isPreview });

  if (obj.type === "draw") {
    ctx.globalCompositeOperation =
      obj.mode === "eraser" ? "destination-out" : "source-over";
    ctx.beginPath();
    obj.points.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
    );
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    return;
  }

  if (obj.type === "text" && obj.text) {
    ctx.font = `${obj.size}px Arial`;
    ctx.fillText(obj.text, obj.points[0].x, obj.points[0].y);
    return;
  }

  const drawers: Record<string, (ctx: DrawContext) => void> = {
    rectangle: drawRectangle,
    circle: drawCircle,
    triangle: drawTriangle,
    line: drawLine,
    star: drawStar,
    arrow: drawArrow,
    hexagon: drawHexagon,
  };

  const draw = drawers[obj.mode];
  if (draw) draw({ ctx, obj, isPreview });

  ctx.setLineDash([]);
};

export const redrawCanvas = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  objects: DrawingObject[],
) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  objects?.forEach((obj) => {
    drawShape(ctx, obj);
  });
};

export const drawSelectionUI = (
  selectionCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  objects: DrawingObject[],
  selectedObjects: string[],
  selectionBox: BoundingBox | null,
) => {
  const canvas = selectionCanvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw selection box for multi-selection
  if (selectionBox) {
    ctx.strokeStyle = "#007acc";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      selectionBox.x,
      selectionBox.y,
      selectionBox.width,
      selectionBox.height,
    );
    ctx.setLineDash([]);
  }

  // Draw selection indicators for selected objects
  selectedObjects.forEach((objId) => {
    const obj = objects.find((o) => o.id === objId);
    if (!obj) return;

    const box = obj.boundingBox;

    // Draw selection outline
    ctx.strokeStyle = "#007acc";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.setLineDash([]);

    // Draw resize handles
    const handleSize = 8;
    const handles = [
      { x: box.x, y: box.y },
      { x: box.x + box.width / 2, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height / 2 },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x + box.width / 2, y: box.y + box.height },
      { x: box.x, y: box.y + box.height },
      { x: box.x, y: box.y + box.height / 2 },
    ];

    ctx.fillStyle = "#007acc";
    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize,
      );
    });
  });
};
