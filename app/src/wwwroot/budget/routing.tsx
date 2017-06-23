import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as _ from 'lodash';
import * as Path from 'path';

interface IMatch {
  matched_string: string;
  params: object;
  rest: string;
  exact: boolean;
}
interface IMatcher {
  (input:string):IMatch;
}
interface IVarType {
  processor: (x:string)=>any;
  pattern: string;
}
const RE_PARAM = /(<.+?:.+?>)/g;
export class MatcherMaster {
  private types:{
    [key:string]: IVarType;
  } = {
    'int': {
      processor: parseInt,
      pattern: '(-?\\d+)',
    },
    'str': {
      processor: (x)=>x,
      pattern: '([^/]*)',
    }
  };
  makeMatcher(pattern:string, opts?:{exact:boolean}):IMatcher {
    opts = opts || {exact: false};
    let parts = pattern.split(RE_PARAM);
    let variables = [];
    let regexp = new RegExp(parts.map((part:string) => {
      if (part.startsWith('<') && part.endsWith('>')) {
        // pattern
        let kv = part.substr(1, part.length-2).split(':');
        let type = kv[0];
        let name = kv[1];
        let vardef = this.types[type];
        if (vardef) {
          variables.push({name, processor:vardef.processor});
          return vardef.pattern;
        } else {
          throw new Error(`Unknown variable type: ${type} in pattern ${pattern}`)
        }
      } else {
        // plain string
        return part
      }
    })
    .join(''));
    return (input:string):IMatch|null => {
      let m = input.match(regexp);
      if (m) {
        // match
        let params = {};
        let rest = input.substr(m[0].length);
        let exact = rest.length === 0;
        if (!exact && opts.exact) {
          // not an exact match
          return null;
        }
        variables.forEach((variable, idx) => {
          params[variable.name] = variable.processor(m[idx+1]);
        })
        return {
          matched_string: m[0],
          params,
          rest,
          exact,
        };
      } else {
        // not a match
        return null;
      }
    }
  }
}


function renderChildren(x) {
  if (_.isArray(x) || _.isString(x) || _.isNumber(x)) {
    return <span>{x}</span>;
  } else {
    return x;
  }
}


interface IRoutingInfo {
  // actual path in the URL bar right now
  rest: string;
  fullpath: string;
  setPath: (x:string)=>void;
  linking_root: string;
  params: any;
  matches: IMatch[];
  // routing path
  routing_root: string;
  // matcher
  master: MatcherMaster;
}

interface IRoutingContext {
  routing: IRoutingInfo;
}


function matchPath(path:string, props:RouteProps, master:MatcherMaster):IMatch {
  return master.makeMatcher(props.path, {
    exact: props.exact || false,
  })(path);
}

interface IRouterProps {
  path: string;
  setPath: (x:string)=>void;
  master?: MatcherMaster;
}
export class Router extends React.Component<IRouterProps, any> {
  private master: MatcherMaster;
  static childContextTypes = {
    routing: PropTypes.object,
  }
  getChildContext():IRoutingContext {
    return {
      routing: {
        rest: this.props.path,
        fullpath: this.props.path,
        linking_root: '',
        params: {},
        matches: [],
        setPath: this.props.setPath,
        routing_root: '',
        master: this.master,
      },
    }
  }
  constructor(props) {
    super(props)
    this.master = props.master || new MatcherMaster();
  }
  componentWillReceiveProps(nextProps) {
    this.master = nextProps.master || this.master || new MatcherMaster();
  }
  render() {
    return renderChildren(this.props.children);
  }
}

class _Routable<P, S> extends React.Component<P, S> {
  static contextTypes = {
    routing: PropTypes.object,
  }
  context: IRoutingContext;
}

