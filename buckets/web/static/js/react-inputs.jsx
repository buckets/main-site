window.MonthInput = React.createClass({
  getInitialState: function() {
    var d = parseMonth(this.props.value);
    var y = d ? d.getFullYear() : '';
    var m = d ? d.getMonth()+1 : '1';
    var value = this.getValue(y, m);
    return {
      year: y,
      month: m,
      value: value,
    }
  },
  componentWillReceiveProps: function(props) {
    var d = parseMonth(props.value);
    if (d) {
      var y = d ? d.getFullYear() : '';
      var m = d ? d.getMonth()+1 : '1';
      var value = this.getValue(y, m);
      this.setState({
        year: y,
        month: m,
        value: value,
      })
    }
  },
  getValue: function(year, month) {
    month = parseInt(month);
    if (!year || !month) {
      return '';
    }
    if (('' + year).length != 4) {
      return '';
    }
    return formatDate(new Date(year, month-1, 1));
  },
  monthChanged: function(e) {
    var newstate = _.merge(this.state, {month: e.target.value});
    this.doUpdate(newstate);
  },
  yearChanged: function(e) {
    var newstate = _.merge(this.state, {year: e.target.value});
    this.doUpdate(newstate);
  },
  doUpdate: function(newstate) {
    var newval = this.getValue(newstate.year, newstate.month);
    newstate.value = newval;
    this.setState(newstate);
    this.props.onChange(newval);
  },
  render: function() {
    return (
      <div className="month-input">
        <select value={this.state.month} onChange={this.monthChanged}>
          <option value="1">Jan</option>
          <option value="2">Feb</option>
          <option value="3">Mar</option>
          <option value="4">Apr</option>
          <option value="5">May</option>
          <option value="6">Jun</option>
          <option value="7">Jul</option>
          <option value="8">Aug</option>
          <option value="9">Sep</option>
          <option value="10">Oct</option>
          <option value="11">Nov</option>
          <option value="12">Dec</option>
        </select>
        <input type="text" value={this.state.year} onChange={this.yearChanged} size="5" className="year" />
        <input type="hidden" value={this.state.value} name={this.props.name} />
      </div>
    );
  }
});