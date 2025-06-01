"use client";

import { v4 as uuidv4 } from "@/lib/uuid";
import { Canvas } from "@/types/canvas";

const STORAGE_KEY = "canvas-creator-data";

// Helper to get data from localStorage
const getStoredData = (): Record<string, Canvas> => {
  if (typeof window === "undefined") return {};

  const storedData = localStorage.getItem(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : {};
};

// Helper to save data to localStorage
const saveStoredData = (data: Record<string, Canvas>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Get all canvases
export const getAllCanvases = async (): Promise<Canvas[]> => {
  const storedData = getStoredData();
  return Object.values(storedData).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

// Get a specific canvas by ID
export const getCanvas = async (id: string): Promise<Canvas> => {
  const storedData = getStoredData();
  const canvas = storedData[id];

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  return canvas;
};

// Create a new canvas
export const createCanvas = async (canvas: Canvas): Promise<string> => {
  const id = uuidv4();
  const storedData = getStoredData();

  storedData[id] = {
    ...canvas,
    id,
    createdAt: new Date().toISOString(),
  };

  saveStoredData(storedData);
  return id;
};

// Update an existing canvas
export const updateCanvas = async (
  id: string,
  canvas: Canvas,
): Promise<void> => {
  const storedData = getStoredData();

  if (!storedData[id]) {
    throw new Error("Canvas not found");
  }

  storedData[id] = {
    ...canvas,
    id,
    createdAt: new Date().toISOString(), // Update the timestamp
  };

  saveStoredData(storedData);
};

// Delete a canvas
export const deleteCanvas = async (id: string): Promise<void> => {
  const storedData = getStoredData();

  if (!storedData[id]) {
    throw new Error("Canvas not found");
  }

  delete storedData[id];
  saveStoredData(storedData);
};
