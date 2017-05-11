import React from 'react';
import reglBase from 'regl';
import { model, bgRegl } from '../lib/webgl-model-component';

// helper function that checks whether a variable is defined
function isVar(v) {
  return typeof(v) !== "undefined"
}

// function to check whether webgl is available
function webGLCompatibilityTest() {
    try {
        return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
    } catch(e) {
        return false;
    }
}

// function to parse an annotation for a specific model, uses the model's map
// property to return an object of key: values to be passed to rendering funcs
function parseCls(model, annotation) {
  let renderFunctions = [];
  // cycle through each task
  for (let i = 0; i < annotation.length; i++) {
    // did we get a drawn on component?
    if (annotation[i].value[0].value.length > 0) {
      // get position values
      const componentType = annotation[i].task
      const parameters = [];
      if (isVar(annotation[i].value[0].value[0].x)) {
        // have we got an object centre?
        parameters.push(annotation[i].value[0].value[0].x);
        parameters.push(this.state.imageSize[0] - annotation[i].value[0].value[0].y);
      }
      if (isVar(annotation[i].value[0].value[0].r)) {
        // radius => circle or triangle
        parameters.push(parseFloat(annotation[i].value[0].value[0].r))
      } else if (isVar(annotation[i].value[0].value[0].rx)) {
        // independent rx and ry => ellipse
        parameters.push(parseFloat(annotation[i].value[0].value[0].rx))
        parameters.push(parseFloat(annotation[i].value[0].value[0].ry))
      } else if (isVar(annotation[i].value[0].value[0].width)) {
        // width and height => rectangle (no rotation)
        parameters.push(parseFloat(annotation[i].value[0].value[0].width))
        parameters.push(parseFloat(annotation[i].value[0].value[0].height))
      }
      if (isVar(annotation[i].value[0].value[0].angle)) {
        // add the angle if it's present
        parameters.push(parseFloat(annotation[i].value[0].value[0].angle))
      }
      if (isVar(annotation[i].value[0].value[0].points)) {
        // polygon and bezier have points, though bezier is weird sometimes
        const points = [];
        annotation[i].value[0].value[0].points.forEach(
          (p) => points.push([p.x, this.state.imageSize[0] - p.y])
        )
        parameters.push(points);
      }
      // get values from the sliders
      annotation[i].value[1].value.forEach(v => parameters.push(parseFloat(v.value)));
      const ret = {}
      parameters.forEach((c, j) => {
        ret[model[i].map[j]] = c;
      });
      renderFunctions.push([model[i].func, Object.assign({name: model[i].name}, model[i].default, ret)])
    }
  }
  console.log(renderFunctions);
  return renderFunctions;
}

