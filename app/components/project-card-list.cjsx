React = require('react')
apiClient = require 'panoptes-client/lib/api-client'
Select = require 'react-select'

Translate = require 'react-translate-component'

`import { PROJECT_SORTS } from '../lib/project-sorts';`
`import ProjectCardList from '../components/new-project-card-list';`
`import DisciplineSelector from '../components/projects-discipline-selector';`
`import SearchSelector from '../components/projects-search-selector';`
`import SortSelector from '../components/projects-sort-selector';`
`import PageSelector from '../components/projects-page-selector';`

ProjectFilteringInterface = React.createClass
  displayName: 'ProjectFilteringInterface'
  getDefaultProps: ->
    discipline: ''
    page: 1
    sort: '-launch_date'

    # To separate the API from the UI (and present the user with more friendly query terms):
    SORT_QUERY_VALUES:
      'active': '-last_modified'
      'inactive': 'last_modified'

  getInitialState: ->
    projects: []
    pages: 0
    project_count: 0
    loading: false
    error: null
    query: {}

  componentDidMount: ->
    {discipline, page, sort} = @props
    @loadProjects {discipline, page, sort}

  componentWillReceiveProps: (nextProps) ->
    {discipline, page, sort} = nextProps
    if discipline isnt @props.discipline or page isnt @props.page or sort isnt @props.sort
      @loadProjects {discipline, page, sort}

  loadProjects: ({discipline, page, sort}) ->
    @setState
      loading: true
      error: null

    query =
      tags: discipline || undefined
      page: page
      sort: sort ? @constructor.defaultProps.sort
      launch_approved: true unless apiClient.params.admin
      cards: true
      include: ['avatar']

    unless !!query.tags
      delete query.tags

    apiClient.type('projects').get(query)
      .then (projects) =>
        pages = projects[0]?.getMeta()?.page_count
        pages ?= 0
        project_count = projects[0]?.getMeta()?.count
        project_count ?= 0
        @setState {projects, pages, project_count}
      .catch (error) =>
        @setState {error}
      .then =>
        @setState loading: false

  handleDisciplineChange: (discipline) ->
    page = 1
    this.props.onChangeQuery {discipline, page}

  handleSortChange: (sort) ->
    page = 1
    this.props.onChangeQuery {sort, page}

  handlePageChange: (page) ->
    this.props.onChangeQuery {page}

  setFilter: (e) ->

  render: ->
    <div className="secondary-page all-resources-page">

      <section className="hero projects-hero">
        <div className="hero-container">
          <Translate component="h1" content={"projectsPage.title"} />
        </div>
      </section>

      <section className="resources-container">
        <DisciplineSelector value={@props.discipline} onChange={@handleDisciplineChange} />
        <div className="resource-results-counter">
          <SearchSelector />
          <SortSelector value={@props.sort} onChange={@handleSortChange} />
        </div>
        {if @state.project_count>0
           pageStart = @props.page * 20 - 20 + 1
           pageEnd = Math.min(@props.page * 20, @state.project_count)
           showingMessage = "projectsPage.countMessage"
         else
           showingMessage = "projectsPage.notFoundMessage"
        <p className="showing-projects"><Translate pageStart={pageStart} pageEnd={pageEnd} count={@state.project_count} content={showingMessage} /></p>}
        {if @state.pages>1
           <PageSelector current={+@props.page} total={@state.pages} onChange={@handlePageChange} />}

        <ProjectCardList projects={@state.projects} />

        {if @state.pages>1
           <PageSelector current={+@props.page} total={@state.pages} onChange={@handlePageChange} />}

      </section>

    </div>

module.exports =
  ProjectFilteringInterface: ProjectFilteringInterface
