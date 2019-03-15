import YoastInfoView from './YoastInfoView';

import manifest from '@neos-project/neos-ui-extensibility';
import {reducer} from './actions';

manifest('Shel.Neos.YoastSeo:YoastInfoView', {}, globalRegistry => {
    const viewsRegistry = globalRegistry.get('inspector').get('views');
    const reducersRegistry = globalRegistry.get('reducers');

    viewsRegistry.set('Shel.Neos.YoastSeo/Inspector/Views/YoastInfoView', {
        component: YoastInfoView
    });

    reducersRegistry.set('neos-yoast-seo', {reducer: reducer});
});
