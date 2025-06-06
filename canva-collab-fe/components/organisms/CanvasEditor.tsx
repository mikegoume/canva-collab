"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  calculateBoundingBox,
  drawSelectionUI,
  drawShape,
  findObjectAtPoint,
  generateId,
  getCanvasCoordinates,
  getResizeHandle,
  redrawCanvas,
} from "@/lib/cavas-utils";
import {
  BoundingBox,
  DrawingMode,
  DrawingObject,
  Point,
  ResizeHandle,
} from "@/types/canvas";

import CanvasLayers from "../molecules/CanvasLayers";
import CanvasToolbar from "../molecules/CanvasToolbar";

// TODO break code up - extract hook for functionality and components for UI.
export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([5]);
  const [brushColor, setBrushColor] = useState("#000000");
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("freehand");
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [filled, setFilled] = useState(false);

  // Object management
  const [objects, setObjects] = useState<DrawingObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<DrawingObject[]>([]);

  // History management
  const [history, setHistory] = useState<DrawingObject[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Text tool
  const [isTextMode, setIsTextMode] = useState(false);
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [textValue, setTextValue] = useState("");

  // Layer management
  const [activeLayerId, setActiveLayerId] = useState(0);

  // Selection and manipulation
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<BoundingBox | null>(null);

  const addToHistory = useCallback(
    (newObjects: DrawingObject[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push([...newObjects]);
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const clearCanvas = useCallback(() => {
    setObjects([]);
    setSelectedObjects([]);
    addToHistory([]);
  }, [addToHistory]);

  const createGroup = useCallback(() => {
    if (selectedObjects.length < 2) return;

    const selectedObjs = objects.filter((obj) =>
      selectedObjects.includes(obj.id),
    );
    const groupId = generateId();

    const group: DrawingObject = {
      id: groupId,
      type: "group",
      mode: "select",
      points: [],
      color: "",
      size: 0,
      filled: false,
      layerId: activeLayerId,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      children: selectedObjs.map((obj) => ({ ...obj, groupId })),
    };

    group.boundingBox = calculateBoundingBox(group);

    const newObjects = objects.filter(
      (obj) => !selectedObjects.includes(obj.id),
    );
    newObjects.push(group);

    setObjects(newObjects);
    setSelectedObjects([groupId]);
    addToHistory(newObjects);
  }, [selectedObjects, objects, activeLayerId, addToHistory]);

  const ungroup = useCallback(() => {
    const newObjects = [...objects];
    let hasChanges = false;

    selectedObjects.forEach((objId) => {
      const objIndex = newObjects.findIndex((obj) => obj.id === objId);
      if (objIndex === -1) return;

      const obj = newObjects[objIndex];
      if (obj.type === "group" && obj.children) {
        // Remove the group and add its children
        newObjects.splice(objIndex, 1);
        const ungroupedChildren = obj.children.map((child) => ({
          ...child,
          groupId: undefined,
        }));
        newObjects.push(...ungroupedChildren);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setObjects(newObjects);
      setSelectedObjects([]);
      addToHistory(newObjects);
    }
  }, [selectedObjects, objects, addToHistory]);

  const copyObjects = useCallback(() => {
    const selectedObjs = objects.filter((obj) =>
      selectedObjects.includes(obj.id),
    );
    setClipboard(selectedObjs.map((obj) => ({ ...obj, id: generateId() })));
  }, [selectedObjects, objects]);

  const pasteObjects = useCallback(() => {
    if (clipboard.length === 0) return;

    const pastedObjects = clipboard.map((obj) => {
      const newObj = {
        ...obj,
        id: generateId(),
        points: obj.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
      };
      newObj.boundingBox = calculateBoundingBox(newObj);
      return newObj;
    });

    const newObjects = [...objects, ...pastedObjects];
    setObjects(newObjects);
    setSelectedObjects(pastedObjects.map((obj) => obj.id));
    addToHistory(newObjects);
  }, [clipboard, objects, addToHistory]);

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      const coords = getCanvasCoordinates(e, canvasRef);

      if (drawingMode === "select") {
        const clickedObject = findObjectAtPoint(coords, objects);

        if (clickedObject) {
          // Check if clicking on resize handle
          if (selectedObjects.includes(clickedObject.id)) {
            const handle = getResizeHandle(coords, clickedObject.boundingBox);
            if (handle) {
              setIsResizing(true);
              setResizeHandle(handle);
              setDragStart(coords);
              return;
            }
          }

          // Select object
          if (e.shiftKey || e.ctrlKey) {
            // Multi-select
            setSelectedObjects((prev) =>
              prev.includes(clickedObject.id)
                ? prev.filter((id) => id !== clickedObject.id)
                : [...prev, clickedObject.id],
            );
          } else {
            setSelectedObjects([clickedObject.id]);
          }

          setIsDragging(true);
          setDragStart(coords);
        } else {
          // Start selection box
          if (!e.shiftKey && !e.ctrlKey) {
            setSelectedObjects([]);
          }
          setIsMultiSelecting(true);
          setSelectionBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
          setDragStart(coords);
        }
        return;
      }

      if (drawingMode === "text") {
        setTextPosition(coords);
        setIsTextMode(true);
        setTimeout(() => textInputRef.current?.focus(), 0);
        return;
      }

      setIsDrawing(true);
      setStartPoint(coords);
      setCurrentPoint(coords);

      if (drawingMode === "freehand" || drawingMode === "eraser") {
        const newObject: DrawingObject = {
          id: generateId(),
          type: "draw",
          mode: drawingMode,
          points: [coords],
          color: brushColor,
          size: brushSize[0],
          filled: false,
          layerId: activeLayerId,
          boundingBox: { x: coords.x, y: coords.y, width: 0, height: 0 },
        };

        setObjects((prev) => [...prev, newObject]);
      }
    },
    [
      drawingMode,
      objects,
      selectedObjects,
      brushColor,
      brushSize,
      activeLayerId,
    ],
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      const coords = getCanvasCoordinates(e, canvasRef);

      if (drawingMode === "select") {
        if (isResizing && dragStart && resizeHandle) {
          // Handle resizing

          setObjects((prev) =>
            prev.map((obj) => {
              if (!selectedObjects.includes(obj.id)) return obj;

              const newObj = { ...obj };

              // Apply resize based on handle
              switch (resizeHandle) {
                case "se":
                  if (obj.type === "shape" && obj.points.length >= 2) {
                    newObj.points = [
                      obj.points[0],
                      { x: coords.x, y: coords.y },
                    ];
                  }
                  break;
                // Add other resize handles as needed
              }

              newObj.boundingBox = calculateBoundingBox(newObj);
              return newObj;
            }),
          );
        } else if (isDragging && dragStart) {
          // Handle dragging
          const deltaX = coords.x - dragStart.x;
          const deltaY = coords.y - dragStart.y;

          setObjects((prev) =>
            prev.map((obj) => {
              if (!selectedObjects.includes(obj.id)) return obj;

              const newObj = { ...obj };
              if (obj.type === "group" && obj.children) {
                newObj.children = obj.children.map((child) => ({
                  ...child,
                  points: child.points.map((p) => ({
                    x: p.x + deltaX,
                    y: p.y + deltaY,
                  })),
                }));
              } else {
                newObj.points = obj.points.map((p) => ({
                  x: p.x + deltaX,
                  y: p.y + deltaY,
                }));
              }
              newObj.boundingBox = calculateBoundingBox(newObj);
              return newObj;
            }),
          );

          setDragStart(coords);
        } else if (isMultiSelecting && dragStart) {
          // Update selection box
          setSelectionBox({
            x: Math.min(dragStart.x, coords.x),
            y: Math.min(dragStart.y, coords.y),
            width: Math.abs(coords.x - dragStart.x),
            height: Math.abs(coords.y - dragStart.y),
          });
        }
        return;
      }

      if (!isDrawing) return;

      setCurrentPoint(coords);

      if (drawingMode === "freehand" || drawingMode === "eraser") {
        setObjects((prev) => {
          const newObjects = [...prev];
          const lastObj = newObjects[newObjects.length - 1];
          if (lastObj) {
            lastObj.points.push(coords);
            lastObj.boundingBox = calculateBoundingBox(lastObj);
          }
          return newObjects;
        });
      }
    },
    [
      drawingMode,
      isResizing,
      isDragging,
      isMultiSelecting,
      dragStart,
      resizeHandle,
      selectedObjects,
      isDrawing,
    ],
  );

  const stopDrawing = useCallback(() => {
    if (drawingMode === "select") {
      if (isMultiSelecting && selectionBox) {
        // Select objects within selection box
        const objectsInBox = objects.filter((obj) => {
          const box = obj.boundingBox;
          return (
            box.x >= selectionBox.x &&
            box.y >= selectionBox.y &&
            box.x + box.width <= selectionBox.x + selectionBox.width &&
            box.y + box.height <= selectionBox.y + selectionBox.height
          );
        });

        setSelectedObjects((prev) => [
          ...prev,
          ...objectsInBox.map((obj) => obj.id),
        ]);
        setSelectionBox(null);
      }

      if (isDragging || isResizing) {
        addToHistory(objects);
      }

      setIsMultiSelecting(false);
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      setDragStart(null);
      return;
    }

    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false);
      return;
    }

    if (drawingMode !== "freehand" && drawingMode !== "eraser") {
      const newObject: DrawingObject = {
        id: generateId(),
        type: "shape",
        mode: drawingMode,
        points: [startPoint, currentPoint],
        color: brushColor,
        size: brushSize[0],
        filled: filled,
        layerId: activeLayerId,
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      };

      newObject.boundingBox = calculateBoundingBox(newObject);
      setObjects((prev) => [...prev, newObject]);
    }

    addToHistory(objects);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [
    drawingMode,
    isMultiSelecting,
    selectionBox,
    objects,
    isDragging,
    isResizing,
    addToHistory,
    isDrawing,
    startPoint,
    currentPoint,
    brushColor,
    brushSize,
    filled,
    activeLayerId,
  ]);

  const handleTextSubmit = useCallback(() => {
    if (textPosition && textValue.trim()) {
      const textObject: DrawingObject = {
        id: generateId(),
        type: "text",
        mode: "text",
        points: [textPosition],
        color: brushColor,
        size: brushSize[0] * 2,
        filled: false,
        text: textValue,
        layerId: activeLayerId,
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      };

      textObject.boundingBox = calculateBoundingBox(textObject);
      setObjects((prev) => [...prev, textObject]);
      addToHistory([...objects, textObject]);
    }

    setIsTextMode(false);
    setTextPosition(null);
    setTextValue("");
  }, [
    textPosition,
    textValue,
    brushColor,
    brushSize,
    activeLayerId,
    objects,
    addToHistory,
  ]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setObjects(history[historyIndex - 1]);
      setSelectedObjects([]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setObjects(history[historyIndex + 1]);
      setSelectedObjects([]);
    }
  }, [historyIndex, history]);

  // Update canvas size and redraw when needed
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const selectionCanvas = selectionCanvasRef.current;
    if (!canvas || !previewCanvas || !selectionCanvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      previewCanvas.width = rect.width;
      previewCanvas.height = rect.height;
      selectionCanvas.width = rect.width;
      selectionCanvas.height = rect.height;

      redrawCanvas(canvasRef, objects);
      drawSelectionUI(
        selectionCanvasRef,
        objects,
        selectedObjects,
        selectionBox,
      );
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [objects, selectedObjects, selectionBox]);

  // Redraw when objects change
  useEffect(() => {
    redrawCanvas(canvasRef, objects);
  }, [objects]);

  // Update selection UI when selection changes
  useEffect(() => {
    drawSelectionUI(selectionCanvasRef, objects, selectedObjects, selectionBox);
  }, [objects, selectedObjects, selectionBox]);

  // Preview shape while drawing
  useEffect(() => {
    if (
      !isDrawing ||
      !startPoint ||
      !currentPoint ||
      drawingMode === "freehand" ||
      drawingMode === "eraser" ||
      drawingMode === "text" ||
      drawingMode === "select"
    )
      return;

    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const previewObject: DrawingObject = {
      id: "preview",
      type: "shape",
      mode: drawingMode,
      points: [startPoint, currentPoint],
      color: brushColor,
      size: brushSize[0],
      filled: filled,
      layerId: activeLayerId,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    };

    drawShape(ctx, previewObject, true);
  }, [
    isDrawing,
    startPoint,
    currentPoint,
    drawingMode,
    brushColor,
    brushSize,
    filled,
    activeLayerId,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "g":
            e.preventDefault();
            createGroup();
            break;
          case "u":
            e.preventDefault();
            ungroup();
            break;
          case "c":
            e.preventDefault();
            copyObjects();
            break;
          case "v":
            e.preventDefault();
            pasteObjects();
            break;
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const newObjects = objects.filter(
          (obj) => !selectedObjects.includes(obj.id),
        );
        setObjects(newObjects);
        setSelectedObjects([]);
        addToHistory(newObjects);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    createGroup,
    ungroup,
    copyObjects,
    pasteObjects,
    undo,
    redo,
    objects,
    selectedObjects,
    addToHistory,
  ]);

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50">
      <CanvasToolbar
        selectedObjects={selectedObjects}
        createGroup={createGroup}
        ungroup={ungroup}
        copyObjects={copyObjects}
        pasteObjects={pasteObjects}
        undo={undo}
        redo={redo}
        clipboard={clipboard}
        historyIndex={historyIndex}
        clearCanvas={clearCanvas}
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        setFilled={setFilled}
        filled={filled}
      />
      <div className="flex flex-1 gap-4 mx-4 mb-4">
        <CanvasLayers
          activeLayerId={activeLayerId}
          selectedObjects={selectedObjects}
          setActiveLayerId={setActiveLayerId}
        />

        {/* Canvas Container */}
        <div className="relative flex-1">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 bg-white rounded-lg border border-gray-300 shadow-lg size-full"
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
              stopDrawing();
            }}
            style={{
              cursor:
                drawingMode === "select"
                  ? "default"
                  : drawingMode === "text"
                    ? "text"
                    : "crosshair",
            }}
          />

          {/* Preview Canvas */}
          <canvas
            ref={previewCanvasRef}
            className="absolute inset-0 pointer-events-none size-full"
          />

          {/* Selection Canvas */}
          <canvas
            ref={selectionCanvasRef}
            className="absolute inset-0 pointer-events-none size-full"
          />

          {/* Text Input */}
          {isTextMode && textPosition && (
            <div
              className="absolute"
              style={{
                left: textPosition.x,
                top: textPosition.y - 30,
              }}
            >
              <Input
                ref={textInputRef}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTextSubmit();
                  } else if (e.key === "Escape") {
                    setIsTextMode(false);
                    setTextPosition(null);
                    setTextValue("");
                  }
                }}
                onBlur={handleTextSubmit}
                className="w-48"
                placeholder="Enter text..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
