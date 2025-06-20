"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function CanvasList() {
  const queryClient = useQueryClient();

  const {
    data: canvases = [],
    error,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["canvases"],
    queryFn: getAllCanvases,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCanvas(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvases"] });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="h-40 bg-muted"></div>
            </CardContent>
            <CardFooter className="p-4">
              <div className="space-y-2 w-full">
                <div className="w-1/2 h-5 rounded bg-muted"></div>
                <div className="w-1/4 h-4 rounded bg-muted"></div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(error as Error).message}
      </div>
    );
  }

  if (canvases.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">
          You don&apos;t have any canvases yet.
        </p>
        <Link href="/canvas/new">
          <Button>Create Your First Canvas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {canvases.map((canvas) => (
        <Card
          key={canvas.id}
          className="overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <CardContent className="p-0">
            <Link href={`/canvas/${canvas.id}`}>
              <div className="bg-muted h-40 flex items-center justify-center border-b">
                <div className="w-3/4 h-3/4 bg-background relative"></div>
              </div>
            </Link>
          </CardContent>
          <CardFooter className="flex justify-between items-center p-4">
            <div>
              <h3 className="font-medium">{canvas.title}</h3>
              <p className="text-xs text-muted-foreground">
                Updated{" "}
                {formatDistanceToNow(new Date(canvas.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex space-x-1">
              <Link href={`/canvas/${canvas.id}`}>
                <Button variant="ghost" size="icon" className="size-8">
                  <Edit2 className="size-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{canvas.title}
                      &quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(canvas.id as string)}
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