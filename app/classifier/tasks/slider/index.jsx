import React from 'react';
import GenericTask from '../generic';
import GenericTaskEditor from '../generic-editor';
import { Markdown } from 'markdownz';
import TextTaskEditor from '../text/editor';

class Summary extends React.Component {
  render() {
    return (
      <div>
        <div className="question">
          {this.props.task.instruction}
        </div>
        <div className="answers">
        {this.props.annotation.value ? (
          <div className="answer">
            “<code>{this.props.annotation.value}</code>”
          </div>) : ""}
        </div>
      </div>
    );
  }
}
Summary.displayName = 'SliderSummary';

Summary.defaultProps = {
  task: React.PropTypes.object,
  annotation: React.PropTypes.string,
  expanded: React.PropTypes.bool,
};

class SliderTask extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange() {
    const value = this.sliderInput.value;
    const newAnnotation = Object.assign(this.props.annotation, {value});
    this.props.onChange(newAnnotation);
  }
  render() {
    return (
      <GenericTask
        question={this.props.task.instruction}
        help={this.props.task.help}
        required={this.props.task.required}
      >
        <label className="answer">
          <input
            type="range"
            autoFocus={this.props.autoFocus}
            className="standard-input full"
            ref={ (r) => { this.sliderInput = r }}
            onChange={this.handleChange}
            max={100}
            min={0}
          />
        </label>
      </GenericTask>
    );
  }
}
SliderTask.displayName = 'SliderTask';
SliderTask.Editor = GenericTaskEditor;
SliderTask.Summary = Summary;
SliderTask.getDefaultTask = () => ({
  type: 'slider',
  instruction: 'Enter an Instruction.',
  help: '',
});
SliderTask.getTaskText = task => task.instruction;
SliderTask.getDefaultAnnotation = () => ({value: 0});
SliderTask.isAnnotationComplete = () => true;
SliderTask.propTypes = {
  task: React.PropTypes.object,
  value: React.PropTypes.node,
  onChange: React.PropTypes.func,
};

module.exports = SliderTask;
