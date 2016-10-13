import React, { Component, PropTypes } from 'react';
import Filmstrip from '../components/filmstrip';

class DisciplineSelector extends Component {
  render() {
    return (
      <Filmstrip increment={350} value={this.props.value} onChange={this.props.onChange} />
    );
  }
}

DisciplineSelector.propTypes = {
  increment: PropTypes.number,
  onChange: PropTypes.func,
  value: PropTypes.string,
};

export default DisciplineSelector;
