import React from 'react';
import ReactDOM from 'react-dom';
import "babel-register";

export default class Options extends React.Component {
  constructor(props) {
    super(props);
    this.state = {collapsed: true};

    this.clicked = this.clicked.bind(this);
  }

  clicked() {
    this.setState({collapsed: !this.state.collapsed});
  }

  render() {
    // TODO build
    return <p></p>;

    if (this.state.collapsed) {
      return <p onClick={this.clicked}>{"> Options"}</p>;
    }

    return (
      <p onClick={this.clicked}>{"v Options"}</p>
    );
  }
}
