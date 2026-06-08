import { getAgentTree } from "@/lib/client/api/project";
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

export const fetchAgentTree = createAsyncThunk<
  { agentTree: any },
  { projectId: string },
  { rejectValue: string }
>("agent/fetchAgentTree", async ({ projectId }: { projectId: string }) =>
  getAgentTree(projectId),
);

interface agentTreeState {
  agentTree: any;
  loading: boolean;
  error: string | null;
  modal: boolean;
}

const initialState: agentTreeState = {
  agentTree: {},
  loading: false,
  error: null,
  modal: false,
};

const agentTreeSlice = createSlice({
  name: "agentTreeSlice",
  initialState: {
    ...initialState,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgentTree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAgentTree.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.agentTree = action.payload?.agentTree;
          state.loading = false;
        },
      )
      .addCase(fetchAgentTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch";
      });
  },
});

export const {} = agentTreeSlice.actions;

export default agentTreeSlice.reducer;
