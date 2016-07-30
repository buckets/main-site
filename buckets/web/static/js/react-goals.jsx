window.GoalBar = React.createClass({
  render: function() {
    var { max, value, ...other } = this.props;
    var percent = value / max;
    if (!isFinite(percent)) {
      percent = 0;
    }
    var display_percent = Math.round(100 * percent) + '%';
    if (percent > 1) {
      percent = 1;
      display_percent = '100%+';
    } else if (percent < 0) {
      percent = 0;
    }
    var width = Math.round(100 * percent) + '%';
    var forestyle = {
      width: width,
    };
    return (
      <div className="goalbar" {...other}>
        <div className="background"></div>
        <div className="foreground" style={forestyle}></div>
        <div className="data">{display_percent} of <Money value={max}/></div>
      </div>
    );
  }
});
