import {ReactSelector} from 'testcafe-react-selectors';

export default class Page {
    constructor() {
        this.yoastTab = ReactSelector('Inspector TabMenuItem').withProps('tooltip', 'Yoast SEO');
    }
}
