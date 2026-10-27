import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { restApi } from "./ReduxApi";
const ui = createSlice({
  name: "ui",
  initialState: { search: "" },
  reducers: {
    setSearch: (s, a: PayloadAction<string>) => {
      s.search = a.payload;
    },
  },
});
export const { setSearch } = ui.actions;
export const store = configureStore({
  reducer: { [restApi.reducerPath]: restApi.reducer, ui: ui.reducer },
  middleware: (g) => g().concat(restApi.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
