import YoastInfoView from './YoastInfoView';

import manifest from '@neos-project/neos-ui-extensibility';

manifest('Shel.Neos.YoastSeo:YoastInfoView', {}, globalRegistry => {
    const viewsRegistry = globalRegistry.get('inspector').get('views');

    viewsRegistry.set('Shel.Neos.YoastSeo/Inspector/Views/YoastInfoView', {
        component: YoastInfoView
    });
});
