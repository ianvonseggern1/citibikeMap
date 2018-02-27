import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";
import DatePicker from 'react-datepicker';
import moment from 'moment';

import 'react-datepicker/dist/react-datepicker-cssmodules.css';

// TODO move to centeralized helper function class
function minutesToTimeString(minutesPastMidnight) {
  var hours = Math.floor(minutesPastMidnight / 60);
  let amPm = (hours > 11 && hours < 24) ? "PM" : "AM";
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

function minutesToTimeDuration(minutes) {
  if (minutes % 60 == 0) {
    let hours = Math.floor(minutes / 60);
    if (hours === 1) {
      return "1 hour";
    } else {
      return hours + " hours";
    }
  }
  return minutes + " minutes";
}

export default class Options extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: true,
      startDate: moment(props.startDate),
      endDate: moment(props.endDate),
      type: props.stationType,
      timeStep: props.timeStep,
      startTime: props.startTime,
      endTime: props.endTime,
    };

    this.clicked = this.clicked.bind(this);
    this.handleStartDateChange = this.handleStartDateChange.bind(this);
    this.handleEndDateChange = this.handleEndDateChange.bind(this);
    this.handleTypeSelect = this.handleTypeSelect.bind(this);
    this.handleTimeStepSelect = this.handleTimeStepSelect.bind(this);
    this.handleStartTimeSelect = this.handleStartTimeSelect.bind(this);
    this.handleEndTimeSelect = this.handleEndTimeSelect.bind(this);
    this.submit = this.submit.bind(this);
  }

  clicked() {
    this.setState({collapsed: !this.state.collapsed});
  }

  handleStartDateChange(date) {
    this.setState({startDate: date});
  }

  handleEndDateChange(date) {
    this.setState({endDate: date});
  }

  handleTypeSelect(event) {
    this.setState({type: event.target.value});
  }

  handleTimeStepSelect(event) {
    this.setState({timeStep: event.target.value});
  }

  handleStartTimeSelect(event) {
    this.setState({startTime: event.target.value});
  }

  handleEndTimeSelect(event) {
    this.setState({endTime: event.target.value});
  }

  submit(event) {
    var newUrl = window.location.pathname;
    newUrl += "?station=" + this.props.station;
    newUrl += "&start_date=" + this.state.startDate.format("YYYY-MM-DD");
    newUrl += "&end_date=" + this.state.endDate.format("YYYY-MM-DD");
    newUrl += "&station_type=" + this.state.type;
    newUrl += "&time_step=" + this.state.timeStep;
    newUrl += "&start_time=" + this.state.startTime;
    newUrl += "&end_time=" + this.state.endTime;
    window.location.href = newUrl;

    event.preventDefault();
  }

  render() {
    if (this.state.collapsed) {
      return <p onClick={this.clicked}>{"- Options"}</p>;
    }

    let timeOptions = [];
    for (var i = 0; i <= 1440; i += 30) {
      timeOptions.push(<option value={i}>{minutesToTimeString(i)}</option>);
    }

    let timeStepValues = [10, 20, 30, 60, 120, 180, 240, 360];
    let timeStepOptions = timeStepValues.map((x) => {
      return <option value={x}>{minutesToTimeDuration(x)}</option>;
    });

    // TODO fix server side, bucket size seems broken
    //<span style={{display: "flex", flexDirection: "column"}}>
    //  {"Bucket Size"}
    //  <select value={this.state.timeStep} onChange={this.handleTimeStepSelect}>
    //    {timeStepOptions}
    //  </select>
    //</span>

    return (
      <React.Fragment>
        <p onClick={this.clicked}>{"+ Options"}</p>
        <form onSubmit={this.submit} style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          padding: 10
        }}>
          <select value={this.state.type} onChange={this.handleTypeSelect}>
            <option value="bike">Bike Availability</option>
            <option value="dock">Dock Availability</option>
          </select>
          <span style={{display: "flex", flexDirection: "column"}}>
            {"Start Date"}
            <DatePicker
              selected={this.state.startDate}
              onChange={this.handleStartDateChange}
            />
          </span>
          <span style={{display: "flex", flexDirection: "column"}}>
            {"End Date"}
            <DatePicker
              selected={this.state.endDate}
              onChange={this.handleEndDateChange}
            />
          </span>
          <span style={{display: "flex", flexDirection: "column"}}>
            {"Daily Start Time"}
            <select value={this.state.startTime} onChange={this.handleStartTimeSelect}>
              {timeOptions.slice(0, -1)} // Exclude second midnight
            </select>
          </span>
          <span style={{display: "flex", flexDirection: "column"}}>
            {"Daily End Time"}
            <select value={this.state.endTime} onChange={this.handleEndTimeSelect}>
              {timeOptions.slice(1)} // Exclude first midnight
            </select>
          </span>
          <input type="submit" value="Go" />
        </form>
      </React.Fragment>
    );
  }
}
