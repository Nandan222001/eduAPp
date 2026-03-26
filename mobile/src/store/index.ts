import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, createMigrate } from 'redux-persist';
import { Platform } from 'react-native';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import dashboardReducer from './slices/dashboardSlice';
import assignmentsReducer from './slices/assignmentsSlice';
import gradesReducer from './slices/gradesSlice';
import parentReducer from './slices/parentSlice';
import offlineReducer from './slices/offlineSlice';
import studentDataReducer from './slices/studentDataSlice';

// Use appropriate storage based on platform
let storage: any;
if (Platform.OS === 'web') {
  // Use localStorage for web
  storage = {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, item: string) => Promise.resolve(localStorage.setItem(key, item)),
    removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
  };
} else {
  // Use AsyncStorage for native platforms
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
}

const migrations = {
  1: (state: any) => {
    if (state?.auth) {
      const { isAuthenticated, user, accessToken, refreshToken } = state.auth;
      if (!isAuthenticated && user && accessToken && refreshToken) {
        console.log('[Migration v1] Fixing isAuthenticated state - user has valid auth data');
        return {
          ...state,
          auth: {
            ...state.auth,
            isAuthenticated: true,
            activeRole: state.auth.activeRole || user?.roleInfo?.slug || null,
            availableRoles: state.auth.availableRoles || (user?.roleInfo?.slug ? [user.roleInfo.slug] : []),
          },
        };
      }
    }
    return state;
  },
  2: (state: any) => {
    if (state?.auth) {
      const { user, accessToken, refreshToken } = state.auth;
      if (user && accessToken && refreshToken) {
        console.log('[Migration v2] Ensuring auth state consistency');
        return {
          ...state,
          auth: {
            ...state.auth,
            isAuthenticated: true,
            activeRole: state.auth.activeRole || user?.roleInfo?.slug || null,
            availableRoles: state.auth.availableRoles || (user?.roleInfo?.slug ? [user.roleInfo.slug] : []),
          },
        };
      }
    }
    return state;
  },
};

const persistConfig = {
  key: 'root',
  version: 2,
  storage,
  whitelist: ['auth', 'profile', 'dashboard', 'assignments', 'grades', 'parent', 'offline', 'studentData'],
  migrate: createMigrate(migrations, { debug: false }),
};

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  dashboard: dashboardReducer,
  assignments: assignmentsReducer,
  grades: gradesReducer,
  parent: parentReducer,
  offline: offlineReducer,
  studentData: studentDataReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH, 
          REHYDRATE, 
          PAUSE, 
          PERSIST, 
          PURGE, 
          REGISTER,
          'auth/login/fulfilled',
          'auth/loadStoredAuth/fulfilled',
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export * from './hooks';
