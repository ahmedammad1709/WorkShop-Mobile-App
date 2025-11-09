import React, { useMemo } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ContractorDashboardScreen from '../screens/contractor/ContractorDashboardScreen';
import TechnicianDashboardScreen from '../screens/technician/TechnicianDashboardScreen';
import SupplierDashboardScreen from '../screens/supplier/SupplierDashboardScreen';
import ConsultantDashboardScreen from '../screens/consultant/ConsultantDashboardScreen';
import LogsScreen from '../screens/shared/LogsScreen';
import ReportsScreen from '../screens/shared/ReportsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';

const Stack = createStackNavigator();

export default function MainNavigator({ userRole }) {
  const initialRoute = useMemo(() => {
    const roleLower = (userRole || '').toLowerCase();
    switch (roleLower) {
      case 'admin':
        return 'AdminDashboard';
      case 'contractor':
        return 'ContractorDashboard';
      case 'technician':
        return 'TechnicianDashboard';
      case 'supplier':
        return 'SupplierDashboard';
      case 'consultant':
        return 'ConsultantDashboard';
      default:
        return 'AdminDashboard';
    }
  }, [userRole]);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f3f4f6' },
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="ContractorDashboard" component={ContractorDashboardScreen} />
      <Stack.Screen name="TechnicianDashboard" component={TechnicianDashboardScreen} />
      <Stack.Screen name="SupplierDashboard" component={SupplierDashboardScreen} />
      <Stack.Screen name="ConsultantDashboard" component={ConsultantDashboardScreen} />
      <Stack.Screen name="Logs" component={LogsScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
    </Stack.Navigator>
  );
}

