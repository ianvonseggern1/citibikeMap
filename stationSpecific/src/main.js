import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";

import Options from './options.js';
import Table from './table.js';

class Site extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isLoading: true};
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    let ajaxUrl = "https://ianv.me/citibikeStationSummary.json";
    ajaxUrl += "?station=" + this.props.station;
    ajaxUrl += "&start_date=" + this.props.startDateString;
    ajaxUrl += "&end_date=" + this.props.endDateString;
    ajaxUrl += "&station_type=" + this.props.stationType;
    ajaxUrl += "&start_time=" + this.props.startTime;
    ajaxUrl += "&end_time=" + this.props.endTime;
    ajaxUrl += "&step=" + this.props.timeStep;

    $.ajax({ url: ajaxUrl, success: (result) => {
      this.setState({
        isLoading: false,
        data: result.data,
        stationInfo: result.stationInfo,
      });
    }});
  }

  render() {
    if (this.state.error) {
      return (<p>{this.state.error}</p>);
    }

    if (this.state.isLoading) {
      return (<p>Loading...</p>);
    }

    let startDateParts = this.props.startDateString.split('-');
    let startDate = new Date(
      startDateParts[0],
      startDateParts[1],
      startDateParts[2],
    );
    let endDateParts = this.props.endDateString.split('-');
    let endDate = new Date(
      endDateParts[0],
      endDateParts[1],
      endDateParts[2],
    );

    let title = (this.state.stationInfo != null)
      ? this.state.stationInfo.name
      : null;

    return (
      <React.Fragment>
        <h1>{title}</h1>
        <Options {...this.props} />
        <Table
          data={this.state.data}
          startDate={startDate}
          endDate={endDate}
          {...this.props}
        />
      </React.Fragment>
    );
  }
}

function getValuesFromQueryParameters() {
  let queryParameters = new URLSearchParams(window.location.search);

  if (
    !queryParameters.has('start_date') ||
    !queryParameters.has('end_date') ||
    !queryParameters.has('station')
  ) {
    // TODO move this to props
    this.setState({
      error: "URL missing required parameters start_date, end_date, or station"
    });
    return;
  }

  var startTime = queryParameters.get('start_time');
  if (startTime === null) {
    startTime = 360; // 6am
  }
  var endTime = queryParameters.get('end_time');
  if (endTime === null) {
    endTime = 1440; // midnight
  }
  var timeStep = queryParameters.get('time_step');
  if (timeStep === null) {
    timeStep = 60; // 1 hour
  }
  var stationType = queryParameters.get('station_type');
  if (stationType === null) {
    stationType = 'bike'; // as opposed to 'dock'
  }


  return({
    'startDateString': queryParameters.get('start_date'),
    'endDateString': queryParameters.get('end_date'),
    'station': queryParameters.get('station'),
    'startTime': startTime,
    'endTime': endTime,
    'timeStep': timeStep,
    'stationType': stationType,
  });
}

ReactDOM.render(
  <Site {...getValuesFromQueryParameters()} />,
  document.getElementById('root')
);
