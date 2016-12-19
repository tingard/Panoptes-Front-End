import React from 'react';
import GenericTaskEditor from '../generic-editor';
import GenericTask from '../generic';

class ModelFitTask extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(newAnnotation) {
    // trigger a re-render here, and save to metadata if  needs be
    console.log(newAnnotation);
    this.props.onChange(newAnnotation);
  }
  render() {
    return (
      <GenericTask {...this.props} onChange={this.handleChange }>
        Hello!
      </GenericTask>
    );
  }
}
ModelFitTask.getDefaultAnnotation = () => ({});
ModelFitTask.Editor = GenericTaskEditor;
export default ModelFitTask;
