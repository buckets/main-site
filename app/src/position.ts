export interface IBounds {
  x: number;
  y: number;
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

export function getBounds(elem):IBounds {
  let dims = dimensions(elem);
  let coords = pageCoords(elem);
  return {
    x:coords.x,
    y:coords.y,
    w:dims.w,
    h:dims.h,
  }
}