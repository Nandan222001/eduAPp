// Expo Router typed routes
export type RootStackParamList = {
  '/(auth)/login': undefined;
  '/(auth)/register': undefined;
  '/(auth)/forgot-password': undefined;
  '/(auth)/reset-password': { token: string };
  '/(tabs)/student': undefined;
  '/(tabs)/parent': undefined;
  '/profile': undefined;
  '/settings': undefined;
  '/notifications': undefined;
  '/notifications/[id]': { id: string };
  '/courses/[id]': { id: string };
  '/assignments/[id]': { id: string };
  '/children/[id]': { id: string };
  '/messages/[id]': { id: string };
};

export type StudentTabRoutes = {
  index: undefined;
  assignments: undefined;
  schedule: undefined;
  grades: undefined;
  profile: undefined;
};

export type ParentTabRoutes = {
  index: undefined;
  children: undefined;
  communication: undefined;
  reports: undefined;
  profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
