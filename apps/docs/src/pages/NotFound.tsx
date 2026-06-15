import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — asmallcinema';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 max-w-md mx-auto">
      {/* Icon Frame */}
      <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-neutral-400">
        <FileQuestion className="w-8 h-8" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
        Page Not Found
      </h1>
      
      {/* Code Badge */}
      <span className="inline-block font-mono text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 mb-6">
        ERROR CODE: 404
      </span>

      {/* Description */}
      <p className="text-neutral-400 text-sm leading-relaxed mb-8">
        The documentation page you are looking for does not exist, has been removed, or has changed address.
      </p>

      {/* Button */}
      <Link
        to="/"
        className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 transition-all font-semibold rounded-lg py-3 px-8 text-center text-sm shadow-lg shadow-white/5"
      >
        Back to Home
      </Link>
    </div>
  );
}
