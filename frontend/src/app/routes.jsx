import React from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/admin/LoginPage.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import DashboardPage from '../pages/admin/DashboardPage.jsx';
import ProfilePage from '../pages/admin/ProfilePage.jsx';

export const routes = [
  {
    path: '/',
    element: <Navigate to="/ar/" replace />,
  },
  {
    path: '/ar/',
    element: <HomePage locale="ar" />,
  },
  {
    path: '/en/',
    element: <HomePage locale="en" />,
  },
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        path: '',
        element: <DashboardPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: '*',
        element: <DashboardPage />,
      },
    ],
  },
];
