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
    ajaxUrl += "?station=" + this.props.station;
    ajaxUrl += "&start_date=" + this.props.startDateString;
    ajaxUrl += "&end_date=" + this.props.endDateString;
    ajaxUrl += "&station_type=" + this.props.stationType;
    ajaxUrl += "&start_time=" + this.props.startTime;
    ajaxUrl += "&end_time=" + this.props.endTime;
    ajaxUrl += "&step=" + this.props.timeStep;

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
    return (
      <Table
        data={this.state.data}
        startDate={startDate}
        endDate={endDate}
        {...this.props}
      />
    );
  }
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

  // daysPast is an int
  // daysOfWeek is an array of ints in the range [0,6]
  // This function returns true if daysPast days from the props.startDate is one
  // of the days of the week whitelisted in daysOfWeek. The week starts with
  // Sunday = 0, Monday = 1 ...
  isDayOfWeek(daysPast, daysOfWeek) {
    var date = new Date(this.props.startDate.getTime()); // Copy date
    date.setDate(date.getDate() + daysPast);
    let dayOfWeek = date.getDay();
    return (daysOfWeek.indexOf(dayOfWeek) !== -1);
  }

  render() {
    let rows = [
      {
        'name': 'All Days',
        'filter': (_dayData, _dayIndex) => true,
      },
      {
        'name': 'Weekdays',
        'filter': (_dayData, dayIndex) =>
          this.isDayOfWeek(dayIndex, [1,2,3,4,5]),
      },
      {
        'name': 'Weekends',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [0,6]),
      },
      {
        'name': 'Saturdays',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [6]),
      },
      {
        'name': 'Sundays',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [0]),
      },
      {
        'name': 'Mondays',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [1]),
      },
      {
        'name': 'Tuesdays',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [2]),
      },
      {
        'name': 'Wednesdays',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [3]),
      },
      {
        'name': 'Thursdays',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [4]),
      },
      {
        'name': 'Fridays',
        'filter': (_dayData, dayIndex) => this.isDayOfWeek(dayIndex, [5]),
      },
    ];

    let rowsHtml = [];
    for (let rowIndex in rows) {
      let row = rows[rowIndex];
      let data = this.props.data.filter(row.filter).reduce(Table.addDays);
      rowsHtml.push(
        <TableRow
          data={data}
          name={row.name}
          key={row.name}
          type={this.props.stationType}
          startTime={this.props.startTime}
          timeStep={this.props.timeStep}
        />
      );
    }

    return(
      <table style={{paddingRight: '300px'}}>
        <thead>
          <TableHeader
            startTime={this.props.startTime}
            timeStep={this.props.timeStep}
            endTime={this.props.endTime}
          />
        </thead>
        <tbody>
          {rowsHtml}
        </tbody>
      </table>
    );
  }
}

class TableHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    var timeLables = [<td key={'label'}>Time of Day</td>]
    var time = this.props.startTime;
    while (time < this.props.endTime) {
      timeLables.push(
        <td key={time} style={{
          textAlign: 'center',
          fontSize: 'small',
          fontFamily: 'monospace',
        }}>
          {minutesToTimeString(time)}
        </td>
      );
      time += this.props.timeStep;
    }

    // TODO make header sticky
    return (
      <tr>
        {timeLables}
      </tr>
    );
  }
}

class TableRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <tr>
        <td>{this.props.name}</td>
        {this.props.data.map(
          (cellData, index) => {
            let startTime = this.props.startTime + this.props.timeStep * index;
            let endTime = this.props.startTime + this.props.timeStep * (index + 1);
            return (
              <TableCell
                key={index}
                data={cellData}
                type={this.props.type}
                startTime={startTime}
                endTime={endTime}
              />
            );
          }
        )}
      </tr>
    );
  }
}

class TableCell extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showTooltip: false};
  }

  render() {
    let data = this.props.data;
    let available = data.hasOwnProperty('available') ? data['available'] : 0;
    let low = data.hasOwnProperty('low') ? data['low'] : 0;
    let empty = data.hasOwnProperty('empty') ? data['empty'] : 0;
    let total = available + low + empty;

    let height = 80;
    let width = 40;
    let padding = 25;

    let barInfo = [
      {color: '#FF2D55', count: empty, description: '0'},
      {color: '#FFCC00', count: low, description: '1-2'},
      {color: '#4cd964', count: available, description: '3+'},
    ];
    var currentTop = padding;
    var barDivs = [];
    barInfo.forEach((bar) => {
      let barHeight = (height * bar.count / total);
      barDivs.push(
        <BarGraphSegment
          {...bar}
          height = {barHeight}
          width = {width}
          top = {currentTop}
          total = {total}
          type = {this.props.type}
          startTime = {this.props.startTime}
          endTime = {this.props.endTime}
        />
      );
      currentTop += barHeight;
    });

    return (
      <td>
        <div style={{
          position: 'relative',
          width: width + 'px',
          height: height + 'px',
          paddingTop: padding + 'px',
          paddingBottom: padding + 'px',
        }}>
          {barDivs}
        </div>
      </td>
    );
  }
}

class BarGraphSegment extends React.Component {
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
        <div style={{
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
              percent + '% (' + this.props.count + ' of ' + this.props.total +
              ') of the time there are ' + this.props.description + ' ' +
              this.props.type + 's available from ' + startTime + ' to ' +
              endTime
            }
          </p>
        </div>
      );
    }

    return (
      <div>
        <div
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
          }} />,
        {tooltip}
      </div>
    );
  }
}

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

function getValuesFromQueryParameters() {
    let queryParameters = new URLSearchParams(window.location.search);

    if (
      !queryParameters.has('start_date') ||
      !queryParameters.has('end_date') ||
      !queryParameters.has('station')
    ) {
      // TODO move error to props instead
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
