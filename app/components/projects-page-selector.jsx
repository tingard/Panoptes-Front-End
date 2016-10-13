import React, { Component, PropTypes } from 'react';

class PageSelector extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.renderPageButtons = this.renderPageButtons.bind(this);
  }

  handleChange(page) {
    this.props.onChange(page);
  }

  renderPageButtons(current, total) {
    return (
      <div>
        {(total > 1)
        ? [...Array(total).keys()].map((page, i) => {
          const active = page === +current;
          return (
            <button
              onClick={this.handleChange.bind(this, page)}
              key={i}
              className="pill-button"
              style={{ border: active ? '2px solid' : 'none' }}
            >
              {page}
            </button>);
        })
        : null}
      </div>
    );
  }

  render() {
    const { current, total } = this.props;
    return (
      <nav className="pagination">
        {this.renderPageButtons(current, total)}
      </nav>
    );
  }
}

PageSelector.propTypes = {
  current: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired,
};

PageSelector.defaultProps = {
  current: '1',
  total: 0,
};

export default PageSelector;
