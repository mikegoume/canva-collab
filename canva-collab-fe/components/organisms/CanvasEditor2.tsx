import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getCanvasCoordinates, redrawCanvas } from "@/lib/cavas-utils";
import { DrawingObject, Point } from "@/types/canvas";

import CanvasToolbar2 from "../mollecules/CanvasToolbar2";

export const generateId = () => Math.random().toString(36).substr(2, 9);

function CanvasEditor2({
  canvas,
  setCanvas,
}: {
  canvas: DrawingObject;
  setCanvas: Dispatch<SetStateAction<DrawingObject | null>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [newDraw, setNewDraw] = useState<DrawingObject | null>(null);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState([5]);

  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const coords = getCanvasCoordinates(e, canvasRef);
      setStartPoint(coords);
      setCurrentPoint(coords);

      const newObject: DrawingObject = {
        id: generateId(),
        type: "draw",
        mode: "freehand",
        points: [coords],
        color: brushColor,
        size: brushSize[0],
        filled: false,
        layerId: 0,
        boundingBox: { x: coords.x, y: coords.y, width: 0, height: 0 },
        children: [],
        createdAt: new Date().toISOString(),
      };

      setNewDraw(newObject);
    },
    [brushColor, brushSize]
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!newDraw) return;

      const coords = getCanvasCoordinates(e, canvasRef);
      setCurrentPoint(coords);

      setNewDraw((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, coords],
        };
      });
    },
    [newDraw]
  );

  const stopDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!newDraw) return;

      const coords = getCanvasCoordinates(e, canvasRef);
      setNewDraw((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, coords],
        };
      });

      setCanvas((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          children: [...prev.children, newDraw],
        };
      });

      setNewDraw(null);
      setStartPoint(null);
      setCurrentPoint(null);
    },
    [newDraw, setCanvas]
  );

  const clearCanvas = useCallback(() => {
    setCanvas((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        children: [],
      };
    });
  }, [setCanvas]);

  // Redraw when objects change
  useEffect(() => {
    redrawCanvas(canvasRef, canvas.children);
  }, [canvas]);

  // Update canvas size and redraw when needed
  useEffect(() => {
    const canvasPreview = canvasRef.current;
    if (!canvasPreview) return;

    const resizeCanvas = () => {
      const rect = canvasPreview.getBoundingClientRect();
      canvasPreview.width = rect.width;
      canvasPreview.height = rect.height;

      redrawCanvas(canvasRef, canvas.children);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [canvas]);

  // Preview shape while drawing
  // useEffect(() => {
  //   if (!startPoint || !currentPoint) return;

  //   const previewCanvas = canvasRef.current;
  //   if (!previewCanvas) return;

  //   const ctx = previewCanvas.getContext("2d");
  //   if (!ctx) return;

  //   ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  //   const previewObject: DrawingObject = {
  //     id: generateId(),
  //     type: "draw",
  //     mode: "freehand",
  //     points: [startPoint, currentPoint],
  //     color: brushColor,
  //     size: brushSize[0],
  //     filled: false,
  //     layerId: 0,
  //     boundingBox: { x: 0, y: 0, width: 0, height: 0 },
  //     children: [],
  //     createdAt: new Date().toISOString(),
  //   };

  //   drawShape(ctx, previewObject, true);
  // }, [startPoint, currentPoint, brushColor, brushSize]);

  return (
    <div className="h-screen w-full flex-1 flex flex-col bg-gray-50">
      <div className="flex flex-row justify-center items-center">
        <CanvasToolbar2
          clearCanvas={clearCanvas}
          brushSize={brushSize}
          brushColor={brushColor}
          setBrushSize={setBrushSize}
          setBrushColor={setBrushColor}
        />
      </div>
      <div className="flex flex-1 mx-4 mb-4 gap-4">
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full border border-gray-300 rounded-lg shadow-lg bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault();
              startDrawing(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              draw(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopDrawing(e);
            }}
            style={{
              cursor: "crosshair",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CanvasEditor2;
