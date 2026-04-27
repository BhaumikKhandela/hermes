import { configureStore } from "@reduxjs/toolkit";
import projectSlice from "./ProjectSlice";
import chatSlice from "./chatSlice";
import agentBuilderSlice from "./agentBuilderSlice";
export const store = configureStore({
  reducer: {
    project: projectSlice,
    chat: chatSlice,
    builder: agentBuilderSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
