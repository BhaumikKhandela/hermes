import { nodeConfigProps } from "./nodeTypes";

export function agentNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;
  const agentConfigNode = {
    id,
    type: "agent",
    referenceTo: [],
    position,
    data: {
      label,
      icon: icon || "/icons/bot.png",
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
          name: "right",
          type: "source",
          LinkTo: [
            { nodeName: "agent", handlePosition: "left" },
          ],
        },
        {
          name: "bottom",
          type: "source",
          LinkTo: [
            { nodeName: "tool", handlePosition: "top" },
            { nodeName: "modelNode", handlePosition: "top" },
            { nodeName: "subAgent", handlePosition: "top" },
          ],
        },
      ],
    },
  } as any;

  return agentConfigNode;
}
