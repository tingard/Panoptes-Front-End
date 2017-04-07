import React from 'react';
import reglBase from 'regl';
import { model_, bgRegl_ } from '../lib/webgl-model-component';

function webGLCompatibilityTest() {
    try {
        return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
    } catch(e) {
        return false;
    }
}

function parseCls_(model, annotation) {
  let renderFunctions = [];
  for (let i = 0; i < annotation.length; i++) {
    // did we get a drawn on component?
    if (annotation[i].value[0].value.length > 0) {
      // get position values
      const componentType = annotation[i].task
      const parameters = [
        annotation[i].value[0].value[0].x,
        this.state.imageSize[0] - annotation[i].value[0].value[0].y,
        annotation[i].value[0].value[0].rx,
        annotation[i].value[0].value[0].ry,
        annotation[i].value[0].value[0].angle,
      ]
      // get values from the sliders
      annotation[i].value[1].value.forEach(i => parameters.push(parseFloat(i.value)));
      const ret = {}
      parameters.forEach((c, j) => {
        ret[model[i].map[j]] = c;
      });
      renderFunctions[i] = [model[i].func, Object.assign({name: model[i].name}, model[i].default, ret)]
    }
  }
  return renderFunctions;
}

const testAnnotation = [
  {
    _toolIndex: 0, task: "disk",
    value: [
      {
        task: 'drawDisk',
        value: [
          {
            tool: 0, frame: 0,
            x: 100, y: 256,
            rx: 80.0, ry: 40.0,
            angle: -45,
          }
        ],
      },
      {
        task: 'slideDisk',
        value: [
          {
            task: 'scaleSlider', value: "0.4"
          },
          {
            task: 'intensitySlider', value: "1"
          }
        ]
      }
    ],
  },
]

class webGLModelCanvas extends React.Component {
  constructor(props) {
    super(props);
    /* set the state - this contains a list of regl render functions which are
    cycled through to render the model (toRender), something similar for
    masking (maybe), the size of the image and a placeholder for compiled regl
    textures */
    this.state = {
      toRender: [],
      toMask: [],
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
    this.getDifference = this.getDifference.bind(this);
    this.getScore = this.getScore.bind(this);
    this.updateSubject = this.updateSubject.bind(this);

    this.componentDidMount = this.componentDidMount.bind(this);
    //this.componentDidUpdate = this.componentDidUpdate.bind(this);

    this.parseCls_ = parseCls_.bind(this);

    if (this.props.subject.locations.length < 2) {
      const im0 = this.props.subject.locations[0];
      this.props.subject.locations[1] = Object.assign({}, im0);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.subject.locations.length < 2) {
      const im0 = this.props.subject.locations[0];
      this.props.subject.locations[1] = Object.assign({}, im0);
    }
    // component has updated with new props, set the new render functions
    // check if a model has been assigned
    if (this.model !== null) {
      // if so, update the render function list to the new annotation
      this.setState({
        toRender: this.parseCls_(this.model, nextProps.classification.annotations),
        toMask: []
      }, () => window.requestAnimationFrame(this.getDifference));
    }
  }
  getDifference() {
    const modelData = this.modelRegl.read();
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
            data:modelData,
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
      //const url = this.modelCanvas.toDataURL(imOutType, 0.92)
      const urlDiff = this.differenceCanvas.toDataURL(imOutType, 0.92)
      //this.imOut.src = urlDiff;
      //this.props.subject.locations[1]['image/jpeg'] = url;
      this.props.subject.locations[1][imOutType] = urlDiff;
    }
  }
  componentDidMount() {
    if (!webGLCompatibilityTest()) {
      console.error('WebGL is not available, aborting');
      return;
    }
    // component has mounted, initialise the regl canvases
    // this.im.crossOrigin = "Anonymous";
    this.modelRegl = reglBase({
      canvas: this.modelCanvas,
      attributes: { preserveDrawingBuffer: true }
    });
    this.differenceRegl = reglBase({
      canvas: this.differenceCanvas,
      attributes: { preserveDrawingBuffer: true }
    });

    // initialise each component of the model (replace func in model comp with func(regl))
    this.model = model_.map(c => Object.assign(c, { func: c.func(this.modelRegl) }));

    // compile an initial render
    this.setState({
      toRender: [], //parseCls_(this.model, testAnnotation),
      toMask: []
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
      // TODO: how to mask (if at all)
      //for (let i = 0; i < this.state.toMask.length; i++) {
      //  this.state.toMask[i][0](this.state.toMask[i][1])
      //}
    }).bind(this))

    // set the differenceRegl rendering function
    const bgRegl = bgRegl_(this.differenceRegl);
    this.differenceRegl.frame((function() {
      this.differenceRegl.clear({
        color: [1, 1, 1, 1]
      })
      if (this.state.textures !== null) {
        bgRegl(this.state.textures);
      }
    }).bind(this));
  }
  render() {
    return (
      <div>
        <canvas
          width={this.state.imageSize[0]}
          height={this.state.imageSize[1]}
          data-style={{ backgroundColor: '#000' }}
          ref={r => {this.modelCanvas = r }}
          hidden
        />
        <canvas
          width={this.state.imageSize[0]}
          height={this.state.imageSize[1]}
          data-style={{ backgroundColor: '#000' }}
          ref={r => { this.differenceCanvas = r }}
          hidden
        />
        <img
          id="im"
          src={this.props.subject.locations[0]['image/png']}
          ref={r => { this.im = r }}
          onLoad={ () => {this.setState({ imageHasLoaded: true })}}
          alt="Galaxy"
          crossOrigin="Anonymous"
          hidden
        />
        <img
          id="im2"
          src={this.props.subject.locations[0]['image/png']}
          width="50px"
          ref={r => { this.imOut = r }}
          alt="Difference between model and galaxy"
          hidden
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
