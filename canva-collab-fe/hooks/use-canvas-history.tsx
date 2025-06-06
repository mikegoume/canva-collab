"use client";

import { useCallback, useState } from "react";

import { Canvas } from "@/types/canvas";

export function useCanvasHistory(initialCanvas: Canvas) {
  const [history, setHistory] = useState<Canvas[]>([initialCanvas]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // TODO: are useCallbacks here necessary? If there's no performance issue maybe we don't need them - keeping code more readable
  const addToHistory = useCallback(
    (canvas: Canvas) => {
      // Remove any future history entries if we're not at the end
      const newHistory = history.slice(0, currentIndex + 1);

      // Don't add if it's identical to the current state
      if (
        JSON.stringify(newHistory[newHistory.length - 1]) ===
        JSON.stringify(canvas)
      ) {
        return;
      }

      // Add the new canvas state and update the index
      setHistory([...newHistory, canvas]);
      setCurrentIndex(newHistory.length);
    },
    [history, currentIndex],
  );

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