interface RouteProps {
  path: string;
  exact?: boolean;
}
interface RouteState {
  match: IMatch|null;
}
export class Route extends _Routable<RouteProps, RouteState> {
  private matcher:IMatcher;
  constructor(props, context:IRoutingContext) {
    super(props, context);
    this.state = {
      match: null,
    };
  }
  static childContextTypes = {
    routing: PropTypes.object,
  }
  getChildContext():IRoutingContext {
    let base = Object.assign({}, this.context.routing);
    base.routing_root = base.routing_root + this.props.path;
    if (this.state.match) {
      base.rest = this.state.match.rest;
      base.linking_root = base.linking_root + this.state.match.matched_string;
      base.params = Object.assign({}, base.params, this.state.match.params);
      base.matches = [...base.matches, this.state.match];
    }
    console.log(this + ' returning params', base.params);
    return {
      routing: base,
    }
  }
  toString() {
    return `<Route path="${this.props.path}">`;
  }
  componentWillMount() {
    this.setState({
      match: matchPath(
        this.context.routing.rest,
        this.props,
        this.context.routing.master,
      )
    })
  }
  componentWillReceiveProps(nextProps, nextContext:IRoutingContext) {
    this.matcher = nextContext.routing.master.makeMatcher(nextProps.path, {
      exact: nextProps.exact || false,
    });
    this.setState({
      match: matchPath(
        nextContext.routing.rest,
        nextProps,
        nextContext.routing.master,
      ),
    })
  }
  shouldComponentUpdate(nextProps, nextState, nextContext:IRoutingContext) {
    console.log(this + ' shouldComponentUpdate');
    if (nextProps.path !== this.props.path
      || nextProps.exact !== this.props.exact) {
      return true;
    }
    let prevMatch = this.state.match;
    let nextMatch = nextState.match;
    if (prevMatch) {
      if (nextMatch) {
        // still matching
        if (prevMatch.rest !== nextMatch.rest) {
          // but the children need to be updated
          return true;
        } else if (!_.isEqual(prevMatch.params, nextMatch.params)) {
          return true;
        } else if (!_.isEqual(this.context.routing.params, nextContext.routing.params)) {
          return true;
        } else {
          return false;
        }
      } else {
        // no longer matching
        return true;
      }
    } else {
      if (nextState.match) {
        // matching now
        return true;
      } else {
        // still not matching
        return false;
      }
    }
  }
  render() {
    if (this.state.match) {
      return renderChildren(this.props.children);
    } else {
      return null;
    }
  }
}

//
//  Display only the first element that matches the current URL.
//
export class Switch extends _Routable<any, any> {
  render() {
    let children = React.Children.toArray(this.props.children);
    for (var i = 0; i < children.length; i++) {
      let element = children[i];
      if (!React.isValidElement(element)) {
        continue;
      }
      let props:any = element.props;
      if (props.path !== undefined) {
        // Route
        let match = matchPath(
          this.context.routing.rest,
          props,
          this.context.routing.master);
        if (match) {
          return element;  
        }
      } else {
        return element;
      }
    }
    return null;
  }
}

function computeLinkPath(props:LinkProps, context:IRoutingContext) {
  let path = props.to;
  if (props.relative === true) {
    path = Path.resolve(Path.join(context.routing.linking_root + '/', path));
  } else if (props.relative === 'current') {
    path = Path.resolve(Path.join(context.routing.fullpath + '/', path));
  }
  return path;
}

export class Redirect extends _Routable<LinkProps, any> {
  render() {
    let path = computeLinkPath(this.props, this.context);
    this.context.routing.setPath(path);
    return null;
  }
}


interface LinkProps {
  to: string;
  
  // relative
  // True = 
  //   This link is relative to the nearest ancestor Route
  // False (default) =
  //   This is an absolute link.
  // 'current' =
  //   This link is relative to the current URL
  relative?: boolean|'current';
  classWhenActive?: string;
  computeProps?: {
    [x:string]: (info:IRoutingInfo, instance?:_Routable<any,any>)=>any;
  };
  [x:string]: any;
}
export class Link extends _Routable<LinkProps, any> {
  render() {
    let {to, relative, classWhenActive, computeProps, className, ...rest} = this.props; 
    let cls = this.props.className || '';
    if (classWhenActive) {
      let path = computeLinkPath(this.props, this.context);
      if (path === this.context.routing.fullpath) {
        cls += ' ' + classWhenActive;
      }
    }
    let computed = {};
    if (computeProps) {
      computed = getComputedProps(this, computeProps);
    }
    let props = Object.assign({
      className: cls,
    }, rest, computed)
    return (<a href={to} onClick={this.click.bind(this)} {...props}>{this.props.children}</a>);
  }
  toString() {
    return `<Link to="${this.props.to}"${this.props.relative?' relative':''}>`;
  }
  click(ev) {
    ev.preventDefault();
    let path = computeLinkPath(this.props, this.context);
    this.context.routing.setPath(path);
    return false;
  }
}

function getComputedProps(instance:_Routable<any,any>, obj:object):object {
  let ret = {};
  Object.keys(obj).forEach(key => {
    ret[key] = obj[key](instance.context.routing, instance)
  });
  return ret;
}


interface WithRoutingProps {
  func: (routing:IRoutingInfo)=>any;
}
export class WithRouting extends _Routable<WithRoutingProps, any> {
  shouldComponentUpdate(nextProps, nextState, nextContext:IRoutingContext) {
    console.log('withRouting shouldComponentUpdate');
    if (nextProps.func !== this.props.func) {
      return true;
    }
    if (nextContext.routing.rest !== this.context.routing.rest) {
      return true;
    }
    return false;
  }
  render() {
    return this.props.func(this.context.routing);
  }
}

export class CurrentPath extends _Routable<{}, any> {
  render() {
    return <span>{this.context.routing.fullpath}</span>
  }
}