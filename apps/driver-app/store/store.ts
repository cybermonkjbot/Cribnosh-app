import { configureStore } from '@reduxjs/toolkit';
import { driverApi } from './driverApi';

export const store = configureStore({
  reducer: {
    [driverApi.reducerPath]: driverApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(driverApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

