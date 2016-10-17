import React, { PropTypes } from 'react';
import Filmstrip from '../components/filmstrip';

const DisciplineSelector = (props) => {
  return (
    <Filmstrip increment={350} value={props.value} onChange={props.onChange} />
  );
};

DisciplineSelector.propTypes = {
  increment: PropTypes.number,
  onChange: PropTypes.func,
  value: PropTypes.string,
};

export default DisciplineSelector;
