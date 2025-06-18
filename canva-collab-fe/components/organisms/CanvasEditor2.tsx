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
import { awareness,yCanvas } from "@/lib/yjs";
import { DrawingObject } from "@/types/canvas";

import CanvasLayers from "../molecules/CanvasLayers";
import CanvasToolbar2 from "../molecules/CanvasToolbar2";

export const generateId = () => Math.random().toString(36).substr(2, 9);

 type CanvasEditor2Props = {
  canvas: DrawingObject,
  setCanvas:  Dispatch<SetStateAction<DrawingObject | null>>
}

function CanvasEditor2({ canvas, setCanvas }: CanvasEditor2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [newDraw, setNewDraw] = useState<DrawingObject | null>(null);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState([5]);
  const [activeLayerId, setActiveLayerId] = useState(0);
  const [remoteCursors, setRemoteCursors] = useState<{ [clientId: number]: { x: number; y: number } }>({});

  // Sync canvas state with Yjs shared map
  useEffect(() => {
    const updateFromYjs = () => {
      const yData = yCanvas.get("data");
      if (yData) {
        setCanvas(yData);
      }
    };

    updateFromYjs();
    yCanvas.observe(updateFromYjs);
    return () => yCanvas.unobserve(updateFromYjs);
  }, [setCanvas]);

  const updateSharedCanvas = (updatedCanvas: DrawingObject | null) => {
    yCanvas.set("data", updatedCanvas);
  };

  useEffect(() => {
    const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16);
    awareness.setLocalStateField("color", randomColor);
  }, []);

  // Awareness subscription for remote cursors
  useEffect(() => {
    const onAwarenessChange = () => {
      const states = awareness.getStates();
      const cursors: { [clientId: number]: { x: number; y: number } } = {};

      states.forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state.cursor) {
          cursors[clientId] = state.cursor;
        }
      });

      setRemoteCursors(cursors);
    };

    awareness.on("change", onAwarenessChange);
    return () => awareness.off("change", onAwarenessChange);
  }, []);

  // Drawing logic
  useEffect(() => {
    const activeLayerObjects = canvas.children.filter(
      (obj) => obj.layerId === activeLayerId
    );

    const allObjects = newDraw && newDraw.layerId === activeLayerId
      ? [...activeLayerObjects, newDraw]
      : activeLayerObjects;

    redrawCanvas(canvasRef, allObjects);
  }, [canvas, newDraw, activeLayerId]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
      layerId: activeLayerId,
      boundingBox: { x: coords.x, y: coords.y, width: 0, height: 0 },
      children: [],
      createdAt: new Date().toISOString(),
    };

    setNewDraw(newObject);
  }, [brushColor, brushSize, activeLayerId]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!newDraw) return;
    const coords = getCanvasCoordinates(e, canvasRef);
    setNewDraw((prev) => prev ? { ...prev, points: [...prev.points, coords] } : null);
  }, [newDraw]);

  const stopDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!newDraw) return;
    const coords = getCanvasCoordinates(e, canvasRef);
    setNewDraw((prev) => prev ? { ...prev, points: [...prev.points, coords] } : null);

    const updatedCanvas: DrawingObject = {
      ...canvas,
      children: [...canvas.children, newDraw],
    };

    updateSharedCanvas(updatedCanvas);
    setNewDraw(null);
  }, [newDraw, canvas]);

  const clearCanvas = useCallback(() => {
    const clearedCanvas: DrawingObject = {
      ...canvas,
      children: [],
    };
    updateSharedCanvas(clearedCanvas);
  }, [canvas]);

  const handleSaveCanvas = async () => {
    await updateCanvas(canvas.id, canvas);
    window.history.back();
  };

  // Resize canvas
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const resizeCanvas = () => {
      const rect = canvasEl.getBoundingClientRect();
      canvasEl.width = rect.width;
      canvasEl.height = rect.height;

      const activeLayerObjects = canvas.children.filter(
        (obj) => obj.layerId === activeLayerId
      );
      redrawCanvas(canvasRef, activeLayerObjects);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [canvas, activeLayerId]);

  // Handle mouse move for awareness
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const coords = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    awareness.setLocalStateField("cursor", coords);
    draw(e);
  };

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
          setCanvas={updateSharedCanvas}
        />
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full border border-gray-300 rounded-lg shadow-lg bg-white"
            onMouseDown={startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
            onTouchMove={(e) => { e.preventDefault(); draw(e); }}
            onTouchEnd={(e) => { e.preventDefault(); stopDrawing(e); }}
            style={{ cursor: "crosshair" }}
          />

          {Object.entries(remoteCursors).map(([clientId, cursor]) => (
            <div
              key={clientId}
              className="absolute w-3 h-3 bg-red-500 rounded-full pointer-events-none"
              style={{ left: cursor.x, top: cursor.y }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CanvasEditor2;
