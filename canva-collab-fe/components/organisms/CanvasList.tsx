"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { deleteCanvas, getAllCanvases } from "@/lib/canvas-services";
import { DrawingObject } from "@/types/canvas";

export default function CanvasList() {
  const [canvases, setCanvases] = useState<DrawingObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCanvases = async () => {
      try {
        const canvasData = await getAllCanvases();
        setCanvases(canvasData);
      } catch (error) {
        //TODO: Handle error
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCanvases();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteCanvas(id);
      setCanvases(canvases.filter((canvas) => canvas.id !== id));
    } catch (error) {
      //TODO: Handle error
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="bg-muted h-40"></div>
            </CardContent>
            <CardFooter className="p-4">
              <div className="space-y-2 w-full">
                <div className="h-5 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (canvases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          You don&apos;t have any canvases yet.
        </p>
        <Link href="/canvas/new">
          <Button>Create Your First Canvas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {canvases.map((canvas) => (
        <Card
          key={canvas.id}
          className="overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <CardContent className="p-0">
            <Link href={`/canvas/${canvas.id}`}>
              <div className="bg-muted h-40 flex items-center justify-center border-b">
                <div className="w-3/4 h-3/4 bg-background relative">
                  {canvas.elements.slice(0, 3).map((element, idx) => {
                    if (element.type === "rectangle") {
                      return (
                        <div
                          key={idx}
                          className="absolute"
                          style={{
                            left: `${(element.x / canvas.width) * 100}%`,
                            top: `${(element.y / canvas.height) * 100}%`,
                            width: `${(element.width / canvas.width) * 100}%`,
                            height: `${(element.height / canvas.height) * 100}%`,
                            backgroundColor:
                              element.backgroundColor || "#cbd5e1",
                          }}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </Link>
          </CardContent>
          <CardFooter className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-medium">{canvas.name}</h3>
              <p className="text-xs text-muted-foreground">
                Updated{" "}
                {formatDistanceToNow(new Date(canvas.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex space-x-1">
              <Link href={`/canvas/${canvas.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{canvas.name}&quot;?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(canvas.id as string)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
