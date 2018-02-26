import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";

// TODO move to centeralized helper function class
function minutesToTimeString(minutesPastMidnight) {
  var hours = Math.floor(minutesPastMidnight / 60);
  let amPm = hours > 11 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours == 0 ? 12 : hours;
  let minutes = minutesPastMidnight % 60;
  var minutesString = "";
  if (minutes !== 0) {
    var minutesString = String(minutes);
    if (minutesString.length == 1) {
      minutesString = "0" + minutesString;
    }
    minutesString = ":" + minutesString
  }
  return String(hours) + minutesString + amPm;
}

export default class BarGraphSegment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showTooltip: false};

    // Bind this to callbacks
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseExit = this.mouseExit.bind(this);
  }

  mouseEnter() {
    this.setState({showTooltip: true});
  }

  mouseExit() {
    this.setState({showTooltip: false});
  }

  render() {
    var tooltip = null;
    if (this.state.showTooltip) {
      let percent = Math.round(100 * this.props.count / this.props.total);
      let startTime = minutesToTimeString(this.props.startTime);
      let endTime = minutesToTimeString(this.props.endTime);

      tooltip = (
        <div id='tooltip' style={{
          position: 'absolute',
          top: (this.props.top + this.props.height) + 'px',
          width: '300px',
          zIndex: 2,
          backgroundColor: 'lightgray',
          borderRadius: '5px',
          paddingLeft: '5px',
          left: this.props.width + 'px',
        }}>
          <p>
            {
              percent + '% of the time there are ' + this.props.description +
              ' ' + this.props.type + 's available from ' + startTime + ' to ' +
              endTime + ' (' + this.props.count + ' of ' + this.props.total +
              ' samples)'
            }
          </p>
        </div>
      );
    }

    return (
      <React.Fragment>
        <div
          id='bar_segment'
          onMouseEnter={this.mouseEnter}
          onMouseLeave={this.mouseExit}
          key={this.props.description}
          style={{
            position: 'absolute',
            top: this.props.top + 'px',
            display: 'inline-block',
            width: this.props.width + 'px',
            height: this.props.height + 'px',
            backgroundColor: this.props.color,
          }} />
        {tooltip}
      </React.Fragment>
    );
  }
}
