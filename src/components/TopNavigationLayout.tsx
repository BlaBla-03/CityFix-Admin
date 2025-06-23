import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const TopNavigationLayout: React.FC = () => {
  return (
    <div style={container}>
      <Navbar />
      <main style={mainContent}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const container: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
};

const mainContent: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem 2rem',
  marginTop: '8px',
};

export default TopNavigationLayout; 