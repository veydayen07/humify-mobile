import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

export function useColorScheme() {
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const colorScheme = useRNColorScheme();

  if (isHydrated) {
    return colorScheme;
  }

  return 'light';
}
