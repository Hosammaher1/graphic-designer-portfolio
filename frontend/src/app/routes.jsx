import React from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import WorkPage from '../pages/WorkPage.jsx';
import ProjectDetailPage from '../pages/ProjectDetailPage.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
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
    path: '/ar/work',
    element: <WorkPage locale="ar" />,
  },
  {
    path: '/en/work',
    element: <WorkPage locale="en" />,
  },
  {
    path: '/ar/projects',
    element: <Navigate to="/ar/work" replace />,
  },
  {
    path: '/en/projects',
    element: <Navigate to="/en/work" replace />,
  },
  {
    path: '/ar/projects/:slug',
    element: <ProjectDetailPage locale="ar" />,
  },
  {
    path: '/en/projects/:slug',
    element: <ProjectDetailPage locale="en" />,
  },
  {
    path: '/ar/about',
    element: <AboutPage locale="ar" />,
  },
  {
    path: '/en/about',
    element: <AboutPage locale="en" />,
  },
  {
    path: '/ar/contact',
    element: <ContactPage locale="ar" />,
  },
  {
    path: '/en/contact',
    element: <ContactPage locale="en" />,
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
  {
    path: '*',
    element: <Navigate to="/ar/" replace />,
  },
];
