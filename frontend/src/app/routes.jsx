import React from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import AdminPlaceholder from '../pages/AdminPlaceholder.jsx';

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
    path: '/admin/*',
    element: <AdminPlaceholder />,
  },
];
