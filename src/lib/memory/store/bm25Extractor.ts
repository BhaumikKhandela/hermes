import { LLM } from "@/lib/llm/LLM";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createAgent, HumanMessage } from "langchain";

export async function extractRelevantDocument(query: string, doc: string) {
  const llm = LLM.getInstance("cerebras");
  const agent = createAgent({
    model: llm,
    systemPrompt: `You are a relevance filter for a Retrieval-Augmented Generation (RAG) system.
        
        Task: 
        Select ONLY the parts of the context that are directly useful for answering the user's question.
        
        Strict rules:
        - Extract text EXACTLY as it appears in the context (verbatim).
        - DO NOT paraphrase, summarize, explain, or edit.
        - DO NOT include mathematical formulas, probabilistic models, or system-level retrieval theory
        UNLESS the question explicitly asks for them.
        - The extracted text MUST clearly and explicitly help answer the question.
        - If a passage is only loosely related or requires interpretation, EXCLUDE it.
        - If NO part of the context is directly relevant, return exactly: " "`,
  });

  const agentOutput = await agent.invoke({
    messages: [
      new HumanMessage(`
        User Question:
        <user_question>
        ${query}
        </user_question>
        
        Retrieved Data:
        <retrieved_data>
        ${doc}
        </retrieved_data>
        
        Output: 
        - Return ONLY the extracted context text.
        - If multiple parts are relevant, return them in same order as in the context.
        - DO NOT add any extra text before or after the extraction.`),
    ],
  });

  const aiResponse =
    agentOutput.messages[agentOutput.messages.length - 1]?.content;
  return aiResponse;
}

export async function extractRelevantDocumentV1(query: string, doc: string) {
  const llm = LLM.getInstance("gpt4o_mini");
  const agent = createAgent({
    model: llm,
    systemPrompt: `You are a high precision relevance filter for a Retrieval-Augmented Generation (RAG) system.
   Your job is to extract ONLY the most relevant and non-redundant parts of the retrieved data to answer the 
   user's question.
   
   You are given TWO different sources:
   1. Vector database results (semantic search)
   2. Daily log archive results (BM25 / keyword search)
   
  ------------------------------
   TASK
  ------------------------------
  - Analyze BOTH sources together
  - Extract ONLY the parts that directly answer the user's question.
  - Remove ALL duplicate or overlapping information across sources.
  
  ------------------------------
   STRICT RULES
  ------------------------------
  - Extract text EXACTLY as it appears (verbatim)
  - DO NOT paraphrase, summarize, or modify text
  - DO NOT explain anything
  - DO NOT merge or rewrite sentences
  - Each extracted chunk must be directly useful for answering the question

   ------------------------------
   DEDUPLICATION RULES
  ------------------------------
  - If the SAME or VERY SIMILAR information appears in both sources:
   → Keep ONLY one version (prefer the clearer or more complete one)
  - NEVER return duplicated or repeated content
  - IF two passages overlap in meaning:
   → Keep the more informative one and discard the weaker one
   
  -------------------------
  RELEVANCE FILTERING
  -------------------------
  - Include ONLY information that clearly and explicitly answers the question
  - EXCLUDE:
    - Vague or loosely related content
    - Content requiring interpretation
    - Background noise or filter text
    
  -----------------------
  SPECIAL RULES
  -----------------------
  - DO NOT include methamatical formulas or technical theory
    UNLESS explicitly required in the question
    
  --------------------------
  OUTPUT FORMAT IN MARKDOWN
  --------------------------
  - Return ONLY the extracted text fromnatted in Markdown 
  - Use clear Markdown structure:
    - Separate distinct passage with a blank line
    - Preserve original text exactly (no edits, no formatting changes inside the text)
  - If multiple parts are relevant:
    → Preserve their ORIGINAL order (as they appear in the sources)
  
  - DO NOT:
     - Add titles, headings, or labels
     - Mention source names (e.g., DO NOT say "Source 1:" or "Extracted text:")
     - Add conversational filler (e.g., "Here is the extracted text")
  - IF NO part of the context is directly relevant, return exactly: " "`,
  });

  const agentOutput = await agent.invoke({
    messages: [
      new HumanMessage(`
        User Question:
        <user_question>
        ${query}
        </user_question>
        
        Retrieved Data (Combined Vector & BM25 Results):
        <retrieved_data>
        ${doc}
        </retrieved_data>
        
        Output:
        - Return ONLY the final filtered and deduplicated markdown text.
        - Obey all strict rules and deduplication logic from the system prompt.`),
    ],
  });

  // Fallback to " " if the LLM returns empty or null to maintain your system prompt contract
  const lastMessage = agentOutput.messages[agentOutput.messages.length - 1];
  const aiResponse = lastMessage?.content as string;

  return aiResponse?.trim() || " ";
}
