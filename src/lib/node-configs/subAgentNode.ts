import { nodeConfigProps } from "./nodeTypes";

export function subAgentNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;

  const agentConfigNode = {
    id,
    type: "subAgent",
    referenceTo: [],
    position,

    data: {
      label: "Sub Agent",
      icon: "",
      sub: "worker Agent",
      instructions: "",
      description: "",
      model: "",
    },

    constraints: {
      nodeHandles: [
        {
          name: "top",
          type: "target",
          LinkTo: [
            {
              nodeName: "agent",
              handlePosition: "bottom",
            },
          ],
        },
        {
          name: "bottom",
          type: "source",
          LinkTo: [
            {
              nodeName: "tool",
              handlePosition: "top",
            },
            {
              nodeName: "modelNode",
              handlePosition: "top",
            },
            {
              nodeName: "subAgent",
              handlePosition: "top",
            },
          ],
        },
      ],
    },
  } as any;

  return agentConfigNode;
}
