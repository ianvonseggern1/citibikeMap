import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";
import $ from 'jquery';

// Only imported for their constants, perhaps we move these to a seperate file
import TableRow from './tableRow.js';
import TableCell from './tableCell.js';

// TODO move to centralized helper function class
function minutesToTimeString(minutesPastMidnight) {
  var hours = Math.floor(minutesPastMidnight / 60);
  let amPm = hours > 11 ? "pm" : "am";
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

export default class TableHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {scrollX: 0, scrollY: 0};

    // bind this
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
      window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
      window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll() {
    this.setState({scrollX: window.scrollX, scrollY: window.scrollY});
  }

  render() {
    let leftPadding = 4
    var timeLables = [
      <span id='header_label' style={{
        paddingLeft: leftPadding,
        width: TableRow.ROW_NAME_WIDTH - leftPadding,
        display: 'inline-block',
      }}>
        Time of Day
      </span>,
    ];
    var time = this.props.startTime;
    while (time < this.props.endTime) {
      timeLables.push(
        <span key={time} style={{
          textAlign: 'center',
          fontSize: 'x-small',
          fontFamily: 'monospace',
          display: 'inline-block',
          width: TableCell.width + 'px',
          padding: '10px ' + TableCell.horizontalPadding + 'px',
        }}>
          {minutesToTimeString(time)}
        </span>
      );
      time += this.props.timeStep;
    }

    var stickyHeaderPosition = 'relative';
    let stickyTop = 0;
    var stickyLeft = 0;
    var dummyDiv = null;

    // We use the location of the dummy div to figure out where the header
    // would be if it was relatively positioned
    var minYForTableHeader = 80;
    if ($("#dummy_header_div").offset()) {
      minYForTableHeader = $("#dummy_header_div").offset().top;
    }

    var dummyDivHeight = 0;
    if (this.state.scrollY >= minYForTableHeader) {
      stickyHeaderPosition = 'fixed';
      stickyLeft = -1 * this.state.scrollX + 8;
      dummyDivHeight = 32;
    }

    return (
      <React.Fragment>
        <div id="dummy_header_div" style={{height: dummyDivHeight}}></div>
        <div id='table_header' onScroll={this.didScroll} style={{
          width: TableRow.rowWidth(timeLables.length - 1),
          backgroundColor: 'lightblue',
          zIndex: 2,
          top: stickyTop,
          left: stickyLeft,
          position: stickyHeaderPosition,
        }}>
          {timeLables}
        </div>
      </React.Fragment>
    );
  }
}
