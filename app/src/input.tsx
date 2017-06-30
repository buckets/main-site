import * as React from 'react';
import * as cx from 'classnames';
import * as _ from 'lodash';

interface TextInputProps {
  value: string|number|null;
  onChange: (newval)=>void;
  className?: string;
}
export class TextInput extends React.Component<TextInputProps, {
  value: string|number|null;
}> {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    }
  }
  render() {
    let { value, onChange, className, ...rest } = this.props;
    value = this.state.value;
    return (<input
      type="text"
      value={value}
      onChange={this.onChange}
      className={cx(
        className,
        'ctx-matching-input',
      )}
      {...rest} />)
  }
  onChange = (ev) => {
    this.setState({value: ev.target.value});
    this.props.onChange(ev.target.value);
  }
}

interface DebouncedInputProps {
  value: any;
  onChange: (newval:any)=>void;
  blendin?: boolean;
  [k:string]: any;
}
export class DebouncedInput extends React.Component<DebouncedInputProps, {
  value: any;
}> {
  constructor(props) {
    super(props)
    this.state = {
      value: props.value,
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value) {
      this.setState({value: nextProps.value});
    }
  }
  onChange = (ev) => {
    let val = ev.target.value;
    if (val !== this.state.value) {
      this.setState({value: val}, () => {
        this.emitChange();
      })
    }
  }
  emitChange = _.debounce(() => {
    this.props.onChange(this.state.value);
  }, 350, {leading: false, trailing: true});
  render() {
    let { value, onChange, className, blendin, ...rest } = this.props;
    className = cx(className, {
      'ctx-matching-input': blendin,
    })
    return <input
      onChange={this.onChange}
      value={this.state.value}
      className={className}
      {...rest} />
  }
}