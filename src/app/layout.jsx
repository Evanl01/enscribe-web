import React from 'react';
import Header from '@/src/components/Header';
// import Footer from '../components/Footer';
import '@/public/styles/globals.css';

export const metadata = {
  title: 'Medical PDF Autofiller',
  description: 'Automated medical documentation workflow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%' 
      }}>
        <Header />
        <main style={{ 
          flexGrow: 1, 
          width: '100%',
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>
        {/* <Footer /> */}
      </body>
    </html>
  );
}