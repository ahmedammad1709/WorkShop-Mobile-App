import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { getUserEmail, getUserRole } from '../utils/storage';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRoleState] = useState(null);

  useEffect(() => {
    // Force app to start at Auth flow (LoginSelectionScreen) on first load
    // Ignore any persisted session until user logs in explicitly
    setIsAuthenticated(false);
    setUserRoleState(null);
    setIsLoading(false);
  }, []);

  // Listen for auth state changes
  // This can be called from login/logout screens
  const updateAuthState = async () => {
    const email = await getUserEmail();
    const role = await getUserRole();
    setIsAuthenticated(!!(email && role));
    setUserRoleState(role || null);
  };

  // Expose update function globally (can be improved with context)
  if (typeof global !== 'undefined') {
    global.updateAuthState = updateAuthState;
  }

  if (isLoading) {
    // Show loading screen (you can customize this)
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main">
            {() => <MainNavigator userRole={userRole} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

