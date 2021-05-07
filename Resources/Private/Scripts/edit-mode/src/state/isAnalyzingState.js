import { atom } from 'recoil';

const isAnalyzingState = atom({
    key: 'isAnalyzingState',
    default: false,
});

export default isAnalyzingState;
