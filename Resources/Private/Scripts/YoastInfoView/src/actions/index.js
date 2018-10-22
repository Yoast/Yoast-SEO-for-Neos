import {createAction} from 'redux-actions';
import {Map} from 'immutable';
import {$set} from 'plow-js';

import {handleActions} from '@neos-project/utils-redux';
import {actionTypes as system} from '@neos-project/neos-ui-redux-store';

const SET_TRANSLATIONS = 'SET_TRANSLATIONS';

//
// Export the action types
//
export const actionTypes = {
    SET_TRANSLATIONS
};

const setTranslations = createAction(SET_TRANSLATIONS, translations => translations);

//
// Export the actions
//
export const actions = {
    setTranslations
};

//
// Export the reducer
//
export const reducer = handleActions({
    [system.INIT]: () => $set('ui.yoastInfoView', new Map({
        translations: {}
    })),
    [SET_TRANSLATIONS]: translations => $set('ui.yoastInfoView', new Map({
        translations: translations
    }))
});
