export const agentTree = [
  {
    node_name: "inputNode",
    referenceTo: [],
    config: {
      label: "Input",
      icon: "",
      ui: {},
    },
    children: [
      {
        node_name: "agent",
        referenceTo: ["inputNode"],
        config: {
          label: "Manager Agent",
        },
        children: [
          {
            node_name: "modelNode",
            referenceTo: ["agent"],
            config: {
              nodeRegistry: "model",
              model: "gpt",
              config: {
                provider: "openai",
                instructions: "",
                description: "",
              },
            },
            children: [],
          },
        ],
      },
    ],
  },
];
