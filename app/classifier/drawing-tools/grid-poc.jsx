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
