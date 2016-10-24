import counterpart from 'counterpart';
import React, { Component, PropTypes } from 'react';

import ProjectFilteringInterface from './project-filtering-interface';

counterpart.registerTranslations('en', {
  projects: {
    button: 'Get Started',
    countMessage: 'Showing %(pageStart)s-%(pageEnd)s of active %(count)s projects found.',
    notFoundMessage: 'Sorry, no projects found.',
  },
});

class ActiveProjects extends Component {
  render() {
    const { discipline, page, sort } = this.props.location.query;
    const filteringProps = { discipline, page, sort };
    return (
      <ProjectFilteringInterface status={this.props.status} {...filteringProps} onChangeQuery={this.context.updateQuery} />
    );
  }
}

ActiveProjects.contextTypes = {
  updateQuery: PropTypes.func,
};

ActiveProjects.propTypes = {
  location: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
};

ActiveProjects.defaultProps = {
  status: 'live',
};

export default ActiveProjects;
