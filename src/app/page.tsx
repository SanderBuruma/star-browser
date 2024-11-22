import Link from 'next/link';
import StarBrowser from './components/StarBrowser';

export default function Home() {
  return (
    <main>
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Factorio Galaxy Database</h1>
        <Link 
          href="/stats" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          View Statistics
        </Link>
      </div>
      <StarBrowser />
    </main>
  );
} 