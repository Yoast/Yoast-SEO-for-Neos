import manifest from '@neos-project/neos-ui-extensibility';

import YoastInfoView from './YoastInfoView';
import { reducer } from './actions';

manifest('Yoast.YoastSeoForNeos:YoastInfoView', {}, (globalRegistry) => {
    const viewsRegistry = globalRegistry.get('inspector').get('views');
    const reducersRegistry = globalRegistry.get('reducers');

    viewsRegistry.set('Yoast.YoastSeoForNeos/Inspector/Views/YoastInfoView', {
        component: YoastInfoView,
    });

    reducersRegistry.set('neos-yoast-seo', { reducer });
});
