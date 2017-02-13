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
    const value = parseInt(this.slider.value);
    const newAnnotation = Object.assign(this.props.annotation, {value});
    this.props.onChange(newAnnotation);
  }
  componentDidMount() {
    if (this.slider) this.slider.value = this.props.annotation.value
  }
  render() {
    return (
      <div>
        <GenericTask
          question={this.props.task.instruction}
          help={this.props.task.help}
          required={this.props.task.required}
        >
          <div className="standard-input full">
            <label className="answer">
              <input
                type="range"
                autoFocus={this.props.autoFocus}
                ref={ r => { this.slider = r; }}
                onChange={this.handleChange}
                max={101}
                min={1}
              />
            </label>
          </div>
        </GenericTask>
      </div>
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
SliderTask.isAnnotationComplete = (task, annotation) => annotation.value > 0;
SliderTask.propTypes = {
  task: React.PropTypes.object,
  value: React.PropTypes.node,
  onChange: React.PropTypes.func,
};

module.exports = SliderTask;
