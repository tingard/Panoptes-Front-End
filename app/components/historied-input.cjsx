React = require 'react'
ReactDOM = require 'react-dom'

UP_KEY = 38
DOWN_KEY = 40
BACKSPACE_KEY = 8
FORWARD_DELETE_KEY = 46

LOCAL_STORAGE_PREFIX = 'historied-input-values/'


HistoriedInput = React.createClass
  statics:
    get: (historyID) ->
      JSON.parse(localStorage.getItem LOCAL_STORAGE_PREFIX + historyID) ? []

    set: (historyID, history) ->
      localStorage.setItem LOCAL_STORAGE_PREFIX + historyID, JSON.stringify history

    add: (historyID, value) ->
      HistoriedInput.remove historyID, value
      history = HistoriedInput.get historyID
      history.push value
      HistoriedInput.set historyID, history

    remove: (historyID, value) ->
      history = HistoriedInput.get historyID
      existingIndex = history.indexOf value
      if existingIndex isnt -1
        history.splice existingIndex, 1
      HistoriedInput.set historyID, history


  getDefaultProps: ->
    tag: 'input'
    historyID: '(unspecified)'
    onKeyDown: ->
    onChange: ->

  handleKeyDown: (e) ->
    @props.onKeyDown arguments...

    if not e.defaultPrevented
      selectionAtStart = e.target.selectionStart is 0
      selectionAtEnd = e.target.selectionEnd is e.target.value.length
      allSelected = selectionAtStart and selectionAtEnd

      if allSelected and e.altKey and e.which in [BACKSPACE_KEY, FORWARD_DELETE_KEY]
        @removeFromHistory e.target.value

      else if selectionAtEnd and e.which in [UP_KEY, DOWN_KEY]
        e.preventDefault()

        prefix = e.target.value[...e.target.selectionStart]
        matchesFromHistory = HistoriedInput.get(@props.historyID).filter (value) ->
          value.indexOf(prefix) is 0

        # Give the user a spot without a suggestion.
        matchesFromHistory.push ''

        currentIndex = matchesFromHistory.indexOf e.target.value

        newIndex = if e.which is UP_KEY
          currentIndex - 1
        else if e.which is DOWN_KEY
          currentIndex + 1
        newIndex %%= matchesFromHistory.length

        suggestion = matchesFromHistory[newIndex][e.target.selectionStart...]

        @setSuggestion prefix, suggestion

  removeFromHistory: (value) ->
    HistoriedInput.remove @props.historyID, value

  setSuggestion: (prefix, suggestion) ->
    value = prefix + suggestion

    # Assuming `@props.onChange` will set `@props.value`,
    # I don't feel too bad about setting the value manually.

    input = ReactDOM.findDOMNode this
    Object.assign input,
      value: value
      selectionStart: prefix.length
      selectionEnd: value.length

    @props.onChange value

  handleChange: (e) ->
    @props.onChange e.target.value

  render: ->
    props = Object.assign {}, @props,
      onKeyDown: @handleKeyDown
      onChange: @handleChange

    React.createElement @props.tag, props, @props.children


if process.env.NODE_ENV isnt 'production'
  HistoriedInput.set HistoriedInput.defaultProps.historyID, [
    'apple'
    'avacado'
    'banana'
    'bandana'
    'cherry'
    'date'
    'egg'
    'eggplant'
    'eel'
    'fig'
    'goop/slime'
    'gooseberry'
    'goji berry'
  ]

module.exports = HistoriedInput
