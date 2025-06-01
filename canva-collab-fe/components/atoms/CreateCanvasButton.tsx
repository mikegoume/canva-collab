"use client";

import React from "react";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { createCanvas } from "@/lib/canvas-services";

import { Button } from "../ui/button";

function CreateCanvasButton() {
  const router = useRouter();

  const handleCreateNewCanvas = async () => {
    // TODO: Create new canvas
    try {
      const canvasId = await createCanvas({
        name: "New Canvas",
        width: parseInt("600"),
        height: parseInt("600"),
        elements: [],
        createdAt: new Date().toISOString(),
      });

      router.push(`/canvas/${canvasId}`);
    } catch (error) {
      //TODO: Handle error
      console.error("Error creating canvas:", error);
    }
  };

  return (
    <Button size="lg" className="mt-4 gap-2" onClick={handleCreateNewCanvas}>
      <PlusCircle className="h-5 w-5" />
      Create New Canvas
    </Button>
  );
}

export default CreateCanvasButton;
