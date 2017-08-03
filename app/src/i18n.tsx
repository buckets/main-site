import * as React from 'react'

let TEXTS = {};
let CURRENT_LOCALE = 'en';

export function setTexts(locale:string, texts:object) {
  TEXTS[locale] = texts;
}
export function setLocale(locale:string) {
  CURRENT_LOCALE = locale;
  INSTANCES.forEach(i => {
    i.setState({locale});
  })
}

let INSTANCES:Set<TX> = new Set();

export function tx(text:string) {
  TEXTS[CURRENT_LOCALE]
}

export class TX extends React.Component<any,{
  locale: string;
}> {
  constructor(props) {
    super(props);
    this.state = {
      locale: CURRENT_LOCALE,
    }
  }
  componentWillMount() {
    INSTANCES.add(this);
  }
  componentWillUnmount() {
    INSTANCES.delete(this);
  }
  render() {
    console.log('children', this.props.children);
    let children = React.Children.toArray(this.props.children);
    console.log('children', children);
    for (var i = 0; i < children.length; i++) {
      let elem = children[i];
      if (typeof elem === 'string') {
        console.log('string');
        return <spanelem;
      } else if (!React.isValidElement(elem)) {
        continue;
      }

    }
    return <span>{this.props.children}</span>;
  }
}
