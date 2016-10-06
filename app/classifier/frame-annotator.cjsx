React = require 'react'
SVGImage = require '../components/svg-image'
Draggable = require '../lib/draggable'
tasks = require './tasks'
seenThisSession = require '../lib/seen-this-session'
getSubjectLocation = require '../lib/get-subject-location'
WarningBanner = require './warning-banner'
ModifiedImage = require '../components/modified-image'

module.exports = React.createClass
  displayName: 'FrameAnnotator'

  getDefaultProps: ->
    user: null
    project: null
    subject: null
    workflow: null
    classification: null
    annotation: null
    onLoad: Function.prototype
    frame: 0
    onChange: Function.prototype

  getInitialState: ->
    alreadySeen: false
    showWarning: false
    aggregations: null

  componentDidMount: ->
    @getAggregations()
    @setState alreadySeen: @props.subject.already_seen or seenThisSession.check @props.workflow, @props.subject

  getAggregations: ->
    zooAPI.type('aggregations').get(workflow_id: 2661, admin: true).then (res) =>
      @setState aggregations: res[0].aggregation.T0['rectangle clusters'][0]['cluster members']

  componentWillReceiveProps: (nextProps) ->
    if nextProps.annotation isnt @props.annotation
      @handleAnnotationChange @props.annotation, nextProps.annotation

  handleAnnotationChange: (oldAnnotation, currentAnnotation) ->
    if oldAnnotation?
      lastTask = @props.workflow.tasks[oldAnnotation.task]
      LastTaskComponent = tasks[lastTask.type]
      if LastTaskComponent.onLeaveAnnotation?
        LastTaskComponent.onLeaveAnnotation lastTask, oldAnnotation

  getSizeRect: ->
    clientRect = @refs.sizeRect?.getBoundingClientRect() # Read only
    return null unless clientRect?
    {left, right, top, bottom, width, height} = clientRect
    left += pageXOffset
    right += pageXOffset
    top += pageYOffset
    bottom += pageYOffset
    {left, right, top, bottom, width, height}

  getScale: ->
    sizeRect = @getSizeRect()
    horizontal = sizeRect?.width / @props.naturalWidth || 0
    vertical = sizeRect?.height / @props.naturalHeight || 0
    {horizontal, vertical}

  getEventOffset: (e) ->
    scale = @getScale()
    sizeRect = @getSizeRect()
    x = (e.pageX - sizeRect?.left) / scale.horizontal || 0
    y = (e.pageY - sizeRect?.top) / scale.vertical || 0
    {x, y}

  renderAggregatedRectangles: ->
    return unless @state.aggregations?
    # console.log 'AGGREGATIONS: ', @state.aggregations

    for aggregation in @state.aggregations
      console.log '  AGGREGATION: ', aggregation
      p1 = aggregation[0]
      p2 = aggregation[1]
      p3 = aggregation[2]
      p4 = aggregation[3]
      wid = Math.abs( p1[0] - p4[0] )
      hei = Math.abs( p1[1] - p2[1] )

      console.log 'WID HEI = ', wid, hei
      <rect fill='transparent' stroke='red' strokeWidth='2px' x={p1[0]} y={p2[1]}, width={wid}, height={hei} />

  render: ->
    taskDescription = @props.workflow.tasks[@props.annotation?.task]
    TaskComponent = tasks[taskDescription?.type]

    {type, format, src} = getSubjectLocation @props.subject, @props.frame

    createdViewBox = "#{@props.viewBoxDimensions.x} #{@props.viewBoxDimensions.y} #{@props.viewBoxDimensions.width} #{@props.viewBoxDimensions.height}"

    svgStyle = {}
    if type is 'image' and not @props.loading
      # Images are rendered again within the SVG itself.
      # When cropped right next to the edge of the image,
      # the original tag can show through, so fill the SVG to cover it.
      svgStyle.background = 'black'

    svgProps = {}

    if TaskComponent?
      {BeforeSubject, InsideSubject, AfterSubject} = TaskComponent

    hookProps =
      taskTypes: tasks
      workflow: @props.workflow
      task: taskDescription
      classification: @props.classification
      annotation: @props.annotation
      frame: @props.frame
      scale: @getScale()
      naturalWidth: @props.naturalWidth
      naturalHeight: @props.naturalHeight
      containerRect: @getSizeRect()
      getEventOffset: this.getEventOffset
      onChange: @props.onChange
      preferences: @props.preferences

    for task, Component of tasks when Component.getSVGProps?
      for key, value of Component.getSVGProps hookProps
        svgProps[key] = value

    <div className="frame-annotator">
      <div className="subject-area">
        {if BeforeSubject?
          <BeforeSubject {...hookProps} />}
        <svg className="subject" style=svgStyle viewBox={createdViewBox} {...svgProps}>
          <rect ref="sizeRect" width={@props.naturalWidth} height={@props.naturalHeight} fill="rgba(0, 0, 0, 0.01)" fillOpacity="0.01" stroke="none" />
          {if type is 'image' and @props.modification
            <Draggable onDrag={@props.panByDrag} disabled={@props.disabled}>
              <ModifiedImage className={"pan-active" if @props.panEnabled} src={src} modification={@props.modification} width={@props.naturalWidth} height={@props.naturalHeight}/>
            </Draggable>
          else if type is 'image'
            <Draggable onDrag={@props.panByDrag} disabled={@props.disabled}>
              <SVGImage className={"pan-active" if @props.panEnabled} src={src} width={@props.naturalWidth} height={@props.naturalHeight} />
            </Draggable>
          }

          {@renderAggregatedRectangles()}

          {if InsideSubject? && !@props.panEnabled
            <InsideSubject {...hookProps} />}

          {for anyTaskName, {PersistInsideSubject} of tasks when PersistInsideSubject?
            <PersistInsideSubject key={anyTaskName} {...hookProps} />}
        </svg>
        {@props.children}
        {if @state.alreadySeen
          <WarningBanner label="Already seen!">
            <p>Our records show that you’ve already seen this image. We might have run out of data for you in this workflow!</p>
            <p>Try choosing a different workflow or contributing to a different project.</p>
          </WarningBanner>

        else if @props.subject.retired
          <WarningBanner label="Finished!">
            <p>This subject already has enough classifications, so yours won’t be used in its analysis!</p>
            <p>If you’re looking to help, try choosing a different workflow or contributing to a different project.</p>
          </WarningBanner>
        }

        {if AfterSubject?
          <AfterSubject {...hookProps} />}
      </div>
    </div>
