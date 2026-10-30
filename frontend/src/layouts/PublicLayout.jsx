import React from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export function PublicLayout({ locale = 'ar', children }) {
  return (
    <div className="public-shell">
      <Header locale={locale} />
      <main id="main-content" className="public-main" tabIndex="-1">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default PublicLayout;
