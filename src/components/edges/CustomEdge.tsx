import { useState } from "react";
import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/stores";
import { removeEdge } from "@/stores/agentBuilderSlice";

export function CustomEdge(props: EdgeProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    animated,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <BaseEdge
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
      />

      {isHovered && (
        <foreignObject
          width={22}
          height={22}
          x={labelX - 11}
          y={labelY - 11}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <div style={{ pointerEvents: "auto", display: "flex", justifyContent: "center", alignItems: "center", width: 22, height: 22 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeEdge(id));
              }}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "none",
                background: "#ef4444",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
