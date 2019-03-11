import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {$transform} from 'plow-js';
import {neos} from '@neos-project/neos-ui-decorators';
import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {Icon, Button} from '@neos-project/react-ui-components';

@connect($transform({
    editPreviewMode: selectors.UI.EditPreviewMode.currentEditPreviewMode,
}), {
    setEditPreviewMode: actions.UI.EditPreviewMode.set,
})
@neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
}))
export default class SnippetPreviewButton extends PureComponent {

    handleToggleSnippetPreviewClick = () => {
        const {setEditPreviewMode, editPreviewMode} = this.props;
        setEditPreviewMode(editPreviewMode === 'shelYoastSeoView' ? 'inPlace' : 'shelYoastSeoView');
    };

    render () {
        return (
            <Button style="lighter" hoverStyle="brand" onClick={this.handleToggleSnippetPreviewClick}>
                <span>
                    <Icon icon={'edit'}/>
                    &nbsp;{this.props.i18nRegistry.translate('inspector.editSnippetPreview', 'Toggle Snippet Preview', {}, 'Shel.Neos.YoastSeo')}
                </span>
            </Button>
        );
    };
}
