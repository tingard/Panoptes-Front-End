const _baseObj = {
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

function bgRegl_(r) {
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
  return r(Object.assign({}, _baseObj, {
    frag: `
      precision mediump float;
      uniform vec2 mu;
      uniform float roll, rEff, axRatio, i0, n, c;
      void main () {
        float xPrime = gl_FragCoord.xy[0] * cos(roll) - gl_FragCoord.xy[1] * sin(roll)
          + mu[0] - mu[0] * cos(roll) + mu[1] * sin(roll);
        float yPrime = gl_FragCoord.xy[0] * sin(roll) + gl_FragCoord.xy[1] * cos(roll)
          + mu[1] - mu[1] * cos(roll) - mu[0] * sin(roll);
        float radius = sqrt(
          pow(axRatio / rEff, c) * pow(abs(xPrime - mu[0]), c) +
          pow(abs(yPrime - mu[1]), c) / pow(rEff, c));
        float pixel = i0 * exp(-pow(radius, 1.0 / n));
        gl_FragColor = vec4(
          1,
          0,
          0,
          pixel
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

const model_ = [
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
]
export { model_, bgRegl_ };
