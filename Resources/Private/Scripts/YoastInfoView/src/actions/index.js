import {createAction} from 'redux-actions';
import {Map} from 'immutable';
import {$set} from 'plow-js';

import {handleActions} from '@neos-project/utils-redux';
import {actionTypes as system} from '@neos-project/neos-ui-redux-store';

const SET_TRANSLATIONS = 'SET_TRANSLATIONS';
const SET_WORKER = 'SET_WORKER';

//
// Export the action types
//
export const actionTypes = {
    SET_TRANSLATIONS,
    SET_WORKER,
};

const setTranslations = createAction(SET_TRANSLATIONS, translations => translations);
const setWorker = createAction(SET_WORKER, worker => worker);

//
// Export the actions
//
export const yoastActions = {
    setTranslations,
    setWorker,
};

//
// Export the reducer
//
export const reducer = handleActions({
    [system.INIT]: () => $set('ui.yoastInfoView', new Map({
        translations: {},
        worker: null,
    })),
    [SET_TRANSLATIONS]: translations => $set('ui.yoastInfoView.translations', translations),
    [SET_WORKER]: worker=> $set('ui.yoastInfoView.worker', worker),
});
