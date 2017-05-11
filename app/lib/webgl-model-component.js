const baseObj = {
  frag: `void main () { gl_FragColor = vec4(0,0,0,1);}`,
  vert: `
    precision mediump float; attribute vec2 position;
    void main () { gl_Position = vec4(2.0 * position - 1.0, 0, 1); }
    `,
  attributes: { position: [-2, 0, 0, -2, 2, 2] },
  blend: {
    enable: true,
    func: {
      srcRGB: 'src alpha',
      srcAlpha: 1,
      dstRGB: 'one minus src alpha',
      dstAlpha: 1
    },
    equation: {
      rgb: 'add', alpha: 'add'
    },
    color: [0, 0, 0, 0]
  },
  depth: { enable: false },
  count: 3,
}

function bgRegl(r) {
  return r({
    frag: `
      precision mediump float;
      uniform sampler2D imageTexture, modelTexture;
      varying vec2 uv;
      vec2 texCoords;
      float pixel;
      void main () {
        // for some reason the y-axis coords have been mirrored;
        texCoords = vec2(uv[0], 1.0 - uv[1]);
        pixel = texture2D(imageTexture, texCoords).rgb[0] - texture2D(modelTexture, uv).rgb[0];
        if (pixel < 0.0) {
          // model is too bright
          gl_FragColor = vec4(
            1.0 + pixel,
            1.0 + pixel,
            1,
            1
          );
        } else {
          // model is too weak
          gl_FragColor = vec4(
            1,
            1.0 - pixel,
            1.0 - pixel,
            1
          );
        }
      }`,
    vert: `
      precision mediump float; attribute vec2 position; varying vec2 uv;
      void main () {
        uv = position;
        gl_Position = vec4(2.0 * position - 1.0, 0, 1);
      }`,
    uniforms: {
      imageTexture: r.prop('imageTexture'),
      modelTexture: r.prop('modelTexture'),
    },
    depth: { enable: false },
    attributes: { position: [-2, 0, 0, -2, 2, 2] },
    count: 3
  });
}

function drawSersic(r) {
  return r(Object.assign({}, baseObj, {
    frag: `
      precision mediump float;
      uniform vec2 mu;
      uniform float roll, rEff, axRatio, i0, n, c;
      float sersic2d(vec2 pos) {
        float xPrime = pos[0] * cos(roll) - pos[1] * sin(roll)
          + mu[0] - mu[0] * cos(roll) + mu[1] * sin(roll);
        float yPrime = pos[0] * sin(roll) + pos[1] * cos(roll)
          + mu[1] - mu[1] * cos(roll) - mu[0] * sin(roll);
        float radius = pow(
          pow(axRatio / rEff, c) * pow(abs(xPrime - mu[0]), c) +
          pow(abs(yPrime - mu[1]), c) / pow(rEff, c), 1.0/c);
        float pixel = i0 * exp(-pow(radius, 1.0 / n));
        return pixel;
      }
      void main () {
        gl_FragColor = vec4(
          1,
          0,
          0,
          sersic2d(gl_FragCoord.xy);
        );
      }`,
    uniforms: {
      roll: function(context, props, batchID) {
        return Math.PI * (props.rx < props.ry ? (-props.roll) : 90 - props.roll) / 180;
      },
      mu: (c, p, b) => [p.mux, p.muy],
      rEff: function(context, props, batchID) {
        return props.rx > props.ry ? props.rx * props.scale : props.ry * props.scale
      },
      axRatio: function(context, props, batchID) {
        return props.rx > props.ry ? props.rx / props.ry : props.ry / props.rx;
      },
      i0: r.prop('i0'),
      n: r.prop('n'),
      c: r.prop('c'),
    },
  }));
}

function polyOrNull(poly, index) {
  return poly.length > index ? poly[index] : [0.0, 0.0]
}

function drawSpiral(r) {
  const spiralArgs = {
    frag: `
      precision mediump float;
      uniform vec2 mu, points[50];
      uniform int pointCount;
      uniform float rEff, axRatio, i0;
      float getDistance(vec2 y, vec2 p1, vec2 p2) {
        float r = dot(p2 - p1, y - p1) / length(p2 - p1) / length(p2 - p1);
        if (r <= 0.0) {
          return length(y - p1);
        } else if (r >= 1.0) {
          return length(y - p2);
        } else {
          float top = abs((p2[1] - p1[1])*y[0] - (p2[0]-p1[0])*y[1] + p2[0]*p1[1] - p2[1]*p1[0]);
          float bottom = sqrt((p2[1] - p1[1])*(p2[1] - p1[1]) + (p2[0] - p1[0])*(p2[0] - p1[0]));
          return top / bottom;
        }
      }
      void main () {
        float radius = 10000.0;
        if (pointCount > 1) {
          for (int i = 1; i < 50; i++) {
            radius = min(getDistance(gl_FragCoord.xy, points[i-1], points[i]), radius);
            if (i >= pointCount - 1) {
              break;
            }
          }
        }
        float pixel = i0 * exp(-radius*radius* 0.01);
        gl_FragColor = vec4(
          1,
          0,
          0,
          pixel
        );
      }`,
    uniforms: {
      //mu: (c, p, b) => [p.mux, p.muy],
      axRatio: function(context, props, batchID) {
        return props.rx > props.ry ? props.rx / props.ry : props.ry / props.rx;
      },
      i0: r.prop('i0'),
      scale: r.prop('scale'),
      pointCount: (c, p, b) => p.points.length,
    },
  };
  // this is ugly, but it's the easiest (only?) way to pass the drawn polygon to regl
  const range = [...Array(50).keys()];
  range.forEach(i => {
    spiralArgs.uniforms[`points[${i}]`] = (c, p, b) =>
      p.points.length > i ?
        p.points[i] :
        [-1.0, -1.0];
  });
  return r(Object.assign({}, baseObj, spiralArgs));
}

const model = [
  {
    name: 'sersic disk',
    func: drawSersic,
    map: ['mux', 'muy', 'rx', 'ry', 'roll', 'scale', 'i0'],
    type: 'component',
    default: { mux: 0, muy: 0, rx: 10, ry: 15, scale: 5/8, roll: 0, i0: 0.75, n: 1, c: 2, }
  },
  {
    name: 'sersic bulge',
    func: drawSersic,
    map: ['mux', 'muy', 'rx', 'ry', 'roll', 'scale', 'i0', 'n'],
    type: 'component',
    default: { mux: 100, muy: 100, rx: 10, ry: 15, scale: 5/8, roll: 0, i0: 0.75, n: 1, c: 2, }
  },
  {
    name: 'sersic bar',
    func: drawSersic,
    map: ['mux', 'muy', 'rx', 'ry', 'roll', 'scale', 'i0', 'n', 'c'],
    type: 'component',
    default: { mux: 100, muy: 100, rx: 5, ry: 5, scale: 5/8, roll: 0, i0: 0.75, n: 2, c: 2, }
  },
  {
    name: 'sersic spiral',
    func: drawSpiral,
    map: ['points', 'scale', 'i0'],
    type: 'component',
    default: { mux: 100, muy: 100, rx: 5, ry: 5, scale: 5/8, roll: 0, i0: 0.75, n: 2, c: 2, }
  },
]

// post processing regl (in this case, sort out oversampling and sky noise, maybe)
function postRegl(r) {
  return r(Object.assign({}, baseObj, {
    frag: `
      `,
    uniforms: {
    },
  }));
}

// TODO: need post-processing render function for oversampling peaky sersic profile
export { model, bgRegl, postRegl };
