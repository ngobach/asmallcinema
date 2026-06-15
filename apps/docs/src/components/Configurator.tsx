import { useState, useEffect } from 'react';
import { Link, Check, Copy, Plus } from 'lucide-react';

export default function Configurator() {
  const [addonHost, setAddonHost] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const defaultHost = (import.meta.env.VITE_ADDON_HOST as string) || `${window.location.protocol}//${window.location.hostname}:3005`;
    setAddonHost(defaultHost);
  }, []);

  const manifestUrl = `${addonHost.replace(/\/+$/, '')}/manifest.json`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-full bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 md:p-8 text-left transition-all duration-300 hover:border-neutral-800 max-w-2xl shadow-2xl shadow-black mb-12">
      <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Link className="w-5 h-5 text-neutral-400" /> Connect Addon
      </h2>
      <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
        The unique Manifest URL used by Stremio to discover and load your customized addon.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <span className="block text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Your Stremio Manifest URL
          </span>
          <div className="flex items-center gap-2 bg-black border border-neutral-900 rounded-lg p-3 font-mono text-sm relative overflow-hidden mb-4">
            <span className="text-neutral-400 select-all truncate flex-1 pr-10">
              {manifestUrl}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(manifestUrl)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-900 rounded-md transition-colors text-neutral-400 hover:text-white flex items-center justify-center"
              title="Copy Link"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Install and Copy Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <a
              href={manifestUrl.replace(/^https?:\/\//, 'stremio://')}
              className="flex-1 bg-white text-black hover:bg-neutral-200 transition-all font-semibold rounded-lg py-3 px-6 text-center text-sm flex items-center justify-center gap-2 shadow-lg shadow-white/5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Install Addon
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(manifestUrl)}
              className="flex-1 bg-black border border-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700 transition-all font-semibold rounded-lg py-3 px-6 text-center text-sm flex items-center justify-center gap-2"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Copied Link
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Manifest Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
