/* eslint prefer-arrow-callback: 0, func-names: 0, 'react/jsx-boolean-value': ['error', 'always'], 'react/jsx-filename-extension': 0 */
/* global describe, it, beforeEach */
import { mount } from 'enzyme';
import React from 'react';
import assert from 'assert';
import ModelScore from './model-score';

import moreMath from '../lib/math-addons';
moreMath();

const workflow = {
  configuration: {
    metadata: {
      modelScore: 50.19395011
    }
  }
};

const annotation = {
  value: '0.2'
};
describe('ModelScore', function () {
  let wrapper;

  beforeEach(function () {
    wrapper = mount(<ModelScore workflow={workflow} />);
  });

  it('should render without crashing', function () {});

  describe('the progress bar', function () {
    let progress;
    beforeEach(function () {
      progress = wrapper.find('progress');
    });

    it('should have only one progress bar', function() {
      assert.equal(progress.length, 1);
    });

    it('should have a value greater than 0', function() {
      assert(progress.props().value >= 0, `${progress.props().value} >= 0`);
    });

    it('should have a value less than 100', function() {
      assert(progress.props().value <= 100, `${progress.props().value} <= 100`);
    });

    it('should have the correct score value', function() {
      let s = workflow.configuration.metadata.modelScore;
      if (s < 80) {
        s = Math.round10(s, -2);
      } else if (s < 90) {
        s = Math.round10(s, -3);
      } else if (s < 95) {
        s = Math.round10(s, -4);
      }
      assert.equal(progress.props().value, s);
    });
  });

  describe('the score text', function() {
    let scoreText;

    beforeEach(function () {
      scoreText = wrapper.find('.model-score');
    });

    it('should only appear once', function() {
      assert.equal(scoreText.length, 1);
    });

    it('should have a value greater than 0', function() {
      assert(scoreText.text() >= 0, `${scoreText.text()} >= 0`);
    });

    it('should have a value less than 100', function() {
      assert(scoreText.text() <= 100, `${scoreText.text()} <= 100`);
    });

    it('should have the correct score value', function() {
      let s = workflow.configuration.metadata.modelScore;
      if (s < 80) {
        s = Math.round10(s, -2);
      } else if (s < 90) {
        s = Math.round10(s, -3);
      } else if (s < 95) {
        s = Math.round10(s, -4);
      }
      assert.equal(scoreText.text(), s);
    });

    it('should have the same value as the progress bar (after rounding)', function() {
      let progress = wrapper.find('progress');
      assert.equal(progress.props().value, scoreText.text())
    })
  })

  describe('when there is no score', function() {
    let progress;
    let noScoreMessage;

    beforeEach(function () {
      wrapper = mount(<ModelScore workflow={{}} />);
      progress = wrapper.find('progress');
      noScoreMessage = wrapper.find('.no-score-message');
    });

    it('should set the progress bar to zero', function() {
      assert.equal(progress.props().value, 0);
    });

    it('should have the no score message', function() {
      assert.equal(progress.length, 1);
    });
  });
});
