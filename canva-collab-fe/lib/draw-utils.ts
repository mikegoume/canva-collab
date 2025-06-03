import { DrawingObject } from "@/types/canvas";

export type DrawContext = {
  ctx: CanvasRenderingContext2D;
  obj: DrawingObject;
  isPreview: boolean;
};

export const drawCommonSetup = ({ ctx, obj, isPreview }: DrawContext) => {
  ctx.strokeStyle = obj.color;
  ctx.fillStyle = obj.color;
  ctx.lineWidth = obj.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(isPreview ? [5, 5] : []);
};

export const drawRectangle = ({ ctx, obj }: DrawContext) => {
  const [start, end] = obj.points;
  const width = end.x - start.x;
  const height = end.y - start.y;
  obj.filled
    ? ctx.fillRect(start.x, start.y, width, height)
    : ctx.strokeRect(start.x, start.y, width, height);
};

export const drawCircle = ({ ctx, obj }: DrawContext) => {
  const [start, end] = obj.points;
  const radius = Math.hypot(end.x - start.x, end.y - start.y);
  ctx.beginPath();
  ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
  obj.filled ? ctx.fill() : ctx.stroke();
};

export const drawTriangle = ({ ctx, obj }: DrawContext) => {
  const [start, end] = obj.points;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineTo(start.x - (end.x - start.x), end.y);
  ctx.closePath();
  obj.filled ? ctx.fill() : ctx.stroke();
};

export const drawLine = ({ ctx, obj }: DrawContext) => {
  const [start, end] = obj.points;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
};

export const drawStar = ({ ctx, obj }: DrawContext) => {
  const [start, end] = obj.points;
  const r = Math.hypot(end.x - start.x, end.y - start.y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r / 2;
    const x = start.x + radius * Math.cos(angle - Math.PI / 2);
    const y = start.y + radius * Math.sin(angle - Math.PI / 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  obj.filled ? ctx.fill() : ctx.stroke();
};

export const drawArrow = ({ ctx, obj }: DrawContext) => {
  const [start, end] = obj.points;
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLen = Math.min(len / 3, 20);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle - Math.PI / 6),
    end.y - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle + Math.PI / 6),
    end.y - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
};

export const drawHexagon = ({ ctx, obj }: DrawContext) => {
  const [start, end] = obj.points;
  const r = Math.hypot(end.x - start.x, end.y - start.y);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = start.x + r * Math.cos(angle);
    const y = start.y + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  obj.filled ? ctx.fill() : ctx.stroke();
};
