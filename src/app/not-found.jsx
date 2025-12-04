import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" style={{ 
        marginTop: '1rem', 
        padding: '0.5rem 1rem', 
        backgroundColor: '#1976d2', 
        color: 'white', 
        textDecoration: 'none', 
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        Go Home
      </Link>
    </div>
  );
}