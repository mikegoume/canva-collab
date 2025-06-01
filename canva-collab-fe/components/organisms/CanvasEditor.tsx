/* eslint-disable prettier/prettier */
"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Circle,
  Clipboard,
  Copy,
  Edit3,
  Eraser,
  Eye,
  EyeOff,
  Group,
  Hexagon,
  Layers,
  Minus,
  MousePointer,
  Palette,
  Plus,
  Redo,
  RotateCcw,
  Square,
  Star,
  Trash2,
  Triangle,
  Type,
  Undo,
  Ungroup,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const colors = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#FFFFFF",
  "#808080",
  "#8B4513",
  "#006400",
  "#4B0082",
];

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

interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingObject {
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
}

interface Layer {
  id: number;
  name: string;
  visible: boolean;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

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
  const [layers, setLayers] = useState<Layer[]>([]);
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
    [],
  );

  // Initialize layers
  useEffect(() => {
    const initialLayer: Layer = {
      id: 0,
      name: "Layer 1",
      visible: true,
    };
    setLayers([initialLayer]);
    addToHistory([]);
  }, [addToHistory]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getCanvasCoordinates = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
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
    },
    [],
  );

  const calculateBoundingBox = useCallback(
    (obj: DrawingObject): BoundingBox => {
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
    },
    [],
  );

  const isPointInBoundingBox = useCallback(
    (point: Point, box: BoundingBox): boolean => {
      return (
        point.x >= box.x &&
        point.x <= box.x + box.width &&
        point.y >= box.y &&
        point.y <= box.y + box.height
      );
    },
    [],
  );

  const findObjectAtPoint = useCallback(
    (point: Point): DrawingObject | null => {
      // Check from top to bottom (reverse order)
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (isPointInBoundingBox(point, obj.boundingBox)) {
          return obj;
        }
      }
      return null;
    },
    [objects, isPointInBoundingBox],
  );

  const getResizeHandle = useCallback(
    (point: Point, box: BoundingBox): ResizeHandle | null => {
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
    },
    [],
  );

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, obj: DrawingObject, isPreview = false) => {
      if (obj.type === "group" && obj.children) {
        obj.children.forEach((child) => drawShape(ctx, child, isPreview));
        return;
      }

      ctx.strokeStyle = obj.color;
      ctx.fillStyle = obj.color;
      ctx.lineWidth = obj.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (isPreview) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      if (obj.type === "draw") {
        if (obj.mode === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        ctx.beginPath();
        obj.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        return;
      }

      if (obj.type === "text" && obj.text) {
        ctx.font = `${obj.size}px Arial`;
        ctx.fillText(obj.text, obj.points[0].x, obj.points[0].y);
        return;
      }

      if (obj.points.length < 2) return;

      const start = obj.points[0];
      const end = obj.points[1];

      switch (obj.mode) {
        case "rectangle": {
          const width = end.x - start.x;
          const height = end.y - start.y;
          if (obj.filled) {
            ctx.fillRect(start.x, start.y, width, height);
          } else {
            ctx.strokeRect(start.x, start.y, width, height);
          }
          break;
        }

        case "circle": {
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
          );
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          if (obj.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
          break;
        }

        case "triangle":
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(start.x - (end.x - start.x), end.y);
          ctx.closePath();
          if (obj.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
          break;

        case "line":
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          break;

        case "star": {
          const starRadius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
          );
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const r = i % 2 === 0 ? starRadius : starRadius / 2;
            const x = start.x + r * Math.cos(angle - Math.PI / 2);
            const y = start.y + r * Math.sin(angle - Math.PI / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          if (obj.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
          break;
        }

        case "arrow": {
          const arrowLength = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
          );
          const angle = Math.atan2(end.y - start.y, end.x - start.x);

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);

          const headLength = Math.min(arrowLength / 3, 20);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6),
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6),
          );
          ctx.stroke();
          break;
        }

        case "hexagon": {
          const hexRadius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
          );
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const hexAngle = (i * Math.PI) / 3;
            const x = start.x + hexRadius * Math.cos(hexAngle);
            const y = start.y + hexRadius * Math.sin(hexAngle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          if (obj.filled) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
          break;
        }
      }

      ctx.setLineDash([]);
    },
    [],
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    objects.forEach((obj) => {
      drawShape(ctx, obj);
    });
  }, [objects, drawShape]);

  const drawSelectionUI = useCallback(() => {
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
  }, [selectedObjects, objects, selectionBox]);

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
  }, [
    selectedObjects,
    objects,
    activeLayerId,
    calculateBoundingBox,
    addToHistory,
  ]);

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
  }, [clipboard, objects, calculateBoundingBox, addToHistory]);

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      const coords = getCanvasCoordinates(e);

      if (drawingMode === "select") {
        const clickedObject = findObjectAtPoint(coords);

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
      getCanvasCoordinates,
      drawingMode,
      findObjectAtPoint,
      selectedObjects,
      getResizeHandle,
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
      const coords = getCanvasCoordinates(e);

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
      getCanvasCoordinates,
      drawingMode,
      isResizing,
      isDragging,
      isMultiSelecting,
      dragStart,
      resizeHandle,
      selectedObjects,
      isDrawing,
      calculateBoundingBox,
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
    calculateBoundingBox,
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
    calculateBoundingBox,
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

  const clearCanvas = useCallback(() => {
    setObjects([]);
    setSelectedObjects([]);
    addToHistory([]);
  }, [addToHistory]);

  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: layers.length,
      name: `Layer ${layers.length + 1}`,
      visible: true,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }, [layers.length]);

  const toggleLayerVisibility = useCallback((layerId: number) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  }, []);

  const deleteLayer = useCallback(
    (layerId: number) => {
      if (layers.length <= 1) return;

      setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
      if (activeLayerId === layerId) {
        setActiveLayerId(
          layers[0].id === layerId ? layers[1].id : layers[0].id,
        );
      }
    },
    [layers, activeLayerId],
  );

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

      redrawCanvas();
      drawSelectionUI();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [redrawCanvas, drawSelectionUI]);

  // Redraw when objects change
  useEffect(() => {
    redrawCanvas();
  }, [objects, redrawCanvas]);

  // Update selection UI when selection changes
  useEffect(() => {
    drawSelectionUI();
  }, [selectedObjects, selectionBox, drawSelectionUI]);

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
    drawShape,
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
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Main Toolbar */}
      <Card className="m-4 p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          {/* Drawing Tools */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tools:</span>
            <div className="flex gap-1">
              <Button
                variant={drawingMode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("select")}
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "freehand" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("freehand")}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("rectangle")}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("circle")}
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "triangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("triangle")}
              >
                <Triangle className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("line")}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "star" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("star")}
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "arrow" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("arrow")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "hexagon" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("hexagon")}
              >
                <Hexagon className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("text")}
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant={drawingMode === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("eraser")}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Group Controls */}
          {selectedObjects.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={createGroup}
                disabled={selectedObjects.length < 2}
                title="Group (Ctrl+G)"
              >
                <Group className="h-4 w-4 mr-1" />
                Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={ungroup}
                title="Ungroup (Ctrl+U)"
              >
                <Ungroup className="h-4 w-4 mr-1" />
                Ungroup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyObjects}
                title="Copy (Ctrl+C)"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={pasteObjects}
                disabled={clipboard.length === 0}
                title="Paste (Ctrl+V)"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Fill Option */}
          {(drawingMode === "rectangle" ||
            drawingMode === "circle" ||
            drawingMode === "triangle" ||
            drawingMode === "star" ||
            drawingMode === "hexagon") && (
              <div className="flex items-center gap-2">
                <Button
                  variant={filled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilled(!filled)}
                >
                  {filled ? "Filled" : "Outline"}
                </Button>
              </div>
            )}

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Size:</span>
            <div className="w-24">
              <Slider
                value={brushSize}
                onValueChange={setBrushSize}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-500 w-8">{brushSize[0]}</span>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <div className="flex gap-1 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 ${brushColor === color ? "border-gray-800" : "border-gray-300"
                    }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                />
              ))}
            </div>
          </div>

          {/* History Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-1 mx-4 mb-4 gap-4">
        {/* Layer Panel */}
        <Card className="w-64 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Layers
            </h3>
            <Button size="sm" variant="outline" onClick={addLayer}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`flex items-center gap-2 p-2 rounded border ${activeLayerId === layer.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
                  }`}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className="p-1 h-6 w-6"
                >
                  {layer.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>

                <span
                  className="flex-1 text-sm cursor-pointer"
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  {layer.name}
                </span>

                {layers.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLayer(layer.id)}
                    className="p-1 h-6 w-6 text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Selection Info */}
          {selectedObjects.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Selection</h4>
              <p className="text-xs text-gray-600">
                {selectedObjects.length} object(s) selected
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>Ctrl+G: Group</p>
                <p>Ctrl+U: Ungroup</p>
                <p>Ctrl+C: Copy</p>
                <p>Ctrl+V: Paste</p>
                <p>Delete: Remove</p>
              </div>
            </div>
          )}
        </Card>

        {/* Canvas Container */}
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
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Selection Canvas */}
          <canvas
            ref={selectionCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
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
