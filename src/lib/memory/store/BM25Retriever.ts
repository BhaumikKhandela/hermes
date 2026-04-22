import { LLM } from "@/lib/llm/LLM";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createAgent } from "langchain";
import { extractRelevantDocument } from "./bm25Extractor";

export const formatDocumentsAsString = (documents: Document[]) => {
  return documents.map((doc) => doc?.pageContent).join("\n\n");
};

export async function bm25Retriever(document: string, query: string) {
  const newDoc = new Document({
    pageContent: document,
    metadata: {
      title: "user   :" + "DAILY_LOG_ARCHIVE",
    },
  });
  const docSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });
  const splitDocs = await docSplitter.splitDocuments([newDoc]);

  const retriever = BM25Retriever.fromDocuments([...splitDocs], { k: 4 });

  const data = await retriever.invoke(query);

  const docTostring = formatDocumentsAsString(data);

  const filteredData = await extractRelevantDocument(query, docTostring);

  return filteredData;
}
