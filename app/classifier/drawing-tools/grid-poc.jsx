import React from 'react';
import RectangleTool from './rectangle';

const SPAWN_RAIL_SIZE = 8;

class GridPOC extends RectangleTool {
  constructor(...args) {
    super(...args);

    this.handleSpawnRailEntry = this.handleSpawnRailEntry.bind(this);
    this.handleSpawnAreaHover = this.handleSpawnAreaHover.bind(this);
    this.handleNewLine = this.handleNewLine.bind(this);

    this.state = {
      spawnType: 'rows',
      spawnPoint: NaN,
    };
  }

  handleSpawnRailEntry(event) {
    const spawnType = event.currentTarget.getAttribute('data-spawn-type');
    this.setState({ spawnType });
  }

  handleSpawnAreaHover(event) {
    let {x, y} = this.props.getEventOffset(event);
    x -= this.props.mark.x;
    y -= this.props.mark.y;

    let spawnPoint = this.state.spawnType === 'rows' ? y : x;
    spawnPoint += SPAWN_RAIL_SIZE;

    this.setState({ spawnPoint });
  }

  handleNewLine(event) {
    this.props.mark[this.state.spawnType].push(this.state.spawnPoint);
    this.props.onChange(this.props.mark);
  }

  render() {
    return (
      <g>
        <RectangleTool {...this.props} />

        <g transform={`translate(${this.props.mark.x - SPAWN_RAIL_SIZE}, ${this.props.mark.y - SPAWN_RAIL_SIZE})`} onMouseMove={this.handleSpawnAreaHover} onClick={this.handleNewLine}>
          <rect width={this.props.mark.width + SPAWN_RAIL_SIZE} height={this.props.mark.height + SPAWN_RAIL_SIZE} fill="transparent" />

          <rect x={SPAWN_RAIL_SIZE} width={this.props.mark.width} height={SPAWN_RAIL_SIZE} data-spawn-type="cols" fill={this.state.spawnType === 'rows' ? 'lime' : 'gray'} opacity="0.5" onMouseEnter={this.handleSpawnRailEntry} />
          <rect y={SPAWN_RAIL_SIZE} width={SPAWN_RAIL_SIZE} height={this.props.mark.height} data-spawn-type="rows" fill={this.state.spawnType === 'cols' ? 'lime' : 'gray'} opacity="0.5" onMouseEnter={this.handleSpawnRailEntry} />

          {this.props.mark.rows.map((rowPoint) => {
            return <line x1={SPAWN_RAIL_SIZE} y1={rowPoint} x2={this.props.mark.width + SPAWN_RAIL_SIZE} y2={rowPoint} stroke="gray" strokeWidth="4" />;
          })}

          {this.props.mark.cols.map((colPoint) => {
            return <line x1={colPoint} y1={SPAWN_RAIL_SIZE} x2={colPoint} y2={this.props.mark.height + SPAWN_RAIL_SIZE} stroke="gray" strokeWidth="4" />;
          })}

          {!isNaN(this.state.spawnPoint) && (this.state.spawnType === 'rows' ? (
            <line x1={SPAWN_RAIL_SIZE} y1={this.state.spawnPoint} x2={this.props.mark.width + SPAWN_RAIL_SIZE} y2={this.state.spawnPoint} stroke="gray" strokeWidth="2" />
          ) : (
            <line x1={this.state.spawnPoint} y1={SPAWN_RAIL_SIZE} x2={this.state.spawnPoint} y2={this.props.mark.height + SPAWN_RAIL_SIZE} stroke="gray" strokeWidth="2" />
          ))}
        </g>
      </g>
    );
  }
}

GridPOC.defaultValues = (...args) => {
  return Object.assign(RectangleTool.defaultValues(...args), {
    rows: [],
    cols: [],
  });
};

export default GridPOC;

