import apiClient from 'panoptes-client/lib/api-client';

// This is just a blank image for testing drawing tools while offline.
const BLANK_IMAGE = ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgAQMAAAA',
  'PH06nAAAABlBMVEXMzMyWlpYU2uzLAAAAPUlEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgzwCX4AAB9Dl2RwAAAABJRU5ErkJggg=='].join('');

const DISK_DRAWING_DETAILS = [
  { type: 'slider', instruction: 'Choose Sersic Index', metadata: 'sersic-index' },
  { type: 'slider', instruction: 'Choose Intensity', metadata: 'sersic-intensity' },
];

const BULGE_DRAWING_DETAILS = [
  { type: 'slider', instruction: 'Choose Sersic Index' },
  { type: 'slider', instruction: 'Choose Intensity' },
];


const SPIRAL_DRAWING_DETAILS = [
  { type: 'slider', instruction: 'Sersic Index' },
  { type: 'slider', instruction: 'Intensity' },
  { type: 'text', instruction: 'Any additional comments?' },
];


const workflow = apiClient.type('workflows').create({
  id: 'TEST_WORKFLOW_GALAXY_MODELLING',
  configuration: {
    enable_subject_flags: true,
    enable_switching_flipbook_and_separate: false,
    multi_image_mode: 'separate',
    multi_image_layout: 'grid2',
    invert_subject: false,
    persist_annotations: true,
    pan_and_zoom: true,
    metadata: {
      type: 'modelling',
      isRendering: false,
    },
  },

  first_task: 'model_draw',

  tasks: {
    model_draw: {
      type: 'drawing',
      required: true,
      question: 'Draw the Galaxy components',
      tools: [
        { type: 'point', label: 'Point Source', color: 'red' },
        { type: 'ellipse', label: 'Galaxtic Disk ', color: 'magenta', details: DISK_DRAWING_DETAILS },
        { type: 'ellipse', label: 'Galaxtic Bulge ', color: 'magenta', details: BULGE_DRAWING_DETAILS },
        { type: 'bezier', label: 'Spiral arm (bezier)', color: 'orange', details: SPIRAL_DRAWING_DETAILS },
        { type: 'polygon', label: 'Spiral arm (polygon)', color: 'cyan', details: SPIRAL_DRAWING_DETAILS },
      ],
      next: 'should_model_fit'
    },
    should_model_fit: {
      type: 'single',
      required: true,
      question: 'Do you want to do an in browser fit? (TODO: make this more comprehensible)',
      next: null,
      help: 'You don’t need help with this.',
      answers: [
        {label: 'Yes', next: 'model_fit'},
        {label: 'No', next: 'review'},
      ],
    },
    model_fit: {
      type: 'modelFit',
      required: false,
      method: 'LM',
      question: 'GLHF',
      next: 'review',
    },
    review: {
      type: 'single',
      required: true,
      question: 'What next?',
      next: null,
      help: 'What would you like to do next? You can go back to draw more components',
      answers: [
        {label: 'Add/remove/edit components', next: 'model_draw'},
        {label: 'Try another fit', next: 'model_fit'},
        {label: 'I\'m done here', next: null},
      ],
    },
  },
});

const subject = apiClient.type('subjects').create({
  id: 'MOCK_SUBJECT_FOR_CLASSIFIER',
  locations: ((navigator && navigator.onLine) ?
    [
      {'image/jpeg': `${window.location.origin}/assets/dev-classifier/sloanGalaxy.jpg`},
      {'image/jpeg': `${window.location.origin}/assets/dev-classifier/sloanGalaxy.jpg`},
      {'image/jpeg': `${window.location.origin}/assets/dev-classifier/sloanGalaxy.jpg`},
    ]
  :
    [
      {'image/png': BLANK_IMAGE}
    ]),

  metadata: {
    'Capture date': '5 Feb, 2015',
    'Region': 'Chicago, IL',
  },
});

const project = apiClient.type('projects').create({
  id: 'MOCK_PROJECT_FOR_CLASSIFIER',
  title: "The Dev Classifier",
  experimental_tools: [],
});

const preferences = apiClient.type('project_preferences').create({
  preferences: {},
});

const classification = apiClient.type('classifications').create({
  annotations: [],
  metadata: {},
  links: {
    project: project.id,
    workflow: workflow.id,
    subjects: [subject.id],
  },
  _workflow: workflow, // TEMP
  _subjects: [subject], // TEMP
});


module.exports = {workflow, subject, classification, project, preferences}
window.mockClassifierData = module.exports
