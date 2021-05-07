import { atom } from 'recoil';

const firstPageLoadCompleteState = atom({
    key: 'firstPageLoadCompleteState',
    default: false,
});

export default firstPageLoadCompleteState;
