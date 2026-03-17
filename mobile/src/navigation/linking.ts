import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types/navigation';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'edutrack://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          OTPLogin: 'otp-login',
          OTPVerify: 'otp-verify',
        },
      },
      Main: {
        screens: {
          StudentHome: 'student/home',
          StudentCourses: 'student/courses',
          StudentAssignments: 'student/assignments',
          StudentProfile: 'student/profile',
          ParentHome: 'parent/home',
          ParentChildren: 'parent/children',
          ParentReports: 'parent/reports',
          ParentProfile: 'parent/profile',
        },
      },
    },
  },
};
