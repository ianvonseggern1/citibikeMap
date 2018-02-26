import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";
import $ from 'jquery';

import TableHeader from './tableHeader.js';
import TableRow from './tableRow.js';

export default class Table extends React.Component {
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
      <div id='table_container'>
        <TableHeader
          startTime={this.props.startTime}
          timeStep={this.props.timeStep}
          endTime={this.props.endTime}
        />
        {rowsHtml}
      </div>
    );
  }
}
