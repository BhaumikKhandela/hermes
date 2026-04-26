import { nodeConfigProps } from "./nodeTypes";

export function embeddingModelNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;

  const embeddingModelNodeConfig = {
    id,
    type: "embeddingModelNode",
    referenceTo: [],
    position,

    data: {
      label,
      icon,
      ui: {},
      provider: "openai",
      apiKey: "",
      modelName: "text-embedding-3-small",
      endpoint: "",
    },

    constraints: {
      nodeHandles: [
        {
          name: "left",
          type: "target",
          LinkTo: [
            {
              nodeName: "inputNode",
              handlePosition: "right",
            },
          ],
        },
        {
          name: "right",
          type: "source",
          LinkTo: [
            {
              nodeName: "vectordbNode",
              handlePosition: "left",
            },
          ],
        },
      ],
    },
  } as any;

  return embeddingModelNodeConfig;
}