/* EXAMPLE DATA for ?demo=1 previews (invented songs/shows; clearly labelled on the page). */
window.ETB_DEMO = p => {
  const now = Date.now() / 1000; p = p.split('?')[0];
  return ({
    '/api/nowplaying': {on_air: true, live: false, show: 'Afternoon Cruise', listeners: 921, now: {title: 'Candy Paint Sundays', artist: 'Slow & Low Crew', duration: 214, elapsed: 83}},
    '/api/schedule': {current: {id: 2}, shows: [
      {id: 1, name: 'Overnight Lowride', days: 'mon,tue,wed,thu,fri,sat,sun', start_min: 0, end_min: 360, color: '#3A3F55', host: 'Auto DJ'},
      {id: 2, name: 'Afternoon Cruise', days: 'mon,tue,wed,thu,fri', start_min: 720, end_min: 960, color: '#2F6BFF', host: 'DJ E.T.'},
      {id: 3, name: 'Sunday Classics', days: 'sun', start_min: 600, end_min: 840, color: '#CCA847', host: 'Auto DJ'},
      {id: 4, name: 'Underground Hour', days: 'fri,sat', start_min: 1260, end_min: 1380, color: '#EC50A3', host: 'Guest DJs'}]},
    '/api/history': [['Candy Paint Sundays', 'Slow & Low Crew'], ['Midnight Hop', 'Hydraulic Soul'], ['Station ID', 'Lowride Life Radio'], ['Laid Back Lane', 'Velvet Tone'],
      ['Chrome & Candy', 'Duke Esquire'], ['Hop & Bounce', 'La Reina Azul'], ['Chrome Spokes', 'Westside Velvet']].map((x, i) => ({ts: now - 40 - i * 240, title: x[0], artist: x[1]})),
    '/api/public/map': {listeners: 921, countries: 16, points: [[34, -118, 129, 'Los Angeles'], [29.5, -98.5, 84, 'San Antonio'], [42, -87.5, 71, 'Chicago'], [33.5, -112, 52, 'Phoenix'],
      [30, -95.5, 47, 'Houston'], [35, -106.5, 38, 'Albuquerque'], [20.5, -103.5, 41, 'Guadalajara'], [19.5, -99, 37, 'Mexico City'], [25.5, -100.5, 33, 'Monterrey'],
      [34.5, 135.5, 34, 'Osaka'], [35.5, 139.5, 29, 'Tokyo'], [-23.5, -46.5, 21, 'São Paulo'], [51.5, 0, 15, 'London'], [52.5, 13.5, 9, 'Berlin'], [-34, 151, 13, 'Sydney'],
      [14.5, 121, 12, 'Manila'], [43.5, -79.5, 11, 'Toronto'], [40.5, -74, 19, 'New York']].map(a => ({lat: a[0], lon: a[1], listeners: a[2], label: a[3]}))},
    '/api/public/site': {station: 'Lowride Life Radio', tagline: 'Underground hip hop internet radio · live 24/7', hero_text: '', banner: {enabled: false},
      theme: {scheme: 'candy-purple', accent: '#2f8bff', accent2: '#ff4fa0', bg: '#07050b'}, decks: {enabled: ['nightrider', 'multicd', 'stack', 'touch'], default: 'nightrider'},
      video: {enabled: true, loop: true, shuffle: false}},
    '/api/public/videos': [{id: 1, title: 'Placeholder clip 1 — Sunset cruise', src: 'assets/demo/clip1.mp4', poster: 'assets/demo/clip1.jpg'},
      {id: 2, title: 'Placeholder clip 2 — Car show', src: 'assets/demo/clip2.mp4', poster: 'assets/demo/clip2.jpg'}],
    '/api/requestable': [{id: 1, title: 'Candy Paint Sundays', artist: 'Slow & Low Crew'}, {id: 2, title: 'Midnight Hop', artist: 'Hydraulic Soul'}, {id: 3, title: 'Laid Back Lane', artist: 'Velvet Tone'}]
  })[p] || {};
};
