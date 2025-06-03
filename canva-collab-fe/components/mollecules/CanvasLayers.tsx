/* eslint-disable prettier/prettier */
"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { Eye, EyeOff, Layers, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Layer } from "@/types/canvas";

const initialLayer: Layer = {
  id: 0,
  name: "Layer 1",
  visible: true,
};

function CanvasLayers({
  setActiveLayerId,
  activeLayerId,
  selectedObjects,
}: any) {
  const [layers, setLayers] = useState([initialLayer]);

  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: layers.length,
      name: `Layer ${layers.length + 1}`,
      visible: true,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }, [layers.length, setActiveLayerId]);

  const toggleLayerVisibility = useCallback((layerId: number) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const deleteLayer = useCallback(
    (layerId: number) => {
      if (layers.length <= 1) return;

      setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
      if (activeLayerId === layerId) {
        setActiveLayerId(
          layers[0].id === layerId ? layers[1].id : layers[0].id
        );
      }
    },
    [layers, activeLayerId, setActiveLayerId]
  );

  return (
    <Card className="w-64 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Layers
        </h3>
        <Button size="sm" variant="outline" onClick={addLayer}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 p-2 rounded border ${
              activeLayerId === layer.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleLayerVisibility(layer.id)}
              className="p-1 h-6 w-6"
            >
              {layer.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </Button>

            <span
              className="flex-1 text-sm cursor-pointer"
              onClick={() => setActiveLayerId(layer.id)}
            >
              {layer.name}
            </span>

            {layers.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteLayer(layer.id)}
                className="p-1 h-6 w-6 text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Selection Info */}
      {selectedObjects.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Selection</h4>
          <p className="text-xs text-gray-600">
            {selectedObjects.length} object(s) selected
          </p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Ctrl+G: Group</p>
            <p>Ctrl+U: Ungroup</p>
            <p>Ctrl+C: Copy</p>
            <p>Ctrl+V: Paste</p>
            <p>Delete: Remove</p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default CanvasLayers;
