import { atom } from 'recoil';

const errorState = atom({
    key: 'errorState',
    default: '',
});

export default errorState;
