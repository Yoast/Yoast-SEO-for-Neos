import { atom } from 'recoil';

const analysisState = atom({
    key: 'analysisState',
    default: {
        allResults: {},
        seoResults: {
            rating: null,
            icon: 'loading-spinner',
            color: 'grey',
            score: null,
            problemsResults: [],
            improvementsResults: [],
            goodResults: [],
            considerationsResults: [],
            errorsResults: [],
        },
        readabilityResults: {
            rating: null,
            icon: 'loading-spinner',
            color: 'grey',
            score: null,
            problemsResults: [],
            improvementsResults: [],
            goodResults: [],
            considerationsResults: [],
            errorsResults: [],
        },
    },
});

export default analysisState;
