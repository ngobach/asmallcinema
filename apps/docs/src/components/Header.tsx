export default function Header() {
  return (
    <header className="w-full max-w-4xl flex items-center justify-between border-b border-neutral-900 pt-6 md:pt-8 pb-3 md:pb-4 mb-10">
      <div className="flex items-center gap-3">
        {/* Vercel logo style triangle */}
        <div className="w-6 h-6 flex items-center justify-center">
          <svg viewBox="0 0 75 65" fill="#ffffff" className="w-5 h-5">
            <polygon points="37.5,0 75,65 0,65" />
          </svg>
        </div>
        <span className="font-semibold text-white text-lg tracking-tight">asmallcinema</span>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-500 font-mono text-sm">docs</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="https://github.com/ngobach/asmallcinema" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
          GitHub
        </a>
      </div>
    </header>
  );
}
