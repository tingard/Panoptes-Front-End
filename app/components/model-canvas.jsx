import React from 'react';

/*
Process:
constructor initialises local variables and state
componentDidMount initialises the list of coordinates to render
*/

function sersic2d(coords, kwargs) {
  // grab parameters and check which are defined, otherwise provide defaults
  const params = typeof(kwargs) === 'undefined' ? {} : kwargs;
  const mu = typeof(params.mu) === 'undefined' ? [100, 100] : params.mu;
  const rEff = typeof(params.rEff) === 'undefined' ? 10 : params.rEff;
  const axRatio = typeof(params.axRatio) === 'undefined' ? 1 : params.axRatio;
  const roll = typeof(params.roll) === 'undefined' ? 0 : params.roll;
  const I0 = typeof(params.I0) === 'undefined' ? 200 : params.I0;
  const n = typeof(params.n) === 'undefined' ? 1 : params.n;

  // precalculate values where possible
  const sinRoll = Math.sin(roll);
  const cosRoll = Math.cos(roll);
  const xCorr = mu[0] - mu[0] * cosRoll + mu[1] * sinRoll;
  const yCorr = mu[1] - mu[1] * cosRoll - mu[0] * sinRoll;
  let xPrime = 0;
  let yPrime = 0;
  let weightedRadius = 1;
  // calculate sersic value at rolled coordinates
  const ret = coords.map((coord) => {
    xPrime = coord[0] * cosRoll - coord[1] * sinRoll + xCorr;
    yPrime = coord[0] * sinRoll + coord[1] * cosRoll + yCorr;
    weightedRadius = Math.sqrt(Math.pow(axRatio / rEff, 2) * Math.pow(xPrime - mu[0], 2) +
      Math.pow(yPrime - mu[1], 2) / Math.pow(rEff, 2));
    return Math.exp(Math.log(I0) - Math.pow(weightedRadius, 1 / n));
  });
  return ret;
}
function interpolate(val, y0, x0, y1, x1) {
  return (val-x0)*(y1-y0)/(x1-x0) + y0;
}
function cmapBlue(grayscale) {
  if ( grayscale < -0.33 ) return 1.0;
  else if ( grayscale < 0.33 ) return interpolate( grayscale, 1.0, -0.33, 0.0, 0.33 );
  else return 0.0;
}
function cmapGreen(grayscale) {
  if (grayscale < -1.0) return 0.0; // unexpected grayscale value
  if  (grayscale < -0.33) return interpolate( grayscale, 0.0, -1.0, 1.0, -0.33 );
  else if (grayscale < 0.33) return 1.0;
  else if (grayscale <= 1.0) return interpolate( grayscale, 1.0, 0.33, 0.0, 1.0 );
  else {
    return 1.0; // unexpected grayscale value
  }
}
function cmapRed(grayscale) {
  if (grayscale < -0.33) return 0.0;
  else if (grayscale < 0.33) return interpolate( grayscale, 0.0, -0.33, 1.0, 0.33 );
  else return 1.0;
}

class ModelCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      renderTimeoutID: null,
      modelShouldStopRendering: false,
      modelIsRendering: false,
    }

    this.oldAnnotation     = {value: []};
    this.updatedComponents = [];
    this.imageData         = null
    this.modelData         = new Uint8ClampedArray(512*512*4);
    this.differenceData    = new Uint8ClampedArray(512*512*4);
    this.componentsData    = new Array();

    this.getImageData      = this.getImageData.bind(this);
    this.modelShouldRender = this.modelShouldRender.bind(this);
    this.renderModel       = this.renderModel.bind(this);
    this.updateSubject     = this.updateSubject.bind(this);
  }

  getImageData() {
    this.imagePlaceholder.onload = (() => {
      if (typeof(this.modelCanvas) !== 'undefined') {
        const ctx = this.modelCanvas.getContext('2d');
        ctx.drawImage(this.imagePlaceholder, 0, 0);
        this.imageData = ctx.getImageData(0, 0, 512, 512);
        console.log(this.imageData);
      }
    }).bind(this);
    this.imagePlaceholder.src = this.props.subject.locations[0]['image/jpeg'];
  }
  updateBoolState(key, val) {
    (this.state[key] !== val) ? this.setState({[key]: val}) : null;
  }
  shouldComponentUpdate(nextProps, nextState) {
    // checks whether the new annotation is the same as the old annotation, and
    // only allows the component to re-render if they differ
    const o = this.oldAnnotation.value;
    const n = nextProps.classification.annotations[0].value;
    // trying to make it as fast as possible using lots of if catches, kinda
    // ugly (and a bit pointless)
    if (o.length === 0 && n.length === 0) {
      return false;
    } else if (o.length !== n.length){
      this.oldAnnotation = JSON.parse(JSON.stringify(nextProps.classification.annotations[0]));
      return true;
    } else if (JSON.stringify(o[o.length - 1]) === JSON.stringify(n[n.length - 1])) {
      return false;
    } else {
      // store the current annotation (flux means this.props is no longer the
      // old props), and the easiest way to deep copy this kind of data is
      // using JSON.parse(JSON.stringify(object))
      this.oldAnnotation = JSON.parse(JSON.stringify(nextProps.classification.annotations[0]));
      return true;
    }
  }
  componentDidMount() {
    const ctx = this.modelCanvas.getContext('2d');
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    this.coords = Array(width * height);
    let j = 0;
    let k = 0;
    for (j = 0; j < width; j++) {
      for (k = 0; k < height; k++) {
        this.coords[width * j + k] = [j, k];
      }
    }
    this.getImageData();
    console.log(this);
  }
  componentDidUpdate() {
    // TODO: Identify here which component has been updated, so we don't
    //       recalculate everything
    // we have new props, calculate the model!
    this.modelShouldRender();
  }
  modelShouldRender() {
    if (this.state.renderTimeoutID !== null) {
      clearTimeout(this.state.renderTimeoutID);
      if (this.state.modelIsRendering) {
        // the model is currently calculating. Tell it to stop, wait and try again
        this.updateBoolState('modelShouldStopRendering', true);
        setTimeout(this.modelShouldRender, 500);
      } else {
        this.updateBoolState('modelShouldStopRendering', false);
        // asynchronously start rendering the model
        this.setState({
          renderTimeoutID: setTimeout(this.renderModel, 1000),
        });
      }
    } else {
      this.setState({
        renderTimeoutID: setTimeout(this.renderModel, 200),
      });
    }
  }
  renderModel() {
    this.updateBoolState('modelIsRendering', true);
    const ctx = this.modelCanvas.getContext('2d');
    const ctxDiff = this.diffCanvas.getContext('2d');
    const addedComponents = Object.values(this.props.classification.annotations[0].value);
    var i = 0;
    var imAverage = 0;
    let comp = {};
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = 'orange';
    delete this.modelData;
    this.modelData = new Uint8ClampedArray(512*512*4);
    for (i = 0; i < addedComponents.length; i++) {
      if (this.state.modelShouldStopRendering) {
        this.updateBoolState('modelIsRendering', false);
        this.updateBoolState('modelShouldStopRendering', false);
        return;
      }
      comp = addedComponents[i];
      switch (comp.tool) {
        case 1:
          /* ctx.beginPath();
          ctx.ellipse(comp.x, comp.y, comp.rx, comp.ry, -comp.angle*Math.PI/180, 0, 2*Math.PI);
          ctx.stroke(); */
          const rEff = Math.max(comp.rx, comp.ry);
          const roll = comp.rx > comp.ry ?
            (90-comp.angle)*Math.PI/180 :
            -comp.angle*Math.PI/180;
          const p = {
            mu: [comp.y, comp.x],
            rEff: Math.max(comp.rx, comp.ry),
            roll: comp.rx > comp.ry ? (-comp.angle)*Math.PI/180 : (90-comp.angle)*Math.PI/180,
            axRatio: comp.rx > comp.ry ? comp.rx / comp.ry : comp.ry / comp.rx,
            n: comp.details[0].value===0 ? 1 : comp.details[0].value / 20,
            I0: comp.details[1].value===0 ? 200 : comp.details[1].value*2.55,
          }
          const d = sersic2d(this.coords, p);
          for (var j = 0; j < this.coords.length; j++) {
            this.modelData[4 * j] += d[j];
            this.modelData[4 * j + 1] += d[j];
            this.modelData[4 * j + 2] += d[j];
            this.modelData[4 * j + 3] += 255;
            imAverage = this.imageData.data[4 * j]/3.0 +
              this.imageData.data[4 * j + 1]/3.0 +
              this.imageData.data[4 * j + 2]/3.0;
            this.differenceData[4 * j] = (imAverage/2.0 - d[j]/2.0)+127;
            this.differenceData[4 * j + 1] = (imAverage/2.0 - d[j]/2.0)+127;
            this.differenceData[4 * j + 2] = (imAverage/2.0 - d[j]/2.0)+127;
            this.differenceData[4 * j + 3] = 255;
          }
          break;
        }
    }
    const ret = ctx.createImageData(512, 512);
    const retDiff = ctxDiff.createImageData(512, 512);
    for (i = 0; i < 512*512*4; i++) {
      ret.data[i] = Math.min(this.modelData[i], 255);
      retDiff.data[i] = Math.min(this.differenceData[i], 255);
    }
    ctx.putImageData(ret, 0, 0);
    ctxDiff.putImageData(retDiff, 0, 0);
    this.updateSubject();
    this.updateBoolState('modelIsRendering', false);
    this.updateBoolState('modelShouldStopRendering', false);
  }
  calculateScore() {
    // using the new model and the image data, calculate the new score
  }
  updateSubject() {
    if (typeof(this.modelCanvas) !== 'undefined') {
      const url = this.modelCanvas.toDataURL('image/jpeg', 0.92)
      const urlDiff = this.diffCanvas.toDataURL('image/jpeg', 0.92)
      this.props.subject.locations[1]['image/jpeg'] = url;
      this.props.subject.locations[2]['image/jpeg'] = urlDiff;
    }
    this.props.onRender(this.props.classification.annotations[0]);
  }
  render() {
    return (
      <div>
        <img src="" ref={ r => { this.imagePlaceholder = r; }} hidden/>
        <canvas ref={ r => { this.modelCanvas = r; }} width="512" height="512" hidden />
        <canvas ref={ r => { this.diffCanvas = r; }} width="512" height="512" hidden />
      </div>
    );
  }
}

ModelCanvas.propTypes = {
  classification: React.PropTypes.object.isRequired,
  subject: React.PropTypes.object.isRequired,
  onRender: React.PropTypes.func,
  workflow: React.PropTypes.object,
}

export default ModelCanvas;
