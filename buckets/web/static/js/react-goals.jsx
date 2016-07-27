window.GoalBar = React.createClass({
  render: function() {
    var { max, value, ...other } = this.props;
    var percent = value / max;
    var display_percent = Math.round(100 * percent) + '%';
    percent = percent > 1 ? 1 : percent;
    percent = percent < 0 ? 0 : percent;
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
