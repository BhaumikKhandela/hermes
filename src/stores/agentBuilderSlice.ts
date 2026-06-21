import { autoConnect } from "@/helper/autoConnect";
import { buildNodesHelper } from "@/helper/buildNodeHelper";
import { agentNodeConfig } from "@/lib/node-configs/agentNode";
import { embeddingModelNodeConfig } from "@/lib/node-configs/embeddingModelNode";
import { inputNodeConfig } from "@/lib/node-configs/inputNode";
import { modelNodeConfig } from "@/lib/node-configs/modelNode";
import { subAgentNodeConfig } from "@/lib/node-configs/subAgentNode";
import { toolNodeConfig } from "@/lib/node-configs/toolNode";
import { vectordbNodeConfig } from "@/lib/node-configs/vectorDbNode";
import { getCenteredRandomPosition } from "@/lib/utils";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";

interface CanvasSliceState {
  nodes: Array<any>;
  edges: Array<any>;
  idCount: number;
  selectedNodeId: string | null;
}

const initialState: CanvasSliceState = {
  nodes: [],
  edges: [],
  idCount: 1,
  selectedNodeId: null,
};

export const agentBuilderSlice = createSlice({
  name: "builder",
  initialState,
  reducers: {
    onNodesChange(state, action: PayloadAction<any>) {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    onEdgesChange(state, action: PayloadAction<any>) {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    // buildNodes(state, action: PayloadAction<Array<any>>) {
    //   const nodeBuilderFunc: any = {
    //     input: inputNodeConfig,
    //     agent: agentNodeConfig,
    //     tool: toolNodeConfig,
    //     embedding: embeddingModelNodeConfig,
    //     vectordb: vectordbNodeConfig,
    //     subAgent: subAgentNodeConfig,
    //     model: modelNodeConfig,
    //   };

    //   const newNodes: any[] = [];

    //   // Track created nodes by a unique
    //   const nodeTracker = new Map<string, any>();

    //   const traverse = (node: any, parentName: string | null) => {
    //     const nodeType = node.node_name || node.nodeName;

    //     let normalizedType = "";
    //     if (nodeType === "inputNode") normalizedType = "input";
    //     else if (nodeType === "agent") normalizedType = "agent";
    //     else if (nodeType === "tool") normalizedType = "tool";
    //     else if (nodeType === "modelNode") normalizedType = "model";
    //     else if (nodeType === "subAgent") normalizedType = "subAgent";

    //     const builder = nodeBuilderFunc[normalizedType];

    //     if (builder) {
    //       // Create a new unique key for the node based on type, label, and icon
    //       const uniqueKey = `${normalizedType}-${node.config?.label || node.config?.name || ""}-${node.config?.icon || ""}`;
    //       let existingNode = nodeTracker.get(uniqueKey);
    //       // If the node already exists, push the new parent to referenceTo
    //       if (existingNode) {
    //         if (parentName && !existingNode.referenceTo.includes(parentName)) {
    //           existingNode.referenceTo.push(parentName);
    //         }
    //       } else {
    //         const id = `n${state.idCount++}`;
    //         const position = getCenteredRandomPosition(120);
    //         let newNode;

    //         if (normalizedType === "tool") {
    //           newNode = builder(
    //             {
    //               id,
    //               label: node.config?.label,
    //               icon: node.config?.icon,
    //               position: node.config.position ?? position,
    //               referenceTo: parentName ? [parentName] : [], // Pass it to commonProps
    //             },
    //             {
    //               name: node.config?.name,
    //               nodeRegistry: node.config?.nodeRegistry,
    //               config: node.config?.config || {},
    //             },
    //           );
    //         } else {
    //           newNode = builder({
    //             id,
    //             label: node.config?.label,
    //             icon: node.config?.icon || "",
    //             position: node.config.position ?? position,
    //             data: node.config || {},
    //             referenceTo: parentName ? [parentName] : [], // Pass it to commonProps
    //           });
    //         }

    //         newNode.referenceTo = parentName ? [parentName] : [];

    //         newNodes.push(newNode);
    //         nodeTracker.set(uniqueKey, newNode);
    //       }
    //     }

    //     if (node.children && Array.isArray(node.children)) {
    //       // Pass the CURRENT nodeType down as the parentName for its children
    //       node.children.forEach((child: any) => traverse(child, nodeType));
    //     }
    //   };

    //   // Start traversal with null as the initial parentName
    //   action.payload.forEach((rootNode: any) => traverse(rootNode, null));

    //   state.nodes = newNodes;
    // },
    buildNodes(state, action: PayloadAction<Array<any>>) {
      const { nodes, nextId } = buildNodesHelper(action.payload, state.idCount);

      state.nodes = nodes;
      state.idCount = nextId;
    },

    applyDBNodes(state, action: PayloadAction<Array<any>>) {
      state.nodes = action.payload;
    },

    handleAutoConnect(state) {
      const generatedEdges = autoConnect(state.nodes);
      state.edges = generatedEdges;
    },

    setSelectedNode(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },

    updateNodeConfig(
      state,
      action: PayloadAction<{ id: string; config: Record<string, any> }>,
    ) {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, config: { ...node.data.config, ...action.payload.config } };
      }
    },

    updateNodeCredential(
      state,
      action: PayloadAction<{ id: string; credentialId: string | null }>,
    ) {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, credentialId: action.payload.credentialId };
      }
    },
  },
});

export const {
  buildNodes,
  applyDBNodes,
  onNodesChange,
  onEdgesChange,
  handleAutoConnect,
  setSelectedNode,
  updateNodeConfig,
  updateNodeCredential,
} = agentBuilderSlice.actions;

export default agentBuilderSlice.reducer;
