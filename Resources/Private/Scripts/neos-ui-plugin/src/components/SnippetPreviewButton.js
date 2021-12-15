import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {$transform} from 'plow-js';
import {neos} from '@neos-project/neos-ui-decorators';
import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {Icon, Button} from '@neos-project/react-ui-components';
import PropTypes from "prop-types";

@connect($transform({
    editPreviewMode: selectors.UI.EditPreviewMode.currentEditPreviewMode,
}), {
    setEditPreviewMode: actions.UI.EditPreviewMode.set,
})
@neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
}))
export default class SnippetPreviewButton extends PureComponent {

    static propTypes = {
        defaultEditPreviewMode: PropTypes.string.isRequired,
    };

    handleToggleSnippetPreviewClick = () => {
        const {setEditPreviewMode, editPreviewMode, defaultEditPreviewMode} = this.props;
        setEditPreviewMode(editPreviewMode === 'yoastSeoView' ? defaultEditPreviewMode : 'yoastSeoView');
    };

    render () {
        return (
            <Button style="lighter" hoverStyle="brand" onClick={this.handleToggleSnippetPreviewClick}>
                <span>
                    <Icon icon={'edit'}/>
                    &nbsp;{this.props.i18nRegistry.translate('inspector.editSnippetPreview', 'Toggle Snippet Preview', {}, 'Yoast.YoastSeoForNeos')}
                </span>
            </Button>
        );
    };
}
