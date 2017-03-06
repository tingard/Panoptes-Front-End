
import { mount } from 'enzyme';
import React from 'react';
import assert from 'assert';
import ModelCanvas from './model-canvas';

const classification = {
  annotation: {
    _toolIndex: 0, task: "model_draw", _key: 0.38855397077872356,
    value: [
      {
        tool: 0, frame: 0, details: [{ value: 10 }],
        x: 288.77319796954316, y: 75.37055837563452,
        _inProgress: false, _key: 0.25325324117385617
      },
      /*{
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
      }*/
    ],
  }
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

  describe('the canvases', function() {
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
  });
});
