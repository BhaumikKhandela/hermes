import { nodeConfigProps } from "./nodeTypes";

export function agentNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;
  const agentConfigNode = {
    id,
    type: "agent",
    referenceTo: [],
    position,
    data: {
      label: "AI Agent",
      icon: "",
      sub: "Tools Agent",
      instructions: "",
      description: "",
    },
    constraints: {
      nodeHandles: [
        {
          name: "left",
          type: "target",
          LinkTo: [],
        },
        {
          name: "bottom",
          type: "source",
          LinkTo: [
            { nodeName: "tool", handlePosition: "top" },
            { nodeName: "modelNode", handlePosition: "top" },
          ],
        },
      ],
    },
  } as any;

  return agentConfigNode;
}
