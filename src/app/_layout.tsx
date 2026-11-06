import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
      if (!token || !user) {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, token, user]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Palette.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="attendance/check-in" options={{ headerShown: false }} />
        <Stack.Screen name="attendance/check-out" options={{ headerShown: false }} />
        <Stack.Screen name="attendance/result" options={{ headerShown: false }} />
        <Stack.Screen name="face-registration" options={{ headerShown: false }} />
        <Stack.Screen name="leave/new" options={{ headerShown: false }} />
        <Stack.Screen name="manager/attendance/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="manager/leave/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
