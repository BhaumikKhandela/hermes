import { nodeConfigProps } from "./nodeTypes";

export function toolNodeConfig(props: nodeConfigProps, configProps: any) {
  const { id, label, icon, position } = props;
  const { name, nodeRegistry } = configProps;

  const toolNodeConfig = {
    id,
    type: "tool",
    referenceTo: [],
    category: "tool",
    position,

    data: {
      label,
      icon,
      nodeRegistry,
      name,

      config: {
        provider: "",
        description: "",
      },
    },

    constraints: {
      nodeHandles: [
        {
          // tool receives from agent
          name: "top",
          type: "target",
          LinkTo: [
            {
              nodeName: "agent",
              handlePosition: "bottom",
            },
            {
              nodeName: "subAgent",
              handlePosition: "bottom",
            },
          ],
        },
        {
          // tool sends back to agent
          name: "bottom",
          type: "source",
          LinkTo: [
            {
              nodeName: "agent",
              handlePosition: "top",
            },
            {
              nodeName: "subAgent",
              handlePosition: "top",
            },
          ],
        },
        {
          // sequential input from previous node
          name: "left",
          type: "target",
          LinkTo: [
            { nodeName: "triggerNode", handlePosition: "right" },
            { nodeName: "agent", handlePosition: "right" },
            { nodeName: "subAgent", handlePosition: "right" },
            { nodeName: "tool", handlePosition: "right" },
            { nodeName: "modelNode", handlePosition: "right" },
          ],
        },
        {
          // sequential output to next node
          name: "right",
          type: "source",
          LinkTo: [
            { nodeName: "agent", handlePosition: "left" },
            { nodeName: "subAgent", handlePosition: "left" },
            { nodeName: "tool", handlePosition: "left" },
            { nodeName: "modelNode", handlePosition: "left" },
          ],
        },
      ],
    },
  } as any;

  return toolNodeConfig;
}
