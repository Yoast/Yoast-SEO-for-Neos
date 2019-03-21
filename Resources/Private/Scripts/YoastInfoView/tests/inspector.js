import Page from './backendPageModel';
import {Role} from 'testcafe';
import {waitForReact} from 'testcafe-react-selectors';

fixture`My first fixture`
    .page`https://helzle.it.test/neos`;

const admin = Role('https://helzle.it.test/neos', async t => {
    await t
        .typeText('#username', 'admin')
        .typeText('#password', 'password')
        .click('.neos-login-btn');
});

const page = new Page();

test('The Yoast SEO tab appears in the inspector tabs', async t => {
    await t
        .useRole(admin);

        await waitForReact();
        await t.expect(page.yoastTab.exists).ok();
});
