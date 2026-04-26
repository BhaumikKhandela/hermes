import { nodeConfigProps } from "./nodeTypes";


export function modelNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;

  const modelNodeConfig = {
    id,
    type: "modelNode",
    referenceTo: [],
    category: "model",
    position,

    data: {
      label,
      icon,
      model: "",
      apiKey: "",
      nodeRegistry: "model",
      config: {
        provider: "",
      },
    },

    constraints: {
      nodeHandles: [
        {
          name: "top",
          type: "target",
          LinkTo: [],
        },
      ],
    },
  } as any;

  return modelNodeConfig;
}
