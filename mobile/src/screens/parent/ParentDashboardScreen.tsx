import React from 'react';
import { ParentDashboard } from '../../components/ParentDashboard';
import { useNavigation } from '@react-navigation/native';

export const ParentDashboardScreen: React.FC = () => {
  const navigation = useNavigation();

  return <ParentDashboard navigation={navigation} />;
};
