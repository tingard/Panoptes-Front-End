React = require 'react'
TitleMixin = require '../../lib/title-mixin'
{Markdown} = require 'markdownz'

module.exports = React.createClass
  displayName: 'CustomPage'

  mixins: [TitleMixin]

  title: ->
    @state.page?.title ? '(Loading)'

  getInitialState: ->
    loading: false
    page: null

  componentDidMount: ->
    @fetchPage @props.params.urlKey

  componentWillReceiveProps: (nextProps) ->
    if nextProps.params.urlKey isnt @props.params.urlKey
      @fetchPage nextProps.params.urlKey

  fetchPage: (urlKey) ->
    @setState loading: true
    @props.project.get('pages', url_key: urlKey).then ([page]) =>
      @setState
        page: page
        loading: false

  render: ->
    <div className="project-text-content content-container">
      {if @state.loading
        <p>Loading...</p>
      else if @state.page?
        <Markdown project={@props.project} className="column">{@state.page.content}</Markdown>
      else
        <p>Not found. :(</p>}
    </div>
