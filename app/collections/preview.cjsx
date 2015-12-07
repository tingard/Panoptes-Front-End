React = require 'react'
{Link} = require '@edpaget/react-router'
apiClient = require '../api/client'
Loading = require '../components/loading-indicator'
Thumbnail = require '../components/thumbnail'
Avatar = require '../partials/avatar'
getSubjectLocation = require '../lib/get-subject-location'

module?.exports = React.createClass
  displayName: 'CollectionPreview'

  componentWillMount: ->
    @getCollections()

  getInitialState: ->
    subjects: null
    owner: null

  getCollections: ->
    query =
      collection_id: @props.collection.id
      page_size: 3

    @props.collection.get('owner').then (owner) =>
      @setState {owner}

    apiClient.type('subjects').get(query).then (subjects) =>
      @setState {subjects}

  collectionParams: ->
    [owner, name] = @props.collection.slug.split('/')
    {owner, name}

  render: ->
    <div className="collection-preview">
      <div className="collection">
        <p className="title">
          <Link to="collection-show" params={@collectionParams()}>
            {@props.collection.display_name}
          </Link>
          {' '}by{' '}
          {if @state.owner
            <Link className="user-profile-link" to="user-profile" params={name: @state.owner.login}>
              <Avatar user={@state.owner} />{' '}{@state.owner.display_name}
            </Link>}
        </p>
        <div className="subject-previews">
          {if @state.subjects
            <div>
              {for subject in @state.subjects
                <Thumbnail
                  key={"collection-preview-#{@props.collection.id}-#{subject.id}"}
                  src={getSubjectLocation(subject).src}
                  width={100} />}
            </div>
          else
            <Loading />}
        </div>
      </div>
    </div>