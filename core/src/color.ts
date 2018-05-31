export const COLORS = {
  'blue': 'rgba(52, 152, 219,1.0)', 
  'darker_blue': 'rgba(41, 128, 185,1.0)', 
  'teal': 'rgba(26, 188, 156,1.0)', 
  'darker_teal': 'rgba(22, 160, 133,1.0)', 
  'green': 'rgba(46, 204, 113,1.0)', 
  'darker_green': 'rgba(39, 174, 96,1.0)', 
  'red': 'rgba(231, 76, 60,1.0)', 
  'darker_red': 'rgba(192, 57, 43,1.0)', 
  'orange': 'rgba(230, 126, 34,1.0)', 
  'darker_orange': 'rgba(211, 84, 0,1.0)', 
  'yellow': 'rgba(241, 196, 15,1.0)', 
  'darker_yellow': 'rgba(243, 156, 18,1.0)', 
  'purple': 'rgba(155, 89, 182,1.0)', 
  'darker_purple': 'rgba(142, 68, 173,1.0)', 
  'darkblue': 'rgba(52, 73, 94,1.0)', 
  'darker_darkblue': 'rgba(44, 62, 80,1.0)', 

  'lightest_grey': 'rgba(236, 240, 241,1.0)',
  'lighter_grey': 'rgba(189, 195, 199,1.0)',
  'grey': 'rgba(149, 165, 166,1.0)',
  'darker_grey': 'rgba(127, 140, 141,1.0)',
  'blackish': 'rgba(37, 35, 35, 1.0)',
}

export const DEFAULT_COLORS = [
  'blue',
  'darker_blue',
  'teal',
  'darker_teal',
  'green',
  'darker_green',
  'red',
  'darker_red',
  'orange',
  'darker_orange',
  'yellow',
  'darker_yellow',
  'purple',
  'darker_purple',
  'darkblue',
  'darker_darkblue',
].map(k => COLORS[k]);

export function opacity(rgba:string, opacity:number) {
  let parts = rgba.split(',');
  if (parts.length === 4) {
    // rgba
    parts[3] = `${opacity})`;
  } else {
    // rgb
    parts[2] = parts[2].trim().substr(0, parts[2].length-1)
    parts.push(`${opacity})`);
  }
  return parts.join(',');
}
