// Allow for custom HTML elements (like <foo> and <warning>)
declare namespace JSX {
    interface IntrinsicElements {
        [x:string]: any
    }
}
