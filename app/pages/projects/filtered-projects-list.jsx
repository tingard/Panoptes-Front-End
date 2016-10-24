import counterpart from 'counterpart';
import React, { Component, PropTypes } from 'react';

import ProjectFilteringInterface from './project-filtering-interface';

counterpart.registerTranslations('en', {
  projects: {
    button: 'Get Started',
    countMessage: 'Showing %(pageStart)s-%(pageEnd)s of %(count)s projects found.',
    notFoundMessage: 'Sorry, no projects found.',
  },
});

class FilteredProjectsList extends Component {
  render() {
    console.info(this.props.route)
    const { discipline, page, sort } = this.props.location.query;
    const filteringProps = { discipline, page, sort };
    return (
      <ProjectFilteringInterface 
        status={this.props.route.status} 
        onChangeQuery={this.context.updateQuery}
        {...filteringProps} 
      />
    );
  }
}

FilteredProjectsList.contextTypes = {
  updateQuery: PropTypes.func,
};

FilteredProjectsList.propTypes = {
  location: PropTypes.object.isRequired,
  // add route.status
};

export default FilteredProjectsList;
