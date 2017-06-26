import * as React from 'react';
import * as cx from 'classnames';

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