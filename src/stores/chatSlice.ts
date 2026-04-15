import {
  ChatHistoryReturnType,
  ChatMessage,
  fetchChatHistory,
  IFetchChatHistoryType,
} from "@/lib/client/api/project";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

export const getChatHistory = createAsyncThunk<
  ChatHistoryReturnType,
  IFetchChatHistoryType,
  { rejectValue: string }
>("chat/getHistory", async ({ userId, projectId }, { rejectWithValue }) => {
  try {
    const res = await fetchChatHistory({ userId, projectId });
    return res;
  } catch (error) {
    return rejectWithValue("Failed to load chat history");
  }
});

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
};

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearChat(state) {
      state.messages = [];
    },
    addUserAndAiPlaceholder(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(
        {
          role: "user",
          content: action.payload.content,
          userId: action.payload.userId,
          projectId: action.payload.projectId,
          thinking: "",
        },
        {
          role: "ai",
          content: "",
          thinking: "",
          projectId: action.payload.projectId,
          userId: action.payload.userId,
        },
      );
    },

    appendTOLastAiMessage(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "ai") {
        last.content += action.payload;
      }
    },
    appendToAssistantThinking(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "ai") {
        last.thinking = (last.thinking || "") + action.payload;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
      })
      .addCase(getChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export const {
  appendToAssistantThinking,
  appendTOLastAiMessage,
  addUserAndAiPlaceholder,
} = chatSlice.actions;
export default chatSlice.reducer;
