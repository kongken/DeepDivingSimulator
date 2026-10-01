import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/components/layout/AppLayout'
import { RouteFallback } from '@/components/layout/RouteFallback'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    HydrateFallback: RouteFallback,
    children: [
      { index: true, Component: HomePage },
      {
        path: 'planner',
        lazy: async () => ({ Component: (await import('@/pages/PlannerPage')).default }),
      },
      {
        path: 'dive',
        lazy: async () => ({ Component: (await import('@/pages/DivePage')).default }),
      },
      {
        path: 'physics',
        lazy: async () => ({ Component: (await import('@/pages/PhysicsPage')).default }),
      },
      {
        path: 'log',
        lazy: async () => ({ Component: (await import('@/pages/DiveLogPage')).default }),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
