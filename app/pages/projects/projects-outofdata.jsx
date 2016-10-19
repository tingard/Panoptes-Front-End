import counterpart from 'counterpart';
import React, { Component, PropTypes } from 'react';

import ProjectFilteringInterface from '../../components/project-filtering-interface';

counterpart.registerTranslations('en', {
  projects: {
    button: 'Get Started',
    countMessage: 'Showing %(pageStart)s-%(pageEnd)s of %(count)s projects found.',
    notFoundMessage: 'Sorry, no projects found.',
  },
});

class PausedProjects extends Component {
  render() {
    const { discipline, page, sort } = this.props.location.query;
    const filteringProps = { discipline, page, sort };
    return (
      <ProjectFilteringInterface status={this.props.status} {...filteringProps} onChangeQuery={this.context.updateQuery} />
    );
  }
}

PausedProjects.contextTypes = {
  updateQuery: PropTypes.func,
};

PausedProjects.propTypes = {
  location: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
};

PausedProjects.defaultProps = {
  status: 'paused',
};

export default PausedProjects;
