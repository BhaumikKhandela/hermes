import { AgentNode } from "./AgentNode";
import { EmbeddingModelNode } from "./EmbeddingModelNode";
import { InputNode } from "./InputNode";
import { ModelNode } from "./ModelNode";
import { SubAgentNode } from "./SubAgentNode";
import { ToolNode } from "./ToolNode";
import { VectorDbNode } from "./VectorDbNode";

export const nodeTypes = {
    agent: AgentNode,
    tool: ToolNode,
    inputNode: InputNode,
    vectordbNode: VectorDbNode,
    embeddingModelNode: EmbeddingModelNode,
    subAgent: SubAgentNode,
    modelNode: ModelNode
}