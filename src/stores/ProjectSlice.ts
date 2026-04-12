import {
  getProjects,
  PaginationType,
  ProjectServerData,
} from "@/lib/client/api/project";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export const fetchProjects = createAsyncThunk(
  "project/fetchProjects",
  async ({ page = 1, search = "" }: { page: number; search: string }) =>
    getProjects(page, search),
);

interface ProjectState extends ProjectServerData {
  loading: boolean;
  error: string | null;
  modal: boolean;
}

const initialState: ProjectState = {
  projects: { projects: [], pagination: {} as PaginationType },
  loading: false,
  error: null,
  modal: false,
};

const projectSlice = createSlice({
  name: "projectSlice",
  initialState: {
    ...initialState,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProjects.fulfilled,
        (state, action: PayloadAction<ProjectServerData>) => {
          state.projects = action.payload?.projects;
          state.projects.pagination = action.payload?.projects?.pagination;
          state.loading = false;
        },
      )
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch projects";
      });
  },
});

export const {} = projectSlice.actions;
export default projectSlice.reducer;