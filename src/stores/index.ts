import { configureStore } from "@reduxjs/toolkit";
import projectSlice from "./ProjectSlice";
import chatSlice from "./chatSlice";
export const store = configureStore({
  reducer: {
    project: projectSlice,
    chat: chatSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
