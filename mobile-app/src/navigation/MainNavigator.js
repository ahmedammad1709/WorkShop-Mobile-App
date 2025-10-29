import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { getUserRole } from '../utils/storage';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ContractorDashboardScreen from '../screens/contractor/ContractorDashboardScreen';
import TechnicianDashboardScreen from '../screens/technician/TechnicianDashboardScreen';
import SupplierDashboardScreen from '../screens/supplier/SupplierDashboardScreen';
import ConsultantDashboardScreen from '../screens/consultant/ConsultantDashboardScreen';
import LogsScreen from '../screens/shared/LogsScreen';
import ReportsScreen from '../screens/shared/ReportsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  const [initialRoute, setInitialRoute] = useState('AdminDashboard');

  useEffect(() => {
    // Determine initial route based on user role
    const loadInitialRoute = async () => {
      const role = await getUserRole();
      if (role) {
        const roleLower = role.toLowerCase();
        switch (roleLower) {
          case 'admin':
            setInitialRoute('AdminDashboard');
            break;
          case 'contractor':
            setInitialRoute('ContractorDashboard');
            break;
          case 'technician':
            setInitialRoute('TechnicianDashboard');
            break;
          case 'supplier':
            setInitialRoute('SupplierDashboard');
            break;
          case 'consultant':
            setInitialRoute('ConsultantDashboard');
            break;
          default:
            setInitialRoute('AdminDashboard');
        }
      }
    };
    loadInitialRoute();
  }, []);

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

