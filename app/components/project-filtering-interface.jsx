import React, { Component, PropTypes } from 'react';
import apiClient from 'panoptes-client/lib/api-client';
import Translate from 'react-translate-component';

import ProjectCardList from '../components/project-card-list';
import DisciplineSelector from '../components/projects-discipline-selector';
import SearchSelector from '../components/projects-search-selector';
import SortSelector from '../components/projects-sort-selector';
import PageSelector from '../components/projects-page-selector';

class ProjectFilteringInterface extends Component {
  constructor(props) {
    super(props);
    this.handleDisciplineChange = this.handleDisciplineChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSortChange = this.handleSortChange.bind(this);
    this.loadProjects = this.loadProjects.bind(this);
    this.renderCounter = this.renderCounter.bind(this);
    this.renderPageSelector = this.renderPageSelector.bind(this);
    this.state = {
      error: null,
      loading: false,
      projects: [],
      pages: 0,
      projectCount: 0,
      query: {},
    };
  }

  componentDidMount() {
    const { discipline, page, sort } = this.props;
    this.loadProjects(discipline, page, sort);
  }

  componentWillReceiveProps(nextProps) {
    const { discipline, page, sort } = nextProps;
    console.log(discipline !== this.props.discipline,  page !== this.props.page, sort !== this.props.sort)
    if (discipline !== this.props.discipline ||
        page !== this.props.page ||
        sort !== this.props.sort) {
      this.loadProjects(discipline, page, sort);
    }
  }

  loadProjects(discipline, page, sort) {
    this.setState({
      error: null,
      loading: true,
    });
    const query = {
      tags: discipline || undefined,
      page,
      sort: sort || this.props.sort,
      launch_approved: !apiClient.params.admin ? true : null,
      cards: true,
      include: ['avatar'],
    };
    if (!query.tags) {
      delete query.tags;
    }
    apiClient.type('projects').get(query)
      .then(projects => {
        if (projects.length > 0) {
          const pages = (projects[0] !== null && projects[0].getMeta() !== null)
          ? projects[0].getMeta().page_count
          : 0;
          const projectCount = (projects[0] !== null && projects[0].getMeta() !== null)
          ? projects[0].getMeta().count
          : 0;
          this.setState({ projects, pages, projectCount });
        } else {
          this.setState({ projects: [], pages: 0, projectCount: 0 });
        }

      })
      .catch(error => {
        this.setState({ error });
      })
      .then(() => {
        this.setState({ loading: false });
      });
  }

  handleDisciplineChange(discipline) {
    const page = 1;
    this.props.onChangeQuery({ discipline, page });
  }

  handleSortChange(sort) {
    const page = 1;
    this.props.onChangeQuery({ sort, page });
  }

  handlePageChange(page) {
    this.props.onChangeQuery({ page });
  }

  renderCounter() {
    let showingMessage = '';
    let pageStart = null;
    let pageEnd = null;
    if (this.state.projectCount > 0) {
      pageStart = this.props.page * 20 - 20 + 1;
      pageEnd = Math.min(this.props.page * 20, this.state.projectCount);
      showingMessage = 'projectsPage.countMessage';
    } else {
      showingMessage = 'projectsPage.notFoundMessage';
    }
    return (
      <p className="showing-projects">
        <Translate
          pageStart={pageStart}
          pageEnd={pageEnd}
          count={this.state.projectCount}
          content={showingMessage}
        />
      </p>
    );
  }

  renderPageSelector() {
    const { page } = this.props;
    return (
      (this.state.pages > 1)
      ? <PageSelector current={+page} total={this.state.pages} onChange={this.handlePageChange.bind(this)} />
      : null
    );
  }

  render() {
    const { discipline, sort } = this.props;
    return (
      <div className="secondary-page all-resources-page">
        <section className="hero projects-hero">
          <div className="hero-container">
            <Translate component="h1" content={'projectsPage.title'} />
          </div>
        </section>
        <section className="resources-container">
          <DisciplineSelector
            value={discipline}
            onChange={this.handleDisciplineChange.bind(this)}
          />
          <div className="resource-results-counter">
            <SearchSelector />
            <SortSelector value={sort} onChange={this.handleSortChange.bind(this)} />
          </div>
          {this.renderCounter()}
          {this.renderPageSelector()}
          <ProjectCardList projects={this.state.projects} />
          {this.renderPageSelector()}
        </section>
      </div>
    );
  }
}

ProjectFilteringInterface.propTypes = {
  discipline: PropTypes.string.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  page: PropTypes.string.isRequired,
  sort: PropTypes.string.isRequired,
};

ProjectFilteringInterface.defaultProps = {
  discipline: '',
  page: 1,
  sort: '-launch_date',
};

export default ProjectFilteringInterface;
