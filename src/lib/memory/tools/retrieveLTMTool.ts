import { tool } from "@langchain/core/tools";
import path from "path";
import { MemoryManager } from "../MemoryManager";
import { queryMultiVector } from "../store/Multi-vector-retriever";
import { bm25Retriever, formatDocumentsAsString } from "../store/BM25Retriever";
import { extractRelevantDocumentV1 } from "../store/bm25Extractor";
import { z } from "zod";
export const retrieveRelevantLTMTool = tool(
  async ({ query }, config) => {
    const projectId = config.configurable?.projectId;
    const userId = config.configurable?.userId;

    const memoryRoot = path.resolve(process.cwd(), "public", "memory");

    const memoryManager = new MemoryManager(memoryRoot, { userId, projectId });

    let relevantLongTermMemory = "";

    const archiveLog = await memoryManager.readArchiveFile();

    const vectorData = await queryMultiVector({ userId: userId, query });
    const docToString = formatDocumentsAsString(vectorData?.retrievedDocs);
    relevantLongTermMemory += `\n\n# <data_retrieved_from_vector_db> \n${docToString}\n\n</data_retrieved_from_vector_db>`;
    if (archiveLog.exist) {
      const bm25Data = await bm25Retriever(archiveLog.data, query);
      relevantLongTermMemory += `\n\n<data_retrieved_from_daily_log_archive>${bm25Data}</data_retrieved_from_daily_log_archive>`;
    }

    const filteredData = await extractRelevantDocumentV1(
      query,
      relevantLongTermMemory,
    );

    const longTermMemory = `# Relevant LTM Layer\n${filteredData || "No relevant long-term memories found."}`;

    return longTermMemory;
  },
  {
    name: "retrieve_relevant_ltm",
    description: `
        Retrieve relevant long-term memory (LTM) entries based on the user query.
        
        This tool searches a vector database of previously stored summaries and returns
        high-level contextual information about the user, such as references, goals,
        past interactions, and important background knowledge.
        
        Use this tool when:
        - The query depends on past conversations or long-term context
        - You need to recall user-specific information (preferences, habits, goals, etc.)
        - The current input is ambiguous and may benefit from historical context
        - Personalization or continuity is required
        
        DO NOT use this tool for:
        - Simple factual questions that do not depend on user history
        - Real-time or short-term conversation context (use short-term memory instead)
        
        Returns:
        - A list of summarized memory entries relevant to query
        `,
    schema: z.object({
      query: z
        .string()
        .describe(
          "This semantic search query used to retrieve relevant long-term memory",
        ),
    }),
  },
);
