import React from 'react';
import moreMath from '../lib/math-addons';

moreMath();

const isVar = (v) => typeof(v) !== 'undefined';

// grabs the model score (calculated in modelCanvas) and displays it with a
// progress bar
const ModelScore = (props) => {
  if (isVar(props.workflow) && isVar(props.workflow.configuration) &&
    isVar(props.workflow.configuration.metadata) &&
    isVar(props.workflow.configuration.metadata.modelScore)) {
    let s = props.workflow.configuration.metadata.modelScore;
    if (s < 80) {
      s = Math.round10(s, -2);
    } else if (s < 90) {
      s = Math.round10(s, -3);
    } else if (s < 95) {
      s = Math.round10(s, -4);
    }
    return (
      <div className="answer undefined">
        <div className="answer-button">
          <div className="answer-button-label">
            Score:
            <span className="model-score">{s}</span>
          </div>
          <progress max="100" value={s} />
        </div>
      </div>
    );
  } else {
    return (
      <div className="answer undefined">
        <div className="answer-button">
          <div className="no-score-message">No Score Calculated</div>
          <progress max="100" value="0" />
        </div>
      </div>
    );
  }
}

ModelScore.propTypes = {
  workflow: React.PropTypes.object
};

ModelScore.defaultProps = {
  workflow: {}
}

export default ModelScore;
