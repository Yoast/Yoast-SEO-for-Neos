import Page from './backendPageModel';
import {Role} from 'testcafe';
import {waitForReact} from 'testcafe-react-selectors';

fixture`Backend`
    .page`https://helzle.it.test/neos`
    .beforeEach(async (t) => {
        await t.useRole(admin);
        await waitForReact();
    });

const admin = Role('https://helzle.it.test/neos', async t => {
    await t
        .typeText('#username', 'admin')
        .typeText('#password', 'password')
        .click('.neos-login-btn');
});

test('The Yoast SEO tab appears in the inspector tabs', async t => {
    await t.expect(Page.yoastTab.exists).ok();
});
