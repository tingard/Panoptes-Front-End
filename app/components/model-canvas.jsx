// let's try this again, with the new version
// TODO: How to load model components for the current project?
// This is a fallback if webgl is not available for whatever reason.

import React from 'react';

import Model from '../lib/model-component';

// http://gka.github.io/palettes/
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

const cmap = (function (c, v) {
  return 0 < v < 127 ? hexToRgb(c[parseInt(v)]) : null;
}).bind(null, [
  '#ff5555','#ff5454','#ff5353','#ff5252','#ff5150','#ff504f','#ff4f4e','#ff4f4d',
  '#ff4e4c','#ff4d4b','#ff4c49','#ff4b48','#ff4a47','#ff4946','#ff4845','#ff4744',
  '#ff4642','#ff4541','#ff4340','#ff423f','#ff413e','#ff403d','#ff3f3b','#ff3e3a',
  '#ff3d39','#ff3c38','#ff3a37','#ff3935','#ff3834','#ff3733','#ff3532','#ff3430',
  '#ff332f','#ff312e','#ff302d','#ff2e2c','#ff2d2a','#ff2b29','#ff2a28','#ff2826',
  '#ff2625','#ff2524','#ff2322','#fe2222','#fd2121','#fc2121','#fb2121','#f92020',
  '#f82020','#f71f1f','#f61f1f','#f41f1f','#f31e1e','#f21e1e','#f11d1d','#f01d1d',
  '#ee1d1d','#ed1c1c','#ec1c1c','#eb1b1b','#e91b1b','#e81b1b','#e71a1a','#e61a1a',
  '#e51919','#e31919','#e21919','#e11818','#e01818','#df1717','#dd1717','#dc1717',
  '#db1616','#da1616','#d91515','#d71515','#d61515','#d51414','#d41414','#d31313',
  '#d21313','#d01312','#cf1212','#ce1212','#cd1111','#ca1211','#c51311','#c01411',
  '#bb1511','#b61611','#b11711','#ac1711','#a61811','#a11911','#9c1911','#981911',
  '#931911','#8e1a11','#891a10','#841a10','#7f1a10','#7a1a10','#761a10','#711910',
  '#6c190f','#68190f','#63180f','#5e180e','#5a180e','#55170e','#51170d','#4c160d',
  '#48160c','#44150b','#3f140b','#3b140a','#371309','#331208','#2f1108','#2b1007',
  '#270f06','#230e05','#1f0c04','#1b0a03','#170703','#110502','#090201','#000000',
  '#040307','#08060e','#0c0913','#100c17','#120f1b','#14111f','#161423','#181527',
  '#1a172b','#1c192f','#1d1a34','#1f1c38','#211e3c','#232040','#252145','#262349',
  '#28254e','#2a2752','#2c2857','#2e2a5c','#2f2c60','#312e65','#33306a','#35316e',
  '#363373','#383578','#3a377d','#3c3982','#3e3b87','#3f3d8c','#413f91','#434196',
  '#45439b','#4644a0','#4846a5','#4a48ab','#4c4ab0','#4d4cb5','#4f4eba','#5150c0',
  '#5352c5','#5454ca','#5656cd','#5656ce','#5757cf','#5858d0','#5959d2','#5a59d3',
  '#5a5ad4','#5b5bd5','#5c5cd6','#5d5dd7','#5d5dd9','#5e5eda','#5f5fdb','#6060dc',
  '#6161dd','#6161df','#6262e0','#6363e1','#6464e2','#6565e3','#6665e5','#6666e6',
  '#6767e7','#6868e8','#6969e9','#6a69eb','#6a6aec','#6b6bed','#6c6cee','#6d6df0',
  '#6e6df1','#6e6ef2','#6f6ff3','#7070f4','#7171f6','#7272f7','#7272f8','#7373f9',
  '#7474fb','#7575fc','#7676fd','#7676fe','#7777ff','#7878ff','#7878ff','#7878ff',
  '#7979ff','#7979ff','#7a7aff','#7a7aff','#7b7aff','#7b7bff','#7b7bff','#7c7cff',
  '#7c7cff','#7d7cff','#7d7dff','#7d7dff','#7e7eff','#7e7eff','#7f7eff','#7f7fff',
  '#7f7fff','#8080ff','#8080ff','#8180ff','#8181ff','#8181ff','#8282ff','#8282ff',
  '#8382ff','#8383ff','#8383ff','#8484ff','#8484ff','#8584ff','#8585ff','#8585ff',
  '#8686ff','#8686ff','#8686ff','#8787ff','#8787ff','#8888ff','#8888ff',
]);

class ModelCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.width = 512;
    this.height = 512;
    const pixelCount = 512 * 512
    this.imageData = null
    this.modelData = new Uint8ClampedArray(pixelCount * 4);
    this.differenceData = new Uint8ClampedArray(pixelCount * 4);
    this.coloredDifferenceData = new Uint8ClampedArray(pixelCount * 4)
    this.oldAnnotation = {value: []};
    this.renderTimeoutID = null;
    for (let i = 0; i < pixelCount * 4; i++) {
      this.modelData[i] = 0;
      this.differenceData[i] = 0;
      this.coloredDifferenceData[i] = 0;
    }
    this.coords = Array();
    for (let j = 0; j < this.width; j++) {
      for (let k = 0; k < this.height; k++) {
        this.coords[this.width * j + k] = [j, k];
      }
    }
    this.componentDidMount = this.componentDidMount.bind(this);
    this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.getImageData = this.getImageData.bind(this);
    this.renderModel = this.renderModel.bind(this);
    this.updateSubject = this.updateSubject.bind(this);
  }
  componentDidMount() {
    const ctx = this.modelCanvas.getContext('2d');
    this.imagePlaceholder.onload = this.getImageData;
    this.imagePlaceholder.src = this.props.subject.locations[0]['image/jpeg'];
  }

  shouldComponentUpdate(nextProps, nextState) {
    const o = this.oldAnnotation.value;
    const n = nextProps.classification.annotations[0].value;
    if (JSON.stringify(o[o.length - 1]) === JSON.stringify(n[n.length - 1])) {
      return false;
    } else {
      // store the current annotation (flux means this.props is no longer the
      // old props), and the easiest way to deep copy this kind of data is
      // using JSON.parse(JSON.stringify(object))
      this.oldAnnotation = JSON.parse(JSON.stringify(nextProps.classification.annotations[0]));
      return true;
    }
  }
  componentDidUpdate() {
    // TODO: Identify here which component has been updated, so we don't
    //       recalculate everything
    // we have new props, calculate the model!
    if (this.renderTimeoutID === null) {
      this.renderTimeoutID = window.setTimeout(this.renderModel, 10);
    } else {
      clearTimeout(this.renderTimeoutID);
      this.renderTimeoutID = window.setTimeout(this.renderModel, 200);
    }
  }
  getImageData() {
    // get the subject image data as an RGBA array
    if (typeof(this.modelCanvas) !== 'undefined') {
      const ctx = this.modelCanvas.getContext('2d');
      ctx.drawImage(this.imagePlaceholder, 0, 0);
      this.imageData = ctx.getImageData(0, 0, this.width, this.height);
    }
  }
  renderModel() {
    if (this.imageData === null) return;
    let k = 0;
    const res = Model(this.props.classification.annotations, this.coords);
    const pixelCount = res.model.length;
    const filteredCount = res.ignored.length;
    for (let i = 0, imAv = 0; i < pixelCount; i++) {
      this.modelData[4 * i] = res.model[i];
      this.modelData[4 * i + 1] = res.model[i];
      this.modelData[4 * i + 2] = res.model[i];
      this.modelData[4 * i + 3] = 255;
      imAv = this.imageData.data[4*i]/6 + this.imageData.data[4*i+1]/6 + this.imageData.data[4*i+2]/6
      this.differenceData[4 * i] = 127 + imAv - res.model[i]/2;
      this.differenceData[4 * i + 1] = 127 + imAv - res.model[i]/2;
      this.differenceData[4 * i + 2] = 127 + imAv - res.model[i]/2;
      this.differenceData[4 * i + 3] = 255;
    }
    for (let i = 0; i < filteredCount; i++) {
      k = 4 * (res.ignored[i][0] * this.width + res.ignored[i][1]);
      this.modelData[k] = 127;
      this.modelData[k + 1] = 255;
      this.modelData[k + 2] = 127;
      this.differenceData[k] = 127;
      this.differenceData[k + 1] = 127;
      this.differenceData[k + 2] = 127;
    }
    const ret = new ImageData(this.modelData, 512, 512);
    let c = [];
    for (let i = 0; i < 512*512; i++) {
      c = cmap(this.differenceData[4*i])
      this.coloredDifferenceData[4*i] = c[0]
      this.coloredDifferenceData[4*i + 1] = c[1]
      this.coloredDifferenceData[4*i + 2] = c[2]
      this.coloredDifferenceData[4*i + 3] = 255
    }
    const retDiff = new ImageData(this.coloredDifferenceData, 512, 512);
    const ctx = this.modelCanvas.getContext('2d');
    const ctxDiff = this.diffCanvas.getContext('2d');
    ctx.putImageData(ret, 0, 0);
    ctxDiff.putImageData(retDiff, 0, 0);
    requestAnimationFrame(this.updateSubject);
    this.calculateScore();
  }
  calculateScore() {
    /* using the new model and the image data, calculate the new score
    this is given by (formatted in LaTeX)
    S = 100\exp{\left\{-\left(2k + \Sigma\frac{(x_i - x)^2}{\sigma^2}^2\right)/B\right\}}
    TODO: accept different ways of scoring, in same place as model?
          and should it be done here?
    */
    const numPixels = this.width * this.height; // this is unnecessary for now
    const numParameters = 20;
    let AIC = 2 * numParameters;
    // choose B, TODO: set B intelligently (i.e. depending on noisiness of image?)
    const B = 20000;
    const stdev = 255; // choose stdev to weight importance of parameter count
    for (let i = 0; i < numPixels; i++) {
      AIC += Math.pow(this.differenceData[4 * i] - 127, 2) / Math.pow(stdev, 2);
    }
    const score = 100 * Math.exp(-Math.pow(AIC, 2) / B);
    this.props.workflow.configuration.metadata.modelScore = score;
  }
  updateSubject() {
    if (typeof(this.modelCanvas) !== 'undefined') {
      const url = this.modelCanvas.toDataURL('image/jpeg', 0.92)
      const urlDiff = this.diffCanvas.toDataURL('image/jpeg', 0.92)
      this.props.subject.locations[1]['image/jpeg'] = url;
      this.props.subject.locations[2]['image/jpeg'] = urlDiff;
    }
    setTimeout(() => this.props.onRender(this.props.classification.annotations[0]), 10);
  }
  render() {
    return (
      <div>
        <img src="" ref={ r => { this.imagePlaceholder = r; }} hidden/>
        <canvas ref={ r => { this.modelCanvas = r; }} width={this.width} height={this.height} hidden='true' />
        <canvas ref={ r => { this.diffCanvas = r; }} width={this.width} height={this.height} hidden='true' />
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
