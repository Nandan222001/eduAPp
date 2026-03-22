// Old navigation types (deprecated - use Expo Router hooks instead)
export type {
  AuthStackParamList,
  MainStackParamList,
  StudentTabParamList,
  ParentTabParamList,
  RootStackScreenProps,
  AuthStackScreenProps,
  MainStackScreenProps,
  StudentTabScreenProps,
  ParentTabScreenProps,
} from './navigation';

// New Expo Router types
export type { RootStackParamList, StudentTabRoutes, ParentTabRoutes } from './routes';

export * from './student';
export * from './offline';
export * from './parent';
export * from './auth';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}
