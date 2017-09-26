
interface UniqueElementID {
  id?: string;
  tagName?: string;
  classes?: string;
  name?: string;
  attrs?: object;
}

// uniquely identify an element on a page
export function identifyElement(el:HTMLElement):UniqueElementID {

}

// findElement
export function findElement(ident:UniqueElementID):HTMLElement {

}