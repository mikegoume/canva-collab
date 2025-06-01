"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CanvasElement } from "@/types/canvas";

interface CanvasItemProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (element: CanvasElement) => void;
  onDelete: (id: string) => void;
}

export default function CanvasItem({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: CanvasItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isSelected) {
      onSelect();
    }

    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    };

    // Add document-level event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startSizeRef.current = { width: element.width, height: element.height };

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = Math.max(0, e.clientX - startPosRef.current.x);
    const newY = Math.max(0, e.clientY - startPosRef.current.y);

    onUpdate({
      ...element,
      x: newX,
      y: newY,
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;

    const newWidth = Math.max(50, startSizeRef.current.width + deltaX);
    const newHeight = Math.max(50, startSizeRef.current.height + deltaY);

    onUpdate({
      ...element,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(element.id);
  };

  const renderElementContent = () => {
    switch (element.type) {
      case "text":
        return (
          <div className="w-full h-full p-2 overflow-hidden">
            {element.content}
          </div>
        );
      case "rectangle":
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: element.backgroundColor || "#cbd5e1",
              borderRadius: element.borderRadius || 0,
            }}
          />
        );
      case "image":
        return (
          <Image
            width={element.width}
            height={element.height}
            src="https://s3.amazonaws.com/my-bucket/profile.png"
            alt={element.alt || "Canvas image"}
            className="w-full h-full object-cover"
          />
        );
      default:
        return <div className="w-full h-full bg-gray-200" />;
    }
  };

  return (
    <div
      ref={itemRef}
      className={cn(
        "absolute flex",
        isSelected && "outline outline-2 outline-primary",
        isDragging && "cursor-grabbing opacity-80",
      )}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        zIndex: isSelected ? 10 : 1,
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        transition:
          isDragging || isResizing ? "none" : "transform 0.1s ease-in-out",
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {renderElementContent()}

      {isSelected && (
        <>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-3 -right-3 h-6 w-6 rounded-full opacity-90 hover:opacity-100"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl-sm cursor-se-resize"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
}
