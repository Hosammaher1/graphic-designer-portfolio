import React from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/admin/LoginPage.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import DashboardPage from '../pages/admin/DashboardPage.jsx';
import ProfilePage from '../pages/admin/ProfilePage.jsx';
import ProjectsPage from '../pages/admin/ProjectsPage.jsx';
import ProjectFormPage from '../pages/admin/ProjectFormPage.jsx';
import CategoriesPage from '../pages/admin/CategoriesPage.jsx';

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
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/new',
        element: <ProjectFormPage />,
      },
      {
        path: 'projects/:id/edit',
        element: <ProjectFormPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
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
