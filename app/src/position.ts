export interface IBounds {
  x: number;
  y: number;
  viewportx: number;
  viewporty: number;
  w: number;
  h: number;
}

export function pageCoords(elem):{x:number,y:number} {
  let y = elem.offsetTop;
  let x = elem.offsetLeft;
  while (elem.offsetParent) {
    elem = elem.offsetParent;
    y += elem.offsetTop;
    x += elem.offsetLeft;
  }
  return {x,y};
}

export function pageY(elem):number {
  return pageCoords(elem).y;
}

export function pageX(elem):number {
  return pageCoords(elem).x;
}

export function dimensions(elem):{h:number,w:number} {
  return {
    h: elem.offsetHeight,
    w: elem.offsetWidth,
  }
}

function getScrollOffset(elem):{x:number, y:number} {
  let x = 0, y = 0;
  while (elem.parentNode) {
    elem = elem.parentNode;
    x += elem.scrollLeft || 0
    y += elem.scrollTop || 0
  }
  return {x,y}
}

export function getBounds(elem):IBounds {
  const { left, top, width, height } = elem.getBoundingClientRect();
  const scrolloffset = getScrollOffset(elem);
  const x = Number(left) + scrolloffset.x;
  const y = Number(top) + scrolloffset.y;
  return {
    viewportx: Math.floor(left),
    viewporty: Math.floor(top),
    x: Math.floor(x),
    y: Math.floor(y),
    w: Math.ceil(width),
    h: Math.ceil(height),
  }
}