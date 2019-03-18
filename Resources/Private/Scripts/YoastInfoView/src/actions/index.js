import produce from 'immer';
import {createAction} from 'redux-actions';
import {$get} from 'plow-js';

export const defaultState = {
    translations: null,
    worker: null,
    analysis: {
        seo: {
            expanded: false
        },
        readability: {
            expanded: false
        }
    }
};

export const actionTypes = {
    SET_TRANSLATIONS: 'SET_TRANSLATIONS',
    SET_WORKER: 'SET_WORKER',
    SET_ANALYSIS: 'SET_ANALYSIS',
};

// Using this backup state is a hotfix as Neos redux doesn't remember a plugins state currently and resets it.
// See https://github.com/neos/neos-ui/pull/2393
let backupState = defaultState;

const setTranslations = createAction(actionTypes.SET_TRANSLATIONS);
const setWorker = createAction(actionTypes.SET_WORKER);
const setAnalysis = createAction(actionTypes.SET_ANALYSIS);

export const actions = {
    setTranslations,
    setWorker,
    setAnalysis,
};

export const reducer = (state = defaultState, action) => produce(state, draft => {
    if (!draft.plugins || !draft.plugins.yoastInfoView) {
        draft.plugins = draft.plugins || {};
        draft.plugins.yoastInfoView = backupState;
    }
    switch (action.type) {
        // TODO: Should be system.INIT from neos redux but this seems not to be available after compile
        case '@neos/neos-ui/System/INIT': {
            draft.plugins.yoastInfoView = defaultState;
            break;
        }
        case actionTypes.SET_TRANSLATIONS: {
            draft.plugins.yoastInfoView.translations = action.payload;
            backupState.translations = action.payload;
            break;
        }
        case actionTypes.SET_WORKER: {
            draft.plugins.yoastInfoView.worker = action.payload;
            backupState.worker = action.payload;
            break;
        }
        case actionTypes.SET_ANALYSIS: {
            draft.plugins.yoastInfoView.analysis = action.payload;
            backupState.analysis = action.payload;
            break;
        }
    }
});

export const selectors = {
    translations: (state) => $get('plugins.yoastInfoView.translations', state),
    worker: (state) => $get('plugins.yoastInfoView.worker', state),
    analysis: (state) => $get('plugins.yoastInfoView.analysis', state),
};
