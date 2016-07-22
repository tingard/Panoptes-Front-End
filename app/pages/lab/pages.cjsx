React = require 'react'
projectPageActions = require './actions/project-pages'
{Link} = require 'react-router'
{Dialog} = require 'modal-form'
{MarkdownEditor} = require 'markdownz'

NavigationEditor = React.createClass
  getDefaultProps: ->
    pages: []
    onSelect: ->
    onCreate: ->
    onDelete: ->

  promptCreation: ->
    @props.onCreate
      title: prompt 'What shall we call this new page?'

  confirmDeletion: (pageID, pageTitle) ->
    if confirm "Really delete the page “#{pageTitle}”?"
      @props.onDelete pageID

  render: ->
    <div>
      <ul>
        {@props.pages.map (page) =>
          <li key={page.id}>
            <button type="button" onClick={@props.onSelect.bind null, page.id}>{page.title}</button>
            <button type="button" onClick={@confirmDeletion.bind this, page.id, page.title}>&times;</button>
          </li>}
      </ul>
      <button type="button" onClick={@promptCreation}>Add a page</button>
    </div>


PageEditor = React.createClass
  getDefaultProps: ->
    title: ''
    content: ''

  render: ->
    <div>
      <div>
        <label>
          <span className="form-label">Page title</span><br />
          <input type="text" ref="titleInput" className="standard-input full" defaultValue={@props.title} />
        </label>
      </div>
      <div>
        <span className="form-label">Content</span><br />
        <MarkdownEditor ref="contentInput" defaultValue={@props.content} rows={15} cols={80} />
      </div>
    </div>

  getValue: ->
    title: @refs.titleInput.value
    content: @refs.contentInput.value


PagesList = React.createClass
  getDefaultProps: ->
    project: null
    actions: projectPageActions

  getInitialState: ->
    loading: false
    pages: []
    editing: ''

  componentDidMount: ->
    @loadPagesForProject @props.project

  componentWillReceiveProps: (nextProps) ->
    unless nextProps.project is @props.project
      @loadPagesForProject nextProps.project

  loadPagesForProject: (project) ->
    @selectPage ''

    @setState
      loading: true

    @props.actions.fetchPagesForProject(project.id).then (pages) =>
      @setState
        pages: pages
        loading: false

  selectPage: (pageID) ->
    @setState editing: pageID

  handlePageCreation: (pageData) ->
    @props.actions.createPageForProject @props.project.id, pageData
      .then =>
        @loadPagesForProject @props.project

  handlePageUpdate: (pageID) ->
    @selectPage ''
    data = @refs.pageEditor.getValue()
    @props.actions.updatePage pageID, data
      .then =>
        @loadPagesForProject @props.project

  handlePageDeletion: (pageID) ->
    @props.actions.deletePage pageID
      .then =>
        @loadPagesForProject @props.project

  render: ->
    pageBeingEdited = @state.pages.find (page) =>
      page.id is @state.editing

    <div>
      <div className="form-label">Navigation</div>
      <NavigationEditor
        pages={@state.pages}
        onSelect={@selectPage}
        onCreate={@handlePageCreation}
        onDelete={@handlePageDeletion}
      />

      {if pageBeingEdited?
        <Dialog required onSubmit={@handlePageUpdate.bind this, pageBeingEdited.id} onCancel={@selectPage.bind this, ''}>
          <PageEditor ref="pageEditor" title={pageBeingEdited.title} content={pageBeingEdited.content} />
          <p style={textAlign: 'center'}>
            <button type="button" className="minor-button" onClick={@selectPage.bind this, ''}>Cancel</button>{' '}
            <button type="submit" className="major-button">Save</button>
          </p>
        </Dialog>}
    </div>

module.exports = PagesList
