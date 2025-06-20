"use client";

import type React from "react";
import { Dispatch, SetStateAction, useMemo } from "react";

import { DrawingObject } from "@/types/canvas";

interface CanvasLayersProps {
  activeLayerId: number;
  setActiveLayerId: (id: number) => void;
  canvas: DrawingObject;
  setCanvas: Dispatch<SetStateAction<DrawingObject | null>>;
}

function CanvasLayers({
  setActiveLayerId,
  activeLayerId,
  canvas, 
  setCanvas
}: CanvasLayersProps) {

  // Auto-detect layers from canvas children
  const layers = useMemo(() => {
    const layerIds = new Set(canvas.children.map(child => child.layerId));
    
    // Convert to array and sort, ensure at least layer 0 exists
    const sortedLayerIds = Array.from(layerIds).sort((a, b) => a - b);
    if (sortedLayerIds.length === 0) {
      sortedLayerIds.push(0); // Default layer
    }
    
    return sortedLayerIds.map(id => ({
      id,
      name: `Layer ${id + 1}`,
      visible: true,
    }));
  }, [canvas.children]);

  // Function to add a new layer
  const addNewLayer = () => {
    const maxLayerId = Math.max(...layers.map(l => l.id), -1);
    const newLayerId = maxLayerId + 1;
    setActiveLayerId(newLayerId);
  };

  // Function to delete a layer and its objects
  const deleteLayer = (layerId: number) => {
    if (layers.length <= 1) return; // Don't delete the last layer
    
    // Remove all objects from this layer
    setCanvas(prev => {
      if (!prev) return null;
      return {
        ...prev,
        children: prev.children.filter(child => child.layerId !== layerId)
      };
    });
    
    // Switch to another layer if deleting active layer
    if (activeLayerId === layerId) {
      const remainingLayers = layers.filter(l => l.id !== layerId);
      if (remainingLayers.length > 0) {
        setActiveLayerId(remainingLayers[0].id);
      }
    }
  };

  // Get object count for each layer
  const getLayerObjectCount = (layerId: number) => {
    return canvas.children.filter(child => child.layerId === layerId).length;
  };

  return (
    <div className="w-64 p-4 bg-white border border-gray-300 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Layers</h3>
        <button
          onClick={addNewLayer}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Add Layer
        </button>
      </div>
      
      <div className="space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
              activeLayerId === layer.id 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setActiveLayerId(layer.id)}
          >
            <div className="flex-1">
              <div className="text-sm font-medium">{layer.name}</div>
              <div className="text-xs text-gray-500">
                {getLayerObjectCount(layer.id)} objects
              </div>
            </div>
            
            {layers.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(layer.id);
                }}
                className="px-1 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      
      {layers.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          No layers found. Start drawing to create layers.
        </div>
      )}
    </div>
  );
}

export default CanvasLayers;