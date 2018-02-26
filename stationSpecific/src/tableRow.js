import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";

import TableCell from './tableCell.js';

export default class TableRow extends React.Component {
  static ROW_NAME_WIDTH = 90;

  constructor(props) {
    super(props);
    this.state = {};
  }

  static rowWidth(cellCount) {
    let cellWidth = (TableCell.width + 2 * TableCell.horizontalPadding);
    return cellCount * cellWidth + TableRow.ROW_NAME_WIDTH;
  }

  render() {
    let cells = this.props.data.map(
      (cellData, index) => {
        let startTime = this.props.startTime + this.props.timeStep * index;
        let endTime = startTime + this.props.timeStep;
        return (
          <TableCell
            key={index}
            data={cellData}
            type={this.props.type}
            startTime={startTime}
            endTime={endTime}
          />
        );
    });

    // 300 is extra room for the tooltip TODO make more elegant
    return (
      <div id='table_row' style={{
        width: (TableRow.rowWidth(cells.length) + 300) + 'px',
      }}>
        <span id='row_name' style={{
          width: TableRow.ROW_NAME_WIDTH + 'px',
          display: 'inline-block',
          float: 'left',
          paddingTop: '50px',
        }}>
          {this.props.name}
        </span>
        {cells}
      </div>
    );
  }
}
