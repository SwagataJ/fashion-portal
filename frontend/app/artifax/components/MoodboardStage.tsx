"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Rect } from "react-konva";
import useImage from "use-image";
import { CanvasItem } from "@/store/artifaxStore";

// ─── Single image node ────────────────────────────────────────────────────────
function CanvasImageNode({
  item,
  isSelected,
  onSelect,
  onChange,
}: {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (item: CanvasItem) => void;
}) {
  const [image] = useImage(item.url!, "anonymous");
  const imgRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && imgRef.current) {
      trRef.current.nodes([imgRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={imgRef}
        image={image}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation || 0}
        draggable
        onClick={() => onSelect(item.id)}
        onTap={() => onSelect(item.id)}
        onDragEnd={(e) =>
          onChange({ ...item, x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={(e) => {
          const node = imgRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...item,
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * scaleX),
            height: Math.max(50, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
        shadowColor="rgba(0,0,0,0.5)"
        shadowBlur={isSelected ? 20 : 8}
        shadowOpacity={isSelected ? 0.8 : 0.4}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 50 || newBox.height < 50 ? oldBox : newBox
          }
          borderStroke="#7c3aed"
          borderStrokeWidth={1.5}
          anchorStroke="#7c3aed"
          anchorFill="#111118"
          anchorSize={8}
        />
      )}
    </>
  );
}

// ─── Single text node ─────────────────────────────────────────────────────────
function CanvasTextNode({
  item,
  isSelected,
  onSelect,
  onChange,
}: {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (item: CanvasItem) => void;
}) {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaText
        ref={textRef}
        x={item.x}
        y={item.y}
        text={item.text || "Click to edit"}
        fontSize={item.fontSize || 22}
        fill={item.fill || "#ffffff"}
        fontFamily="Inter, sans-serif"
        rotation={item.rotation || 0}
        draggable
        onClick={() => onSelect(item.id)}
        onTap={() => onSelect(item.id)}
        onDragEnd={(e) =>
          onChange({ ...item, x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={(e) => {
          const node = textRef.current!;
          node.scaleX(1);
          node.scaleY(1);
          onChange({ ...item, x: node.x(), y: node.y(), rotation: node.rotation() });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={["middle-left", "middle-right"]}
          rotateEnabled
          borderStroke="#ec4899"
          borderStrokeWidth={1.5}
          anchorStroke="#ec4899"
          anchorFill="#111118"
          anchorSize={8}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 60 ? oldBox : newBox
          }
        />
      )}
    </>
  );
}

// ─── Stage component ──────────────────────────────────────────────────────────
interface MoodboardStageProps {
  items: CanvasItem[];
  onItemsChange: (items: CanvasItem[]) => void;
  width: number;
  height: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function MoodboardStage({
  items,
  onItemsChange,
  width,
  height,
  selectedId,
  onSelect,
}: MoodboardStageProps) {
  return (
    <Stage
      width={width}
      height={height}
      style={{ cursor: selectedId ? "move" : "default" }}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      {/* Dot grid background rect */}
      <Layer listening={false}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
        />
      </Layer>

      <Layer>
        {items.map((item) => {
          if (item.type === "image") {
            return (
              <CanvasImageNode
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={onSelect}
                onChange={(newItem) =>
                  onItemsChange(items.map((i) => (i.id === newItem.id ? newItem : i)))
                }
              />
            );
          }
          if (item.type === "text") {
            return (
              <CanvasTextNode
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={onSelect}
                onChange={(newItem) =>
                  onItemsChange(items.map((i) => (i.id === newItem.id ? newItem : i)))
                }
              />
            );
          }
          return null;
        })}
      </Layer>
    </Stage>
  );
}
