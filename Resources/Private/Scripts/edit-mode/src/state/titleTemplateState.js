import { atom } from 'recoil';

const titleTemplateState = atom({
    key: 'titleTemplateState',
    default: '{title}',
});

export default titleTemplateState;
