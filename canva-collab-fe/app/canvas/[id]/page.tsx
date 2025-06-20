"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import CanvasEditor2 from "@/components/organisms/CanvasEditor2";
import { Button } from "@/components/ui/button";
import { getCanvas } from "@/lib/canvas-services";
import { DrawingObject } from "@/types/canvas";

export default function CanvasPage() {
  const params = useParams();
  const canvasId = params.id as string;

  const [canvas, setCanvas] = useState<DrawingObject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCanvas = async () => {
      try {
        const canvasData = await getCanvas(canvasId);
        setCanvas(canvasData);
      } catch (error) {
        //TODO: Handle error
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (canvasId) {
      loadCanvas();
    }
  }, [canvasId]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center">
        <div className="animate-pulse text-2xl">Loading canvas...</div>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Canvas not found</h2>
          <p className="mt-2">
            The canvas you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Link href="/">
            <Button className="mt-4">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <CanvasEditor2 canvas={canvas} setCanvas={setCanvas} />
        </div>
      </div>
    </div>
  );
}