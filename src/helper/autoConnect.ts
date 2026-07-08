import { MarkerType } from "@xyflow/react";

export const autoConnect = (nodes: any[], connections?: any[]): any[] => {
  const newEdges: any[] = [];

  console.log("[autoConnect] START nodes=", nodes.length, "connections=", connections?.length);
  for (const n of nodes) {
    console.log(`[autoConnect] node ${n.id} type=${n.type} label="${n.data?.label}" parentLabel="${n.data?.parentLabel}"`);
  }

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

        // --- Dedicated parent-child matching for tools/models/subAgents ---
        // With dedicated tool nodes, a tool/model/subAgent should only connect
        // to its specific parent (matched by label), not to every agent.
        const isChildType =
          targetNode.type === "tool" ||
          targetNode.type === "modelNode" ||
          targetNode.type === "subAgent";

        if (isChildType) {
          const parentLabel = targetNode.data?.parentLabel;
          if (!parentLabel) {
            console.log(`[autoConnect] SKIP: ${sourceNode.id} -> ${targetNode.id} no parentLabel on target`);
            return;
          }
          if (parentLabel !== sourceNode.data?.label) {
            if (targetNode.type === "modelNode" || targetNode.type === "tool") {
              console.log(`[autoConnect] PARENT_MISMATCH: ${sourceNode.id}("${sourceNode.data?.label}") -> ${targetNode.id}("${targetNode.data?.label}") target parentLabel="${parentLabel}"`);
            }
            return;
          }

          console.log(`[autoConnect] PARENT_MATCH: ${sourceNode.id}(${sourceNode.type} "${sourceNode.data?.label}") -> ${targetNode.id}(${targetNode.type} "${targetNode.data?.label}")`);

          // --- SubAgent edges from type-based matching are skipped — section 3 handles them ---
          if (targetNode.type === "subAgent") {
            console.log(`[autoConnect] SKIP subAgent edge to section 3: ${sourceNode.id} -> ${targetNode.id}`);
            return;
          }
        } else {
          // --- referenceTo Check for non-child node types (e.g. inputNode→agent) ---
          const references = targetNode.referenceTo || [];
          if (!references.includes(sourceNode.type)) return;
        }

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

  // 4. Sequential edges from agent_connections — solid blue with arrow markers
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
        animated: false,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
      });
    }
  }

  console.log(`[autoConnect] DONE. Created ${newEdges.length} edges`);
  for (const e of newEdges) {
    const src = nodes.find((n: any) => n.id === e.source);
    const tgt = nodes.find((n: any) => n.id === e.target);
    console.log(`[autoConnect] edge ${e.id}: ${src?.data?.label || e.source}(${src?.type}) -> ${tgt?.data?.label || e.target}(${tgt?.type}) animated=${e.animated} style=${JSON.stringify(e.style)}`);
  }

  return newEdges;
};
