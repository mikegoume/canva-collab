import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { updateCanvas } from "@/lib/canvas-services";
import { getCanvasCoordinates, redrawCanvas } from "@/lib/cavas-utils";
import { DrawingObject } from "@/types/canvas";

import CanvasLayers from "../molecules/CanvasLayers";
import CanvasToolbar2 from "../molecules/CanvasToolbar2";

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
  const [activeLayerId, setActiveLayerId] = useState(0);

// Update the useEffect that redraws the canvas
useEffect(() => {
  // Filter canvas children to only include objects from the active layer
  const activeLayerObjects = canvas.children.filter(
    (obj) => obj.layerId === activeLayerId
  );
  
  // Include the current drawing if it exists and belongs to active layer
  const allObjects = newDraw && newDraw.layerId === activeLayerId
    ? [...activeLayerObjects, newDraw]
    : activeLayerObjects;
    
  redrawCanvas(canvasRef, allObjects);
}, [canvas, newDraw, activeLayerId]); // Add activeLayerId as dependency

const startDrawing = useCallback(
  (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const coords = getCanvasCoordinates(e, canvasRef);

    const newObject: DrawingObject = {
      id: generateId(),
      title: "New Canvas",
      type: "draw",
      mode: "freehand",
      points: [coords],
      color: brushColor,
      size: brushSize[0],
      filled: false,
      layerId: activeLayerId, // Use activeLayerId instead of hardcoded 0
      boundingBox: { x: coords.x, y: coords.y, width: 0, height: 0 },
      children: [],
      createdAt: new Date().toISOString(),
    };

    setNewDraw(newObject);
  },
  [brushColor, brushSize, activeLayerId] // Add activeLayerId as dependency
);

  const draw = useCallback(
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

  const handleSaveCanvas = async () => {
    await updateCanvas(canvas.id, canvas);
    window.history.back()
  }

// First useEffect - for redrawing when objects change
useEffect(() => {
  // Filter canvas children to only include objects from the active layer
  const activeLayerObjects = canvas.children.filter(
    (obj) => obj.layerId === activeLayerId
  );
  
  // Include the current drawing if it exists and belongs to active layer
  const allObjects = newDraw && newDraw.layerId === activeLayerId
    ? [...activeLayerObjects, newDraw]
    : activeLayerObjects;
    
  redrawCanvas(canvasRef, allObjects);
}, [canvas, newDraw, activeLayerId]); // Add activeLayerId as dependency

  // Update canvas size and redraw when needed
  useEffect(() => {
    const canvasPreview = canvasRef.current;
    if (!canvasPreview) return;
  
    const resizeCanvas = () => {
      const rect = canvasPreview.getBoundingClientRect();
      canvasPreview.width = rect.width;
      canvasPreview.height = rect.height;
  
      // Filter by active layer when resizing
      const activeLayerObjects = canvas.children.filter(
        (obj) => obj.layerId === activeLayerId
      );
      redrawCanvas(canvasRef, activeLayerObjects);
    };
  
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [canvas, activeLayerId]); // Add activeLayerId as dependency

  return (
    <div className="h-screen w-full flex-1 flex flex-col bg-gray-50">
      <div className="flex flex-row justify-center items-center">
        <CanvasToolbar2
          clearCanvas={clearCanvas}
          brushSize={brushSize}
          brushColor={brushColor}
          setBrushSize={setBrushSize}
          setBrushColor={setBrushColor}
          handleSaveCanvas={handleSaveCanvas}
        />
      </div>
      <div className="flex flex-1 mx-4 mb-4 gap-4">
      <CanvasLayers
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          canvas={canvas}
          setCanvas={setCanvas}
        />
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
