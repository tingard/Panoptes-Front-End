import React, { Component, PropTypes } from 'react';
import ProjectCard from '../partials/project-card';

class ProjectCardList extends Component {
  componentDidMount() {
    document.documentElement.classList.add('on-secondary-page');
  }

  componentWillUnmount() {
    document.documentElement.classList.remove('on-secondary-page');
  }

  render() {
    return (
      <div className="project-card-list">
        {this.props.projects.map(project => (
          <div key={project.id}>
            <ProjectCard project={project} />
          </div>)
        )}
      </div>
    );
  }
}

ProjectCardList.propTypes = {
  projects: PropTypes.array,
};


ProjectCardList.defaultProps = {
  projects: [],
};

export default ProjectCardList;

