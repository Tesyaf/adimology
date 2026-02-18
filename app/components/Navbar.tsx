'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TokenStatusIndicator from './TokenStatusIndicator';
import JobStatusIndicator from './JobStatusIndicator';
import ThemeToggle from './ThemeToggle';
import { Github } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="navbar-logo-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center' }}>
            <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="49" y="10" width="2" height="80" fill="currentColor" />
              <rect x="44" y="32" width="12" height="38" fill="currentColor" />
              <path d="M22 30C40 18 60 22 80 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M22 30C18 30 16 38 22 42C24 44 28 42 28 38" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
              <line stroke="currentColor" strokeWidth="1.5" x1="22" x2="44" y1="30" y2="70" />
              <line stroke="currentColor" strokeWidth="1.5" x1="80" x2="56" y1="32" y2="70" />
            </svg>
          </div>
          <div className="navbar-content">
            <h1 className="navbar-title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>Adimology Calculator</h1>
            <p className="navbar-subtitle" style={{ fontSize: '0.75rem' }}>Analyze stock targets based on broker summary</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="nav-links" style={{ display: 'flex', gap: '1.5rem' }}>
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Calculator
            </Link>
            <Link
              href="/history"
              style={{
                textDecoration: 'none',
                color: pathname === '/history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/history' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              History
            </Link>
            <Link
              href="/summary"
              style={{
                textDecoration: 'none',
                color: pathname === '/summary' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/summary' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/summary' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Summary
            </Link>
            <Link
              href="/ranking"
              style={{
                textDecoration: 'none',
                color: pathname === '/ranking' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/ranking' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/ranking' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Ranking
            </Link>
            <a
              href="https://github.com/bhaktiutama/adimology"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
                transition: 'color 0.2s',
                paddingBottom: '2px', // Consistency with nav-links
              }}
              className="github-link"
              title="View on GitHub"
            >
              <Github size={20} />
            </a>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <JobStatusIndicator />
            <TokenStatusIndicator />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
