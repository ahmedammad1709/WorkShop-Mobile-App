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

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const email = await getUserEmail();
        const role = await getUserRole();
        setIsAuthenticated(!!(email && role));
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Listen for auth state changes
  // This can be called from login/logout screens
  const updateAuthState = async () => {
    const email = await getUserEmail();
    const role = await getUserRole();
    setIsAuthenticated(!!(email && role));
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
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

