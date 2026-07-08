import { MarkerType } from "@xyflow/react";

export const autoConnect = (nodes: any[], connections?: any[]): any[] => {
  const newEdges: any[] = [];

  const norm = (v: any) =>
    typeof v === "string"
      ? v
          .toLowerCase()
          .replace(/handle$/, "")
          .trim()
      : v;

  // 1. Map canonical handle names to your specific UI IDs
  const getUiHandleId = (
    canonicalName: string,
    nodeType: string,
    handleType: "source" | "target",
  ) => {
    const name = norm(canonicalName);

    if (handleType === "source") {
      if (name === "right") return "out";
      if (name === "bottom") return "tools";
      return canonicalName;
    } else {
      // Target Handle Logic
      if (name === "left") return "in";
      if (name === "top") {
        // subAgents use "in" for their top handle, tools/models use "tool_in"
        if (nodeType === "subAgent") return "in";
        if (nodeType === "tool" || nodeType === "modelNode") return "tool_in";
        return "in";
      }
      return canonicalName;
    }
  };

  // 2. Main Logic Loop
  nodes.forEach((sourceNode) => {
    const sourceHandles =
      sourceNode.constraints?.nodeHandles?.filter(
        (h: any) => norm(h.type) === "source",
      ) || [];

    sourceHandles.forEach((sHandleDef: any) => {
      const allowedLinks = sHandleDef.LinkTo || [];

      nodes.forEach((targetNode) => {
        if (sourceNode.id === targetNode.id) return;

        // --- referenceTo Check ---
        // The connection is only considered if the target explicitly allows this source type
        const references = targetNode.referenceTo || [];
        if (!references.includes(sourceNode.type)) return;

        // --- SubAgent edges handled in section 3 below ---
        if (targetNode.type === "subAgent" && targetNode.data?.parentLabel) return;

        const targetHandles =
          targetNode.constraints?.nodeHandles?.filter(
            (h: any) => norm(h.type) === "target",
          ) || [];

        targetHandles.forEach((tHandleDef: any) => {
          // Check if Source handle explicitly allows Target type/handle
          const sourceAcceptsTarget = allowedLinks.some((rule: any) => {
            return (
              norm(rule.nodeName) === norm(targetNode.type) &&
              norm(rule.handlePosition) === norm(tHandleDef.name)
            );
          });

          // Check if Target handle explicitly allows Source type/handle
          const targetLinks = tHandleDef.LinkTo || [];
          const targetAcceptsSource = targetLinks.some((rule: any) => {
            return (
              norm(rule.nodeName) === norm(sourceNode.type) &&
              norm(rule.handlePosition) === norm(sHandleDef.name)
            );
          });

          if (sourceAcceptsTarget || targetAcceptsSource) {
            const sourceHandleUiId = getUiHandleId(
              sHandleDef.name,
              sourceNode.type,
              "source",
            );
            const targetHandleUiId = getUiHandleId(
              tHandleDef.name,
              targetNode.type,
              "target",
            );

            // Check for duplicates
            const exists = newEdges.some(
              (e) =>
                e.source === sourceNode.id &&
                e.target === targetNode.id &&
                e.sourceHandle === sourceHandleUiId,
            );

            if (!exists) {
              const isTool =
                targetNode.type === "tool" || targetNode.category === "tool" || targetNode.type === "modelNode";

              newEdges.push({
                id: `e-${sourceNode.id}-${sourceHandleUiId}-${targetNode.id}-${targetHandleUiId}-${Date.now()}`,
                source: sourceNode.id,
                sourceHandle: sourceHandleUiId,
                target: targetNode.id,
                targetHandle: targetHandleUiId,
                animated: false,
                style: isTool
                  ? { strokeDasharray: "6 6", stroke: "#888" }
                  : undefined,
                meta: {
                  rule: sourceAcceptsTarget
                    ? "Allowed by source LinkTo rule"
                    : "Allowed by target LinkTo rule",
                },
              });
            }
          }
        });
      });
    });
  });

  // 3. SubAgent edges — animated dashed orange for manager→subAgent
  nodes.forEach((targetNode) => {
    const parentLabel = targetNode.data?.parentLabel;
    if (!parentLabel || targetNode.type !== "subAgent") return;

    const sourceNode = nodes.find(
      (n: any) => n.type === "agent" && n.data?.label === parentLabel,
    );
    if (!sourceNode) return;

    const exists = newEdges.some(
      (e: any) =>
        e.source === sourceNode.id && e.target === targetNode.id,
    );
    if (exists) return;

    newEdges.push({
      id: `e-${sourceNode.id}-${targetNode.id}-subagent`,
      source: sourceNode.id,
      sourceHandle: "tools",
      target: targetNode.id,
      targetHandle: "in",
      animated: true,
      style: { strokeDasharray: "6 6", stroke: "#f97316" },
    });
  });

  // 4. Sequential edges from agent_connections — animated blue with arrow markers
  if (connections && connections.length > 0) {
    const labelToId = new Map<string, string>();
    for (const n of nodes) {
      if (n.type === "agent" && n.data?.label) {
        labelToId.set(n.data.label as string, n.id);
      }
    }
    for (const conn of connections) {
      const sourceId = labelToId.get(conn.from);
      const targetId = labelToId.get(conn.to);
      if (!sourceId || !targetId) continue;

      const exists = newEdges.some(
        (e: any) => e.source === sourceId && e.target === targetId,
      );
      if (exists) continue;

      newEdges.push({
        id: `e-${sourceId}-${targetId}-seq`,
        source: sourceId,
        sourceHandle: "out",
        target: targetId,
        targetHandle: "in",
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
      });
    }
  }

  return newEdges;
};
