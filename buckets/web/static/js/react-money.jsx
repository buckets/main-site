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
