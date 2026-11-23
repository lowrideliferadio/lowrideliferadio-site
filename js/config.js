/* Site configuration — the only place with station URLs. */
window.ETB_SITE = {
  prelaunch: false,   // true until the stream server is live; then rebuild with PRELAUNCH=0
  station: 'Lowride Life Radio',
  tagline: 'Underground hip hop internet radio · live 24/7',
  api: 'https://stream.lowrideliferadio.com',              // ET Broadcaster API (now playing, schedule, requests, map)
  streams: {
    mp3: 'https://stream.lowrideliferadio.com/stream',  // MP3 128k (every browser) via Caddy :443
    aac: 'https://stream.lowrideliferadio.com/stream.aac'
  },
  studioOrigin: 'https://studio.lowrideliferadio.com',   // the owner studio may live-preview settings in an iframe
  socials: [ // text links only (no third-party logos)
    {label: 'Instagram', url: '#'}, {label: 'TikTok', url: '#'}, {label: 'YouTube', url: '#'}, {label: 'Facebook', url: '#'}
  ]
};
