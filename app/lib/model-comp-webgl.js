import moreMath from '../lib/math-addons';
import regl from 'regl';

if (isNaN(Math.round10)) moreMath();

const isVar = v => typeof(v) !== 'undefined';

function parseCls_(modelComp, cls) {
  const _ret = [];
  [cls.x, cls.y, cls.rx, cls.ry, cls.angle].forEach(c => isVar(c) ? _ret.push(c) : null);
  if (isVar(cls.angle)) {
    _ret.push(cls.angle * Math.PI / 180)
  }
  if (isVar(cls.details)) {
    cls.details.forEach(c => isVar(c.value) ? _ret.push(c.value) : null)
  }
  const ret = {};
  _ret.forEach((c, i) => {
    if (c !== 0) {
      ret[modelComp.map[i]] = c;
    }
  });
  if (isVar(cls.points)) {
    ret.mux = cls.points[0].x;
    ret.muy = cls.points[0].y;
    ret.points = cls.points.slice();
  }
  return Object.assign({}, modelComp.default, ret);
}

const inCircle = (m, c) => (m.mux-c[0])*(m.mux-c[0]) + (m.muy-c[1])*(m.muy-c[1]) < m.size*m.size/9

function renderModel(model, cls, coords) {
  // --> compile mask
  // filter classification for components of type 'mask'
  console.time('Total Render')
  console.time('Compile')
  const maskComps = cls[0].value.filter(c => model[c.tool].type === 'mask');
  // store the length of the array in a variable for perfomance
  const mCLength = maskComps.length;
  // for each of those, take their selection function and bind it to the classification
  const maskFuncs = maskComps.map(
    c => model[c.tool].func.bind(null, parseCls_(model[c.tool], c))
  );

  // --> compile rendering function
  // same process as above, just with a different initial filter
  const renderComps = cls[0].value.filter(c => model[c.tool].type === 'component')
  const rCLength = renderComps.length;
  const filterFuncs = renderComps.map(
    c => isVar(model[c.tool].filterFunc) ?
      model[c.tool].filterFunc(parseCls_(model[c.tool], c)) :
      null
  )
  /*const renderFuncs = renderComps.map(
    c => model[c.tool].func.bind(null, parseCls_(model[c.tool], c)) : 0
  );*/
  let rF;
  const renderFuncs = new Array(renderComps.length);
  for (let i = 0; i < renderFuncs.length; i++) {
    if (filterFuncs[i] !== null) {
      rF = model[renderComps[i].tool].func.bind(
        null,
        parseCls_(model[renderComps[i].tool], renderComps[i])
      );
      renderFuncs[i] = c => filterFuncs[i](c) ? rF(c) : 0;
    } else {
      renderFuncs[i] = model[renderComps[i].tool].func.bind(
        null,
        parseCls_(model[renderComps[i].tool], renderComps[i])
      );
    }
  }
  console.timeEnd('Compile')
  console.log(renderFuncs);
  console.time('Render')
  // --> render filtered coordinates
  let flag = false, pixel = 0, filteredCount = 0;
  const pixelCount = coords.length;
  const ret = Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    pixel = 0;
    for (let j = 0; j < rCLength; j++) pixel += renderFuncs[j](coords[i])
    ret[i] = pixel;
  }
  console.timeEnd('Render')
  console.time('Filtering')
  const filteredCoords = Array();
  for (let i = 0, k = 0; i < pixelCount; i++) {
    flag = false;
    for (let j = 0; j < mCLength; j++) flag = maskFuncs[j](coords[i]) || flag
    if (flag) { filteredCoords[k] = coords[i]; k++; }
  }
  console.timeEnd('Filtering')
  console.timeEnd('Total Render')
  return { model: ret, ignored: filteredCoords };
}


// \--------/\--------/\--------/\--------/\--------/\--------/\--------/\------
// -\------/--\------/--\------/--\------/--\------/--\------/--\------/--\-----
// --\----/----\----/-- PROJECT INDEPENDANT CODE GOES HERE -/----\----/----\----
// ---\--/------\--/------\--/------\--/------\--/------\--/------\--/------\--/
// ----\/--------\/--------\/--------\/--------\/--------\/--------\/--------\/-

