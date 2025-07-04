"use client";

import type React from "react";
import {
  ArrowRight,
  Check,
  Circle,
  Clipboard,
  Copy,
  Edit3,
  Eraser,
  Group,
  Hexagon,
  Minus,
  MousePointer,
  Redo,
  RotateCcw,
  Square,
  Star,
  Triangle,
  Type,
  Undo,
  Ungroup,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { DrawingMode } from "@/types/canvas";

import { ColorPicker } from "../ui/color-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const shapes = [
  { name: "rectangle", icon: Square, label: "Rectangle" },
  { name: "circle", icon: Circle, label: "Circle" },
  { name: "triangle", icon: Triangle, label: "Triangle" },
  { name: "line", icon: Minus, label: "Line" },
  { name: "star", icon: Star, label: "Star" },
  { name: "arrow", icon: ArrowRight, label: "Arrow" },
  { name: "hexagon", icon: Hexagon, label: "Hexagon" },
];

function CanvasToolbar({
  selectedObjects,
  createGroup,
  ungroup,
  copyObjects,
  pasteObjects,
  undo,
  redo,
  clipboard,
  historyIndex,
  clearCanvas,
  drawingMode,
  setDrawingMode,
  brushSize,
  setBrushSize,
  brushColor,
  setBrushColor,
  setFilled,
  filled,
}: any) {
  const selectedShape =
    shapes.find((shape) => shape.name === drawingMode) ?? shapes[0];
  return (
    <Card className="p-4 m-4 shadow-lg">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Drawing Tools */}
        <div className="flex gap-2 items-center">
          <Button
            variant={drawingMode === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawingMode("select")}
          >
            <MousePointer className="size-4" />
          </Button>
          <Button
            variant={drawingMode === "freehand" ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawingMode("freehand")}
          >
            <Edit3 className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  shapes.findIndex((shape) => shape.name === drawingMode) !== -1
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="flex gap-2 items-center"
              >
                <selectedShape.icon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto" align="start">
              <DropdownMenuGroup>
                {shapes.map(({ name, icon: Icon, label }) => (
                  <DropdownMenuItem
                    key={name}
                    onClick={() => setDrawingMode(name as DrawingMode)}
                  >
                    {selectedShape.name === name ? (
                      <Check className="size-4" />
                    ) : (
                      <div className="size-4" />
                    )}
                    <Icon className="size-4" />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={drawingMode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawingMode("text")}
          >
            <Type className="size-4" />
          </Button>
          <Button
            variant={drawingMode === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawingMode("eraser")}
          >
            <Eraser className="size-4" />
          </Button>
        </div>

        {/* Group Controls */}
        {selectedObjects.length > 0 && (
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={createGroup}
              disabled={selectedObjects.length < 2}
              title="Group (Ctrl+G)"
            >
              <Group className="mr-1 size-4" />
              Group
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={ungroup}
              title="Ungroup (Ctrl+U)"
            >
              <Ungroup className="mr-1 size-4" />
              Ungroup
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyObjects}
              title="Copy (Ctrl+C)"
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pasteObjects}
              disabled={clipboard.length === 0}
              title="Paste (Ctrl+V)"
            >
              <Clipboard className="size-4" />
            </Button>
          </div>
        )}

        {/* Fill Option */}
        {(drawingMode === "rectangle" ||
          drawingMode === "circle" ||
          drawingMode === "triangle" ||
          drawingMode === "star" ||
          drawingMode === "hexagon") && (
          <div className="flex gap-2 items-center">
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
        <div className="flex gap-2 items-center">
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
          <span className="w-8 text-sm text-gray-500">{brushSize[0]}</span>
        </div>

        {/* Color Palette */}
        <ColorPicker value={brushColor} onChange={setBrushColor} />

        {/* History Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="size-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="mr-1 size-4" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CanvasToolbar;
