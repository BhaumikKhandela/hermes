import { nodeConfigProps } from "./nodeTypes";


export function inputNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;

  return {
    id,
    type: "inputNode",
    referenceTo: [],
    position,

    data: {
      label,
      icon,
      ui: {},
      actions: [],
    },

    constraints: {
      nodeHandles: [
        {
          name: "right",
          type: "source",
          LinkTo: [
            {
              nodeName: "agent",
              handlePosition: "left",
            },
          ],
        },
        {
          name: "left",
          type: "target",
          LinkTo: [],
        },
      ],
    },
  } as any;
}
