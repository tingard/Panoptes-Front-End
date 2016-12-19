`import ModelFitTask from './modelling/model-fit'`

module.exports =
  combo: require './combo'
  single: require './single'
  multiple: require './multiple'
  drawing: require './drawing'
  survey: require './survey'
  flexibleSurvey: require './survey'
  crop: require './crop'
  text: require './text'
  slider: require './slider'
  dropdown: require './dropdown'
  shortcut: require './shortcut'
  modelFit: ModelFitTask

window?._tasks = module.exports
