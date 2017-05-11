
import { mount } from 'enzyme';
import React from 'react';
import assert from 'assert';
import ModelCanvas from './model-canvas';

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

const classification = {
  annotations: testAnnotation
}

const subject = {
  locations: [
    { 'image/jpeg': '' },
    { 'image/jpeg': '' },
    { 'image/jpeg': '' }
  ]
};

describe('SliderTask', function () {
  let wrapper;

  beforeEach(function () {
    wrapper = mount(<ModelCanvas classification={classification} subject={subject}/>);
  });

  it('should render without crashing', function () {});

  /* describe('the canvases', function() {
    let canvas;

    beforeEach(function () {
      canvas = wrapper.find('canvas');
    });

    it('should be of length two', function () {
      assert.equal(canvas.length, 2);
    });

    it('should be invisible', function () {
      // TODO: this should be a better css selector
      assert(canvas.at(0).is('[hidden="true"]'));
      assert(canvas.at(1).is('[hidden="true"]'));
    });
  }); */
});
