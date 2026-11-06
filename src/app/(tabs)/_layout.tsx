import React from 'react';
import { Tabs } from 'expo-router';
import { Palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const { isManager, isHR } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.muted,
        tabBarStyle: {
          backgroundColor: Palette.surface,
          borderTopColor: Palette.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      {/* 1. Beranda */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size, focused }: any) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color as string} />
          ),
        }}
      />

      {/* 2. Review Presensi (Manager & Admin HR only) */}
      <Tabs.Screen
        name="manager-attendance"
        options={{
          title: 'Review Presensi',
          href: (isManager || isHR ? '/manager-attendance' : null) as any,
          tabBarIcon: ({ color, size, focused }: any) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={size} color={color as string} />
          ),
        }}
      />

      {/* 3. Izin Tim (Manager only) */}
      <Tabs.Screen
        name="manager-leaves"
        options={{
          title: 'Izin Tim',
          href: (isManager ? '/manager-leaves' : null) as any,
          tabBarIcon: ({ color, size, focused }: any) => (
            <Ionicons name={focused ? 'folder-open' : 'folder-outline'} size={size} color={color as string} />
          ),
        }}
      />

      {/* 4. Izin / Cuti Karyawan */}
      <Tabs.Screen
        name="leaves"
        options={{
          title: 'Izin/Cuti',
          href: (!isHR ? '/leaves' : null) as any,
          tabBarIcon: ({ color, size, focused }: any) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color as string} />
          ),
        }}
      />

      {/* 5. Riwayat Presensi */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color, size, focused }: any) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color as string} />
          ),
        }}
      />

      {/* 6. Profil Saya */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }: any) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
