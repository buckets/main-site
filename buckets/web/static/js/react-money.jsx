window.MoneyInput = React.createClass({
  getInitialState: function() {
    return {
      display: cents2decimal(this.props.value) || '',
    }
  },
  componentWillReceiveProps: function(props) {
    var current = decimal2cents(this.state.display);
    if (current !== props.value) {
      // effectively different
      this.setState({display: cents2decimal(props.value) || ''})
    }
  },
  onDisplayChanged: function(e) {
    var display = e.target.value;
    var value = decimal2cents(display);
    this.setState({display: display}, function() {
      this.props.onChange(value);
    });
  },
  render: function() {
    var { value, onChange, ...other } = this.props;
    return (
      <input type="text" value={this.state.display} onChange={this.onDisplayChanged} {...other} />
    );
  }
});

window.Money = React.createClass({
  render: function() {
    var { value, className, ...other } = this.props;
    var decimal = cents2decimal(value);
    var class_name = 'number';
    if (value < 0) {
      class_name += ' negative';
    }
    if (className) {
      class_name += ' ' + className;  
    }
    if (this.props.hidezero && value === 0) {
      value = '';
    }
    return (<span className={class_name}>{decimal}</span>)
  }
});