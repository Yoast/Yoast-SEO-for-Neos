import {ReactSelector} from 'testcafe-react-selectors';

export default class Page {
    static yoastTab = ReactSelector('Inspector TabMenuItem').withProps('tooltip', 'Yoast SEO');
}
