import { MemoryManager, UserData } from "./MemoryManager";
import { bm25Retriever, formatDocumentsAsString } from "./store/BM25Retriever";
import {
  docEmbeddingMultiVector,
  queryMultiVector,
} from "./store/Multi-vector-retriever";

import { compressSTMTool } from "./tools/STMCompressTools";
import { Document } from "@langchain/core/documents";

export function estimateTokens(text: unknown): number {
  if (typeof text !== "string") {
    return 0;
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  const words = trimmed.split(/\s+/).length;

  return Math.ceil(words * 1.3);
}

export class ContextAssembler {
  private memory: MemoryManager;
  private modelContextLimit: number;
  private userData: UserData;

  constructor(
    memoryManager: MemoryManager,
    modelContextLimit: number,
    userData: UserData,
  ) {
    this.memory = memoryManager;
    this.modelContextLimit = modelContextLimit;
    this.userData = userData;
  }

  async assemble(userQuery: string, options = {}) {
    const systemPrompt = await this.memory.readMemoryFiles(
      `system_prompt-${this.userData.userId}.md`,
    );

    const userProfile = await this.memory.readMemoryFiles(
      `MEMORY-${this.userData.userId}.md`,
    );
    const todayLog = await this.memory.readToday(new Date());

    const fixedLayers = [
      `# System Layer\n${systemPrompt}`,
      `# Profile Layer\n${userProfile}`,
      `# Recent STM Layer\n${todayLog}`,
    ];

    const fixedText = fixedLayers.join("\n\n");

    const finalPrompt = `${fixedText}\n\n# New Input \n${userQuery}`;

    const numberOfTokens = estimateTokens(finalPrompt);

    if (numberOfTokens > this.modelContextLimit) {
      const compressData = await compressSTMTool.invoke({
        message: finalPrompt,
      });

      await this.memory.emptyDailyLogFileContent();
      const now = new Date();

      await this.memory.logToArchive("Assistant", compressData, now);

      const docToEmbed = new Document({
        pageContent: compressData,
        metadata: { title: "user daily log summary" },
      });

      await docEmbeddingMultiVector({
        userId: this.userData.userId,
        allDocs: [docToEmbed],
      });
    }

    return {
      prompt: finalPrompt,
      diagnostics: {
        estimateTokens: numberOfTokens,
      },
    };
  }
}
