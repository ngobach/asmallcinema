export default function InstallGuide() {
  return (
    <section className="w-full max-w-4xl border-t border-neutral-900 pt-10">
      <h2 className="text-3xl font-bold text-white tracking-tight mb-8 text-center md:text-left">
        How to Install the Addon
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 flex flex-col hover:border-neutral-800 transition-all">
          <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-mono font-bold text-sm mb-6">
            1
          </span>
          <h3 className="text-white font-semibold text-lg mb-2">Copy Manifest URL</h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4 flex-1">
            Copy the manifest URL generated in the Connect Addon section above.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 flex flex-col hover:border-neutral-800 transition-all">
          <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-mono font-bold text-sm mb-6">
            2
          </span>
          <h3 className="text-white font-semibold text-lg mb-2">Paste into Stremio</h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4 flex-1">
            Open your Stremio client, navigate to the <b>Addons</b> page via the left navigation, and paste your URL into the search box.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 flex flex-col hover:border-neutral-800 transition-all">
          <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-mono font-bold text-sm mb-6">
            3
          </span>
          <h3 className="text-white font-semibold text-lg mb-2">Install & Play</h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4 flex-1">
            Click the <b>Install</b> button when prompted. The Viki scraping streams will now populate under your show/movie selections.
          </p>
        </div>
      </div>
    </section>
  );
}
