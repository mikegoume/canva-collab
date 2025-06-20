"use client";

import React from "react";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { createCanvas } from "@/lib/canvas-services";
import { DrawingObject } from "@/types/canvas";

import { Button } from "../ui/button";

function CreateCanvasButton() {
  const router = useRouter();

  const handleCreateNewCanvas = async () => {
    // TODO: Create new canvas
    try {
      const newDrawingObject: Omit<DrawingObject, "id"> = {
        title: "Freehand Canvas",
        type: "draw",
        mode: "freehand",
        points: [],
        color: "#000000",
        size: 5,
        filled: false,
        text: undefined,
        layerId: 0,
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        children: [],
        groupId: undefined,
        createdAt: new Date().toISOString(),
      };
      const canvasId = await createCanvas(newDrawingObject);
      router.push(`/canvas/${canvasId}`);
    } catch (error) {
      //TODO: Handle error
      console.error("Error creating canvas:", error);
    }
  };

  return (
    <Button size="lg" className="gap-2 mt-4" onClick={handleCreateNewCanvas}>
      <PlusCircle className="size-5" />
      Create New Canvas
    </Button>
  );
}

export default CreateCanvasButton;