// React = require 'react'
// DrawingToolRoot = require './root'
// DragHandle = require './drag-handle'
// Draggable = require '../../lib/draggable'
// deleteIfOutOfBounds = require './delete-if-out-of-bounds'
// DeleteButton = require './delete-button'
//
// MINIMUM_SIZE = 5
// DELETE_BUTTON_DISTANCE = 9 / 10
//
// module.exports = React.createClass
//   displayName: 'RectangleTool'
//
//   statics:
//     initCoords: null
//
//     defaultValues: ({x, y}) ->
//       x: x
//       y: y
//       width: 0
//       height: 0
//
//     initStart: ({x, y}, mark) ->
//       @initCoords = {x, y}
//       {x, y, _inProgress: true}
//
//     initMove: (cursor, mark) ->
//       if cursor.x > @initCoords.x
//         width = cursor.x - mark.x
//         x = mark.x
//       else
//         width = @initCoords.x - cursor.x
//         x = cursor.x
//
//       if cursor.y > @initCoords.y
//         height = cursor.y - mark.y
//         y = mark.y
//       else
//         height = @initCoords.y - cursor.y
//         y = cursor.y
//
//       {x, y, width, height}
//
//     initRelease: ->
//       _inProgress: false
//
//     initValid: (mark) ->
//       mark.width > MINIMUM_SIZE and mark.height > MINIMUM_SIZE
//
//   initCoords: null
//
//   render: ->
//     {x, y, width, height} = @props.mark
//
//     points = [
//       [x, y].join ','
//       [x + width, y].join ','
//       [x + width, y + height].join ','
//       [x, y + height].join ','
//       [x, y].join ','
//     ].join '\n'
//
//     <DrawingToolRoot tool={this}>
//       <Draggable onDrag={@handleMainDrag} onEnd={deleteIfOutOfBounds.bind null, this} disabled={@props.disabled}>
//         <polyline points={points} />
//       </Draggable>
//
//       {if @props.selected
//         <g>
//           <DeleteButton tool={this} x={x + (width * DELETE_BUTTON_DISTANCE)} y={y} />
//
//           <DragHandle x={x} y={y} scale={@props.scale} onDrag={@handleTopLeftDrag} onEnd={@normalizeMark} />
//           <DragHandle x={x + width} y={y} scale={@props.scale} onDrag={@handleTopRightDrag} onEnd={@normalizeMark} />
//           <DragHandle x={x +  width} y={y + height} scale={@props.scale} onDrag={@handleBottomRightDrag} onEnd={@normalizeMark} />
//           <DragHandle x={x} y={y + height} scale={@props.scale} onDrag={@handleBottomLeftDrag} onEnd={@normalizeMark} />
//         </g>}
//     </DrawingToolRoot>
//
//   handleMainDrag: (e, d) ->
//     @props.mark.x += d.x / @props.scale.horizontal
//     @props.mark.y += d.y / @props.scale.vertical
//     @props.onChange @props.mark
//
//   handleTopLeftDrag: (e, d) ->
//     @props.mark.x += d.x / @props.scale.horizontal
//     @props.mark.y += d.y / @props.scale.vertical
//     @props.mark.width -= d.x / @props.scale.horizontal
//     @props.mark.height -= d.y / @props.scale.vertical
//     @props.onChange @props.mark
//
//   handleTopRightDrag: (e, d) ->
//     @props.mark.y += d.y / @props.scale.vertical
//     @props.mark.width += d.x / @props.scale.horizontal
//     @props.mark.height -= d.y / @props.scale.vertical
//     @props.onChange @props.mark
//
//   handleBottomRightDrag: (e, d) ->
//     @props.mark.width += d.x / @props.scale.horizontal
//     @props.mark.height += d.y / @props.scale.vertical
//     @props.onChange @props.mark
//
//   handleBottomLeftDrag: (e, d) ->
//     @props.mark.x += d.x / @props.scale.horizontal
//     @props.mark.width -= d.x / @props.scale.horizontal
//     @props.mark.height += d.y / @props.scale.vertical
//     @props.onChange @props.mark
//
//   normalizeMark: ->
//     if @props.mark.width < 0
//       @props.mark.x += @props.mark.width
//       @props.mark.width *= -1
//
//     if @props.mark.height < 0
//       @props.mark.y += @props.mark.height
//       @props.mark.height *= -1
//
//     @props.onChange @props.mark
