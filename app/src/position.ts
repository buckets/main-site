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