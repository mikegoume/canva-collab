"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Square,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { v4 as uuidv4 } from "@/lib/uuid";
import { Canvas, CanvasElement } from "@/types/canvas";

interface CanvasToolbarProps {
  canvas: Canvas;
  onCanvasUpdate: (canvas: Canvas) => void;
}

export default function CanvasToolbar({
  canvas,
  onCanvasUpdate,
}: CanvasToolbarProps) {
  const [textContent, setTextContent] = useState("Text element");
  const [imageUrl, setImageUrl] = useState(
    "https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg",
  );
  const [rectangleColor, setRectangleColor] = useState("#cbd5e1");
  const [isTextOpen, setIsTextOpen] = useState(true);
  const [isShapeOpen, setIsShapeOpen] = useState(true);
  const [isImageOpen, setIsImageOpen] = useState(true);

  const addTextElement = () => {
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "text",
      x: Math.random() * (canvas.width - 200),
      y: Math.random() * (canvas.height - 100),
      width: 200,
      height: 100,
      content: textContent,
    };

    onCanvasUpdate({
      ...canvas,
      elements: [...canvas.elements, newElement],
    });
  };

  const addRectangleElement = () => {
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "rectangle",
      x: Math.random() * (canvas.width - 150),
      y: Math.random() * (canvas.height - 150),
      width: 150,
      height: 150,
      backgroundColor: rectangleColor,
    };

    onCanvasUpdate({
      ...canvas,
      elements: [...canvas.elements, newElement],
    });
  };

  const addImageElement = () => {
    const newElement: CanvasElement = {
      id: uuidv4(),
      type: "image",
      x: Math.random() * (canvas.width - 200),
      y: Math.random() * (canvas.height - 150),
      width: 200,
      height: 150,
      src: imageUrl,
    };

    onCanvasUpdate({
      ...canvas,
      elements: [...canvas.elements, newElement],
    });
  };

  return (
    <div className="w-64 bg-card border-r p-4 overflow-y-auto">
      <h2 className="text-lg font-medium mb-4">Elements</h2>

      <div className="space-y-4">
        <Collapsible open={isTextOpen} onOpenChange={setIsTextOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
            <div className="flex items-center">
              <Type className="mr-2 h-4 w-4" />
              <span>Text</span>
            </div>
            {isTextOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="text-content">Content</Label>
              <Input
                id="text-content"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>
            <Button
              onClick={addTextElement}
              variant="outline"
              className="w-full"
            >
              Add Text
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={isShapeOpen} onOpenChange={setIsShapeOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
            <div className="flex items-center">
              <Square className="mr-2 h-4 w-4" />
              <span>Shape</span>
            </div>
            {isShapeOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rectangle-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  id="rectangle-color"
                  value={rectangleColor}
                  onChange={(e) => setRectangleColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  type="text"
                  value={rectangleColor}
                  onChange={(e) => setRectangleColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              onClick={addRectangleElement}
              variant="outline"
              className="w-full"
            >
              Add Rectangle
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={isImageOpen} onOpenChange={setIsImageOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
            <div className="flex items-center">
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Image</span>
            </div>
            {isImageOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <Button
              onClick={addImageElement}
              variant="outline"
              className="w-full"
            >
              Add Image
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
