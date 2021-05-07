import { atom } from 'recoil';

const pageIsLoadingState = atom({
    key: 'pageIsLoadingState',
    default: false,
});

export default pageIsLoadingState;