// ------------ Rendering Function ------------
function sersic2d(p, coord) {
  const rEff =  p.rx > p.ry ? p.rx * p.scale : p.ry * p.scale;
  const axRatio =  p.rx > p.ry ? p.rx / p.ry : p.ry / p.rx;
  const roll = p.rx > p.ry ? (-p.roll) : Math.PI/2 - p.roll;
  const sinRoll = Math.sin(roll);
  const cosRoll = Math.cos(roll);
  // calculate sersic value at rolled coordinates
  const xPrime = coord[0] * cosRoll - coord[1] * sinRoll + p.mux - p.mux * cosRoll + p.muy * sinRoll;
  const yPrime = coord[0] * sinRoll + coord[1] * cosRoll + p.muy - p.muy * cosRoll - p.mux * sinRoll;
  const weightedRadius = Math.sqrt(
    Math.pow(axRatio / rEff, p.c) * Math.pow(Math.abs(xPrime - p.mux), p.c) +
    Math.pow(Math.abs(yPrime - p.muy), p.c) / Math.pow(rEff, p.c));
  return Math.floor10(Math.exp(Math.log(p.i0) - Math.pow(weightedRadius, 1 / p.n)));
}

// ------------ Define the model ------------
const galaxyModel = [
  {
    name: 'pointMask',
    map: ['muy', 'mux', 'size'],
    default: { mux: 0, muy: 0, size: 50 },
    func: inCircle,
    type: 'mask'
  },
  {
    name: 'sersic disk',
    func: sersic2d,
    map: ['muy', 'mux', 'rx', 'ry', 'roll', 'i0', 'scale'],
    type: 'component',
    default: { mux: 100, muy: 100, rx: 10, ry: 15, scale: 5/8, roll: 0, i0: 127, n: 1, c: 2, }
  },
  {
    name: 'sersic bulge',
    func: sersic2d,
    map: ['muy', 'mux', 'rx', 'ry', 'roll', 'n', 'i0', 'scale'],
    type: 'component',
    default: { mux: 100, muy: 100, rx: 10, ry: 15, scale: 5/8, roll: 0, i0: 127, n: 1, c: 2, }
  },
  {
    name: 'sersic bar',
    func: sersic2d,
    map: ['muy', 'mux', 'rx', 'ry', 'roll', 'n', 'i0', 'scale', 'c'],
    type: 'component',
    default: { mux: 100, muy: 100, rx: 5, ry: 5, scale: 5/8, roll: 0, i0: 127, n: 2, c: 2, }
  },
]

const Model = renderModel.bind(null, galaxyModel)

function test() {
  const exampleClassification = [
    {
      _toolIndex: 0, task: "model_draw", _key: 0.38855397077872356,
      value: [
        {
          tool: 0, frame: 0, details: [{ value: 10 }],
          x: 288.77319796954316, y: 75.37055837563452,
          _inProgress: false, _key: 0.25325324117385617
        },
        {
          tool: 1, frame: 0, details: [{ value: 50 }, { value: 34 }],
          x: 100, y: 100,
          rx: 68.92374331654199, ry: 34.461871658270994,
          angle: 81.67434966957317,
          _inProgress: false, _key: 0.6611637769588081
        },
        {
          tool: 0, frame: 0, details: [{ value: 10 }],
          x: 152.3784771573604, y: 150.2213197969543,
          _inProgress: false, _key: 0.435923672331346
        }
      ],
    }
  ]

  const width = 512, height = 512;
  const coords = new Array(width * height);
  for (let j = 0; j < width; j++) { for (let k = 0; k < height; k++) coords[width * j + k] = [j, k];}

  // How fast can it go?
  const dDf = { mux: 100.0, muy: 100.0, rx: 68.92, ry: 34.46, scale: 100, roll: 81.67, i0: 50, n: 1, c: 2 }
  const diskMap = ['mux', 'muy', 'rx', 'ry', 'roll', 'i0', 'scale']
  const d = sersic2d.bind(null, dDf); const cl = coords.length

  console.time('Gold Standard');
  const model = Array(cl); for (let i = 0; i < cl; i++) model[i] = d(coords[i]);
  console.timeEnd('Gold Standard');

  // render the model with this example classification
  console.time('Render'); const r = Model(exampleClassification, coords); console.timeEnd('Render')
}

export default Model
//*/
