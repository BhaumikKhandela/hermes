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

export type TodoStatus = "in_progress" | "pending" | "completed";
export type TodoListType = Array<{
  id: string;
  task: string;
  status: TodoStatus;
}>;

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  todos: TodoListType;
};

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
  todos: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearTodos(state) {
      state.todos = [];
    },
    addTodos(state, action: PayloadAction<TodoListType>) {
      state.todos.push(...action.payload);
    },
    updateTodos(
      state,
      action: PayloadAction<{
        updates: { id: string; status: TodoStatus }[];
      }>,
    ) {
      action.payload.updates.forEach((update) => {
        const todo = state.todos.find((t) => t.id === update.id);
        if (todo) {
          todo.status = update.status;
        }
      });
    },
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
  updateTodos,
  clearTodos,
  addTodos,
  appendToAssistantThinking,
  appendTOLastAiMessage,
  addUserAndAiPlaceholder,
} = chatSlice.actions;
export default chatSlice.reducer;
