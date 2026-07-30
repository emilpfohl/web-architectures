import { Link } from 'react-router-dom';

export function Footer({ variant = 'default' }: { variant?: 'default' | 'auth' | 'dark' }) {
  const isDark = variant === 'dark';
  const bgClass = isDark
    ? 'bg-gradient-to-t from-black/40 via-black/20 to-transparent'
    : `bg-gradient-to-t from-background via-background/90 to-transparent ${variant === 'auth' ? 'lg:bg-none' : ''}`;
  const leftLinkClass = isDark ? 'text-white' : 'text-primary';
  const aboutLinkClass = isDark || variant === 'auth' ? 'text-white' : 'text-primary';

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-center justify-between px-4 py-4 sm:px-[30px] sm:py-[30px] ${bgClass}`}
    >
      <div className="pointer-events-auto flex items-center gap-4 sm:gap-5">
        <Link to="/contact" className={`text-xs font-medium transition-opacity hover:opacity-80 sm:text-sm ${leftLinkClass}`}>
          Kontakt
        </Link>
        <Link to="/impressum" className={`text-xs font-medium transition-opacity hover:opacity-80 sm:text-sm ${leftLinkClass}`}>
          Impressum
        </Link>
        <Link to="/datenschutz" className={`text-xs font-medium transition-opacity hover:opacity-80 sm:text-sm ${leftLinkClass}`}>
          Datenschutz
        </Link>
      </div>
      <div className="pointer-events-auto hidden lg:flex">
        <Link to="/about" className={`text-sm font-medium transition-opacity hover:opacity-80 ${aboutLinkClass}`}>
          Über uns
        </Link>
      </div>
    </div>
  );
}
