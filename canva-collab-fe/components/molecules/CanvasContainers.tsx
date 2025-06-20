"use client";

import type React from "react";

import { Input } from "@/components/ui/input";

function CanvasContainers({
  canvasRef,
  startDrawing,
  draw,
  stopDrawing,
  drawingMode,
  selectionCanvasRef,
  previewCanvasRef,
  isTextMode,
  textPosition,
  handleTextSubmit,
  textInputRef,
  textValue,
  setTextValue,
  setIsTextMode,
  setTextPosition,
}: any) {
  return (
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
  );
}

export default CanvasContainers;