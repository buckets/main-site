var _groupregex = new RegExp(',', "g");
math.config({number:'BigNumber'});

function fancyEval(string) {
  string = string.replace(_groupregex, '');
  return math.eval(string).toString();
};

window.MoneyInput = React.createClass({
  getInitialState: function() {
    return {
      display: cents2decimal(this.props.value) || '',
    }
  },
  componentWillReceiveProps: function(props) {
    var current = this.display2Cents(this.state.display);
    if ((current && current !== props.value) || (!current && props.value)) {
      // effectively different
      this.setState({display: cents2decimal(props.value) || ''})
    }
  },
  display2Cents: function(display) {
    try {
      var answer = fancyEval(display);  
    } catch(err) {
    }
    answer = answer || '';
    return decimal2cents(answer);
  },
  onDisplayChanged: function(e) {
    var display = e.target.value;
    var value = this.display2Cents(display);
    this.setState({display: display}, function() {
      this.props.onChange(value);
    });
  },
  render: function() {
    var { value, onChange, className, ...other } = this.props;
    var computed_value_elem;
    var computed_value = this.display2Cents(this.state.display);
    var all_classes = (className || '') + ' money-input';
    var input_classes = className || '';
    if (computed_value !== decimal2cents(this.state.display)) {
      var classes = (className || '') + ' computed-value';
      input_classes += ' with-computed';
      if (computed_value < 0) {
        classes += ' negative';
      }
      computed_value = cents2decimal(computed_value);
      computed_value_elem = (<div className={classes}>{computed_value}</div>);
    }

    return (
      <div className={all_classes} >
        <input type="text" value={this.state.display} onChange={this.onDisplayChanged} {...other} className={input_classes} />&nbsp;
        {computed_value_elem}
      </div>
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