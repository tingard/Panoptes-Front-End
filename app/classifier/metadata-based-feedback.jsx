import React from 'react';


class MetadataBasedFeedback extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isWithinTolerance: false,
    };

    this.withinAnyTolerance.bind(this);
  }

  componentDidMount() {
    if (!!this.props.classification.annotations[0].value[0].x && !!this.props.classification.annotations[0].value[0].y) {
      this.withinAnyTolerance(this.props.classification.annotations[0].value[0].x, this.props.classification.annotations[0].value[0].y);
    }
  }

  withinTolerance(userX, userY, metaX, metaY, tolerance) {
    const distance = Math.sqrt((userY - metaY) ** 2 + (userX - metaX) ** 2);
    const isWithinTolerance = distance < tolerance;
    return isWithinTolerance;
  }

  withinAnyTolerance(userX, userY) {
    for (const key of Object.keys(this.props.subject.metadata)) {
      if (key.indexOf(this.props.metaSimCoordXPattern) === 0) {
        const xKey = key;
        const metaX = parseFloat(this.props.subject.metadata[xKey]);
        const yKey = this.props.metaSimCoordYPattern + xKey.substr(2);
        const metaY = parseFloat(this.props.subject.metadata[yKey]);
        const tolKey = this.props.metaSimTolPattern + xKey.substr(2);
        const metaTol = parseFloat(this.props.subject.metadata[tolKey]);
        if (!!metaX && !!metaY && !!metaTol) {
          if (this.withinTolerance(userX, userY, metaX, metaY, metaTol)) {
            this.setState({ isWithinTolerance: true });
          }
        }
      }
    }

    return false;
  }

  render() {
    const subjectSuccessMessage = this.props.subject.metadata[this.props.metaSuccessMessageFieldName] ? this.props.subject.metadata[this.props.metaSuccessMessageFieldName] : null;
    const subjectFailureMessage = this.props.subject.metadata[this.props.metaFailureMessageFieldName] ? this.props.subject.metadata[this.props.metaFailureMessageFieldName] : null;
    const subjectClass = this.props.subject.metadata[this.props.metaTypeFieldName].toUpperCase() ? this.props.subject.metadata[this.props.metaTypeFieldName].toUpperCase() : null;
    const userMadeAnnotation = this.props.classification.annotations.length > 0 && this.props.classification.annotations[0].value.length > 0;

    if (subjectClass === this.props.dudLabel) {
      if (userMadeAnnotation === true && subjectFailureMessage) {
        return (<p>{subjectFailureMessage}</p>);
      } else if (subjectSuccessMessage) {
        return (<p>{subjectSuccessMessage}</p>);
      }
    } else if (subjectClass === this.props.simLabel) {
      if ((!userMadeAnnotation || !this.state.isWithinTolerance) && subjectFailureMessage) {
        return (<p>{subjectFailureMessage}</p>);
      } else if (subjectSuccessMessage) {
        return (<p>{subjectSuccessMessage}</p>);
      }
    } else if (subjectSuccessMessage) {
      return (<p>You classified some real data!</p>);
    }

    return (<p></p>);
  }
}

MetadataBasedFeedback.propTypes = {
  subject: React.PropTypes.object.isRequired,
  classification: React.PropTypes.classification.isRequired,
  dudLabel: React.PropTypes.string.isRequired,
  simLabel: React.PropTypes.string.isRequired,
  subjectLabel: React.PropTypes.string.isRequired,
  metaTypeFieldName: React.PropTypes.string.isRequired,
  metaSuccessMessageFieldName: React.PropTypes.string.isRequired,
  metaFailureMessageFieldName: React.PropTypes.string.isRequired,
  metaSimCoordXPattern: React.PropTypes.string.isRequired,
  metaSimCoordYPattern: React.PropTypes.string.isRequired,
  metaSimTolPattern: React.PropTypes.string.isRequired,
};

MetadataBasedFeedback.defaultProps = {
  subject: {},
  classification: {},
  dudLabel: 'DUD',
  simLabel: 'SIM',
  subjectLabel: 'SUB',
  metaTypeFieldName: '#Type',
  metaSuccessMessageFieldName: '#F_Success',
  metaFailureMessageFieldName: '#F_Fail',
  metaSimCoordXPattern: '#X',
  metaSimCoordYPattern: '#Y',
  metaSimTolPattern: '#Tol',
};

export default MetadataBasedFeedback;

