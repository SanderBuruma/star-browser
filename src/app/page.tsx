import Link from 'next/link';
import StarBrowser from './components/StarBrowser';

export default function Home() {
  return (
    <main>
      <nav className="nav-header">
        <h1 className="text-2xl font-bold text-[#FF9F1C]">Factorio Galaxy Database</h1>
        <Link 
          href="/stats" 
          className="btn-dark"
        >
          View Statistics
        </Link>
      </nav>
      <StarBrowser />
    </main>
  );
} 