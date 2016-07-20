window.GoalBar = React.createClass({
  render: function() {
    var { max, value, ...other } = this.props;
    var percent = value / max;
    percent = percent > 1 ? 1 : percent;
    var width = Math.round(100 * percent) + '%';
    var forestyle = {
      width: width,
    };
    return (
      <div className="goalbar" {...other}>
        <div className="background"></div>
        <div className="foreground" style={forestyle}></div>
        <div className="data">{width} of <Money value={max}/></div>
      </div>
    );
  }
});
