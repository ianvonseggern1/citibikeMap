//import React from 'react';
//import ReactDOM from 'react-dom';
//import "babel-register";

class Site extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    let parameters = this.getValuesFromQueryParameters();
    this.fetchData(parameters);
  }

  fetchData(parameters) {
    let ajaxUrl = "https://ianv.me/citibikeStationSummary.json";
    ajaxUrl += "?station=" + parameters.station;
    ajaxUrl += "&start_date=" + parameters.startDateString;
    ajaxUrl += "&end_date=" + parameters.endDateString;
    // TODO add option parameters station_type, start_time, end_time, step

    $.ajax({ url: ajaxUrl, success: (result) => {
      this.setState({data: result});
    }});
  }

  getValuesFromQueryParameters() {
    let queryParameters = new URLSearchParams(window.location.search);

    if (
      !queryParameters.has('start_date') ||
      !queryParameters.has('end_date') ||
      !queryParameters.has('station')
    ) {
      this.setState({
        error: "URL missing required parameters start_date, end_date, or station"
      });
      return;
    }

    return({
      'startDateString': queryParameters.get('start_date'),
      'endDateString': queryParameters.get('end_date'),
      'station': queryParameters.get('station'),
    });
  }

  render() {
    if (this.state.error) {
      return (<p>{this.state.error}</p>);
    }

    // TODO build table
    return (
      <p>
        {JSON.stringify(this.state.data)}
      </p>
    );
  }
}

ReactDOM.render(
  <Site />,
  document.getElementById('root')
);
