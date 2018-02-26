import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";

import BarGraphSegment from './barGraphSegment.js';

export default class TableCell extends React.Component {
  static height = 80;
  static width = 40;
  static verticalPadding = 25;
  static horizontalPadding = 2;

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

    let barInfo = [
      {color: '#FF2D55', count: empty, description: '0'},
      {color: '#FFCC00', count: low, description: '1-2'},
      {color: '#4cd964', count: available, description: '3+'},
    ];
    var currentTop = 0;
    var barDivs = [];
    barInfo.forEach((bar) => {
      let barHeight = (TableCell.height * bar.count / total);
      barDivs.push(
        <BarGraphSegment
          {...bar}
          height = {barHeight}
          width = {TableCell.width}
          top = {currentTop}
          total = {total}
          type = {this.props.type}
          startTime = {this.props.startTime}
          endTime = {this.props.endTime}
        />
      );
      currentTop += barHeight;
    });

    let cssPaddingString = TableCell.verticalPadding + 'px ';
    cssPaddingString += TableCell.horizontalPadding + 'px'

    return (
      <div id='table_cell' style={{
        width: TableCell.width + 'px',
        height: TableCell.height + 'px',
        padding: cssPaddingString,
        display: 'inline-block',
      }}>
        <div id='bar_segments_wrapper' style={{
          position: 'relative',
        }}>
          {barDivs}
        </div>
      </div>
    );
  }
}
