"use client";

import type React from "react";
import { RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

import { ColorPicker } from "../ui/color-picker";

interface ICanvasToolbar2Props {
  clearCanvas: () => void;
  brushSize: number[];
  setBrushSize: (value: number[]) => void;
  brushColor: string;
  setBrushColor: (value: string) => void;
  handleSaveCanvas: () => Promise<void>
}

function CanvasToolbar2({
  brushColor,
  brushSize,
  clearCanvas,
  setBrushColor,
  setBrushSize,
  handleSaveCanvas,
}: ICanvasToolbar2Props) {
  return (
    <Card className="m-4 p-4 shadow-lg flex flex-row justify-center">
      <div className="flex flex-row flex-wrap items-center gap-4">
        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Size:</span>
          <div className="w-24">
            <Slider
              value={brushSize}
              onValueChange={(value) => setBrushSize(value)}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
          <span className="text-sm text-gray-500 w-8">{brushSize[0]}</span>
        </div>
        {/* Color Palette */}
        <ColorPicker value={brushColor} onChange={setBrushColor} />
        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveCanvas}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CanvasToolbar2;
