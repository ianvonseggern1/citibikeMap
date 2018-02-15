//import React from 'react';
//import ReactDOM from 'react-dom';
//import "babel-register";

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
    ajaxUrl += "?station=" + this.props.queryParameters.station;
    ajaxUrl += "&start_date=" + this.props.queryParameters.startDateString;
    ajaxUrl += "&end_date=" + this.props.queryParameters.endDateString;
    // TODO add option parameters station_type, start_time, end_time, step

    $.ajax({ url: ajaxUrl, success: (result) => {
      this.setState({isLoading: false, data: result});
    }});
  }

  render() {
    if (this.state.error) {
      return (<p>{this.state.error}</p>);
    }

    if (this.state.isLoading) {
      return (<p>Loading...</p>);
    }

    let startDateParts = this.props.queryParameters.startDateString.split('-');
    let startDate = new Date(
      startDateParts[0],
      startDateParts[1],
      startDateParts[2],
    );
    let endDateParts = this.props.queryParameters.endDateString.split('-');
    let endDate = new Date(
      endDateParts[0],
      endDateParts[1],
      endDateParts[2],
    );
    return (
      <Table
        startDate={startDate}
        endDate={endDate}
        data={this.state.data}
      />
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

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // A day is an array of time increments, each of which is a dictionary
  // This function pairwise combines each of those dictionaries
  static addDays(a, b) {
    var rtn = [];
    for (let index in a) {
      rtn.push(Table.addDictionaries(a[index], b[index]));
    }
    return rtn;
  }

  // Each dictionary represents an aggregation of values in a time increment
  // This method takes two of them, merges all keys in both and adds the values
  // for any key that appears in both
  static addDictionaries(a, b) {
    var rtn = $.extend({}, a);
    for (let key in b) {
      if (key in rtn) {
        rtn[key] += b[key]
      } else {
        rtn[key] = b[key]
      }
    }
    return rtn;
  }

  render() {
    let rows = [
      {
        'name': 'All Days',
        'filter': (_dayData, _dayIndex) => { return true; },
      },
      {
        'name': 'Weekdays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          let dayOfWeek = date.getDay();
          return dayOfWeek > 0 && dayOfWeek < 6;
        },
      },
      {
        'name': 'Weekends',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          let dayOfWeek = date.getDay();
          return dayOfWeek === 0 || dayOfWeek === 6;
        },
      },
      {
        'name': 'Saturdays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          return date.getDay() === 6;
        },
      },
      {
        'name': 'Sundays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          return date.getDay() === 0;
        },
      },
      {
        'name': 'Mondays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          return date.getDay() === 1;
        },
      },
      {
        'name': 'Tuesdays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          return date.getDay() === 2;
        },
      },
      {
        'name': 'Wednesdays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          return date.getDay() === 3;
        },
      },
      {
        'name': 'Thursdays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          return date.getDay() === 4;
        },
      },
      {
        'name': 'Fridays',
        'filter': (_dayData, dayIndex) => {
          var date = new Date(this.props.startDate.getTime()); // Copy startDate
          date.setDate(date.getDate() + dayIndex);
          return date.getDay() === 5;
        },
      },
    ];

    let rowsHtml = [];
    for (let rowIndex in rows) {
      let row = rows[rowIndex];
      let data = this.props.data.filter(row.filter).reduce(Table.addDays);
      rowsHtml.push(<Row data={data} name={row.name} key={row.name} />);
    }

    return(
      <table>
        <tbody>
          {rowsHtml}
        </tbody>
      </table>
    );
  }
}

class Row extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <tr>
        <td>{this.props.name}</td>
        {this.props.data.map((cellData, index) => <TableCell key={index} data={cellData} />)}
      </tr>
    );
  }
}

class TableCell extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let data = this.props.data;
    let available = data.hasOwnProperty('available') ? data['available'] : 0;
    let low = data.hasOwnProperty('low') ? data['low'] : 0;
    let empty = data.hasOwnProperty('empty') ? data['empty'] : 0;
    let total = available + low + empty;

    let height = 100;
    let width = 50;
    let availableHeight = 100 * available / total;
    let lowHeight = 100 * low / total;
    let emptyHeight = 100 * empty / total;

    // TODO absolute position them because there is weird padding
    return (
      <td>
        <div style={{
          display: 'inline-block',
          width: width + 'px',
          height: emptyHeight + 'px',
          backgroundColor: 'red',
        }} />
        <div style={{
          display: 'inline-block',
          width: width + 'px',
          height: lowHeight + 'px',
          backgroundColor: 'yellow',
        }} />
        <div style={{
          display: 'inline-block',
          width: width + 'px',
          height: availableHeight + 'px',
          backgroundColor: 'green',
        }} />
      </td>
    );
  }
}

ReactDOM.render(
  <Site queryParameters={getValuesFromQueryParameters()} />,
  document.getElementById('root')
);
