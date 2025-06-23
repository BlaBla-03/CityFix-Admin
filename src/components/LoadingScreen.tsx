import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div style={container}>
      <div style={content}>
        <div style={spinner}></div>
        <p style={text}>Loading...</p>
      </div>
    </div>
  );
};

const container: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f5f5f5'
};

const content: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem'
};

const spinner: React.CSSProperties = {
  width: '48px',
  height: '48px',
  border: '5px solid rgba(69, 183, 175, 0.3)',
  borderTopColor: '#45B7AF',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const text: React.CSSProperties = {
  fontSize: '1rem',
  color: '#333',
  margin: 0
};

export default LoadingScreen; 