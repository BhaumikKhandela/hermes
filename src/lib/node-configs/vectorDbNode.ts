import { nodeConfigProps } from "./nodeTypes";

export function vectordbNodeConfig(props: nodeConfigProps) {
  const { id, label, icon, position } = props;

  const vectorNodeConfig = {
    id,
    type: "vectordbNode",
    referenceTo: [],
    position,

    data: {
      label,
      icon,
      ui: {},
      provider: "pinecone",
      indexName: "",
      namespace: "",
      apiKey: "",
    },

    constraints: {
      nodeHandles: [
        {
          name: "left",
          type: "target",
          LinkTo: [
            {
              nodeName: "embeddingModelNode",
              handlePosition: "right",
            },
          ],
        },
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
      ],
    },
  } as any;

  return vectorNodeConfig;
}