class webGLModelCanvas extends React.Component {
  constructor(props) {
    super(props);
    /* set the state - this contains a list of regl render functions which are
    cycled through to render the model (toRender), something similar for
    masking (maybe), the size of the image and a placeholder for compiled regl
    textures */
    this.state = {
      toRender: [],
      imageHasLoaded: false,
      textures: null,
      imageSize: [400, 400],
    }
    // initialize a model variable to be filled in once component is mounted
    this.model = null;

    // not really needed afaik
    const pixelCount = this.state.imageSize[0] * this.state.imageSize[1]
    this.modelData = new Uint8Array(pixelCount * 4);
    this.differenceData = new Uint8Array(pixelCount * 4);

    // function binding
    this.updateTextures = this.updateTextures.bind(this);
    this.getScore = this.getScore.bind(this);
    this.updateSubject = this.updateSubject.bind(this);

    this.componentDidMount = this.componentDidMount.bind(this);
    //this.componentDidUpdate = this.componentDidUpdate.bind(this);

    // parseCls needs to know image size (for now), so bind it
    this.parseCls = parseCls.bind(this);

    if (this.props.subject.locations.length < 2) {
      const im0 = this.props.subject.locations[0];
      this.props.subject.locations[1] = Object.assign({}, im0);
    }
  }
  componentWillReceiveProps(nextProps) {
    // require two images: one for subject and one for difference
    // test here so contiues to work when subject changes
    if (this.props.subject.locations.length < 2) {
      const im0 = this.props.subject.locations[0];
      this.props.subject.locations[1] = Object.assign({}, im0);
    }
    // component has updated with new props, set the new render functions
    // check if a model has been assigned
    if (this.model !== null) {
      // if so, update the render function list to the new annotation
      this.setState({
        toRender: this.parseCls(this.model, nextProps.classification.annotations),
      }, () => window.requestAnimationFrame(this.updateTextures));
    }
  }
  updateTextures() {
    const modelData = this.modelRegl.read(this.modelData);
    // check if the subject image has loaded
    if (this.state.imageHasLoaded) {
      // grab a texture from it
      const imageTexture = this.differenceRegl.texture({
        shape: [this.state.imageSize[0], this.state.imageSize[1]]
      });
      imageTexture.subimage(this.im);
      // set the compiled textures in state
      this.setState({
        textures: {
          modelTexture: this.differenceRegl.texture({
            data: modelData,
            width: this.state.imageSize[0],
            height: this.state.imageSize[0],
          }),
          imageTexture: imageTexture,
        }
      }, this.getScore);
    }
  }
  getScore() {
    const d = this.differenceRegl.read();
    const l = d.length;
    let AIC = 0;
    for (let i = 0; i < l; i += 4) {
      AIC += (255 - d[i + 1])/256;
    }
    const B = 10000;
    const score = 100 * Math.exp(-AIC / B);
    //this.props.workflow.configuration.metadata.modelScore = score;
    this.props.onRender(score);
    this.updateSubject()
  }
  updateSubject() {
    if (typeof(this.modelCanvas) !== 'undefined' &&
        typeof(this.modelCanvas) !== 'undefined') {
      const imOutType = Object.keys(this.props.subject.locations[1])[0];
      const urlDiff = this.differenceCanvas.toDataURL(imOutType, 0.92)
      this.props.subject.locations[1][imOutType] = urlDiff;
    }
  }
  componentDidMount() {
    if (!webGLCompatibilityTest()) {
      console.error('WebGL is not available, aborting');
      return;
    }
    // component has mounted, initialise the regl canvases
    this.modelRegl = reglBase({
      canvas: this.modelCanvas,
      attributes: { preserveDrawingBuffer: true }
    });
    this.differenceRegl = reglBase({
      canvas: this.differenceCanvas,
      attributes: { preserveDrawingBuffer: true }
    });

    // initialise each component of the model (replace func in model comp with func(regl))
    this.model = model.map(c => Object.assign(c, { func: c.func(this.modelRegl) }));

    // compile an initial render
    this.setState({
      toRender: [], //parseCls(this.model, testAnnotation),
    });

    // TODO: optimize this, as it seems slower than it should be
    // set the model rendering function
    this.modelRegl.frame((function () {
      this.modelRegl.clear({
        color: [0, 0, 0, 1]
      });
      const toRenderLength = this.state.toRender.length;
      for (let i = 0; i < toRenderLength; i++) {
        this.state.toRender[i][0](this.state.toRender[i][1])
      }
    }).bind(this))

    // set the differenceRegl rendering function
    const boundBgRegl = bgRegl(this.differenceRegl);
    this.differenceRegl.frame((function() {
      this.differenceRegl.clear({
        color: [1, 1, 1, 1]
      })
      if (this.state.textures !== null) {
        boundBgRegl(this.state.textures);
      }
    }).bind(this));
  }
  render() {
    return (
      <div hidden>
        <canvas
          width={this.state.imageSize[0]}
          height={this.state.imageSize[1]}
          data-style={{ backgroundColor: '#000' }}
          ref={r => {this.modelCanvas = r }}
        />
        <canvas
          width={this.state.imageSize[0]}
          height={this.state.imageSize[1]}
          data-style={{ backgroundColor: '#000' }}
          ref={r => { this.differenceCanvas = r }}
        />
        <img
          src={this.props.subject.locations[0]['image/png']}
          ref={r => { this.im = r }}
          onLoad={ () => {this.setState({ imageHasLoaded: true })}}
          alt="Galaxy Image"
          crossOrigin=""
        />
      </div>
    );
  }
}

webGLModelCanvas.propTypes = {
  classification: React.PropTypes.object.isRequired,
  subject: React.PropTypes.object.isRequired,
  onRender: React.PropTypes.func,
  workflow: React.PropTypes.object,
}

export default webGLModelCanvas;
