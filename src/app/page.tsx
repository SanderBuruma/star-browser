import Link from 'next/link';
import StarBrowser from './components/StarBrowser';

export default function Home() {
  return (
    <main>
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Factorio Galaxy Database</h1>
        <Link 
          href="/stats" 
          className="btn-dark px-4 py-2"
        >
          View Statistics
        </Link>
      </div>
      <StarBrowser />
    </main>
  );
} 