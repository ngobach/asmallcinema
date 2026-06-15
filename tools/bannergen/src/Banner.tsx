import React from 'react';

export default function Banner() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '500px',
        backgroundColor: '#000000',
        padding: '30px',
        boxSizing: 'border-box',
        fontFamily: 'Instrument Sans',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          border: '1px solid #1c1c1e',
          borderRadius: '16px',
          padding: '50px 60px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <svg viewBox="0 0 75 65" width="22" height="18" fill="#ffffff" style={{ marginRight: '12px' }}>
              <polygon points="37.5,0 75,65 0,65" />
            </svg>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              asmallcinema
            </span>
          </div>
          <span style={{ fontSize: '14px', color: '#52525b', letterSpacing: '0.05em' }}>
            GITHUB REPOSITORY
          </span>
        </div>

        {/* Center Content */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
          <h1 style={{ fontSize: '72px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.04em', margin: '0 0 16px 0', lineHeight: 1 }}>
            A Small Cinema
          </h1>
          <p style={{ fontSize: '20px', color: '#a1a1aa', maxWidth: '780px', margin: 0, lineHeight: 1.5, fontWeight: 400 }}>
            A high-performance Stremio addon resolving Asian dramas and movies via Playwright-backed stream scraping and automated Wikidata ID mappings.
          </p>
        </div>

        {/* Bottom row badges */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
          <div style={{ border: '1px solid #27272a', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#e4e4e7', backgroundColor: '#09090b', display: 'flex' }}>
            Bun Monorepo
          </div>
          <div style={{ border: '1px solid #27272a', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#e4e4e7', backgroundColor: '#09090b', display: 'flex' }}>
            Playwright Scraper
          </div>
          <div style={{ border: '1px solid #27272a', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#e4e4e7', backgroundColor: '#09090b', display: 'flex' }}>
            H3 Server
          </div>
          <div style={{ border: '1px solid #27272a', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#e4e4e7', backgroundColor: '#09090b', display: 'flex' }}>
            Wikidata Mapping
          </div>
        </div>
      </div>
    </div>
  );
}
