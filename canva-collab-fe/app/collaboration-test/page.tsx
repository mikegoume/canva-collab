"use client";

import { useEffect, useRef } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

type Shape = {
  x: number;
  y: number;
  r: number;
  color: string;
};

// run backend, then open two tabs - should sync
export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ydocRef = useRef<Y.Doc>(null);
  const shapesRef = useRef<Y.Array<Shape>>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      "canvas-room",
      ydoc,
    );
    const shapes = ydoc.getArray<Shape>("shapes");
    ydocRef.current = ydoc;
    shapesRef.current = shapes;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const drawAll = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      shapes.toArray().forEach(({ x, y, r, color }) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    };

    drawAll();
    shapes.observe(drawAll);

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const shapes = shapesRef.current;
    if (!canvas || !shapes) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    shapes.push([{ x, y, r: 10, color: "blue" }]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      style={{ border: "1px solid #ccc" }}
      onClick={handleClick}
    />
  );
}