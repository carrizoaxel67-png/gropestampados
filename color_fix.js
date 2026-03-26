const fs = require('fs');
const files = [
  'c:/Users/carri/Desktop/LABURO/gropsublimados.uy/assets/css/styles.css',
  'c:/Users/carri/Desktop/LABURO/gropsublimados.uy/assets/js/admin.js',
  'c:/Users/carri/Desktop/LABURO/gropsublimados.uy/index.html',
  'c:/Users/carri/Desktop/LABURO/gropsublimados.uy/admin.html',
  'c:/Users/carri/Desktop/LABURO/gropsublimados.uy/assets/js/public.js'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let raw = fs.readFileSync(f, 'utf8');
    raw = raw.replace(/#9[dD][fF][fF]00/g, '#BFFF00');
    raw = raw.replace(/#9000[fF][fF]/g, '#8A2BE2');
    raw = raw.replace(/#A633FF/gi, '#FF00FF'); 
    raw = raw.replace(/rgba\(4,155,122,/g, 'rgba(191,255,0,');
    raw = raw.replace(/rgba\(4,\s*155,\s*122,/g, 'rgba(191, 255, 0,');
    raw = raw.replace(/rgba\(157,\s*255,\s*0,/g, 'rgba(191, 255, 0,');
    raw = raw.replace(/rgba\(157,255,0,/g, 'rgba(191,255,0,');
    raw = raw.replace(/rgba\(144,\s*0,\s*255,/g, 'rgba(138, 43, 226,');
    fs.writeFileSync(f, raw);
  }
});
console.log('Done mapping colors!');
