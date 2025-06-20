"use client";

import { useCallback, useState } from "react";

import { DrawingObject } from "@/types/canvas";

export function useCanvasHistory(initialCanvas: DrawingObject) {
  const [history, setHistory] = useState<DrawingObject[]>([initialCanvas]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToHistory = (canvas: DrawingObject) => {
    // Remove any future history entries if we're not at the end
    const newHistory = history.slice(0, currentIndex + 1);

    // Don't add if it's identical to the current state
    if (JSON.stringify(newHistory.at(-1)) === JSON.stringify(canvas)) {
      return;
    }

    // Add the new canvas state and update the index
    setHistory([...newHistory, canvas]);
    setCurrentIndex(newHistory.length);
  };

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  return {
    history,
    currentIndex,
    addToHistory,
    undo,
    redo,
  };
}
