import { QueryClient } from '@tanstack/react-query';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEMO_MODE ? Infinity : 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: DEMO_MODE ? false : 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: DEMO_MODE ? false : 1,
    },
  },
});

export { DEMO_MODE };
