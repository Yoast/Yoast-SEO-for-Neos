import React, {PureComponent} from 'react';
import style from "../style.css";
import PropTypes from "prop-types";
import {neos} from '@neos-project/neos-ui-decorators';
import {Icon} from '@neos-project/react-ui-components';

@neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
}))
export default class ResultGroup extends PureComponent {
    static propTypes = {
        heading: PropTypes.string,
        results: PropTypes.array,
    };

    renderRating = (result, id) => {
        return result && (
            <p key={id} className={style.yoastInfoView__content}
               title={this.props.i18nRegistry.translate('inspector.resultType.' + result.id, result.id, {}, 'Yoast.YoastSeoForNeos')}>
                <i className={style['yoastInfoView__rating_circle'] + ' ' + style['yoastInfoView__rating_' + result.rating]}/>
                <span dangerouslySetInnerHTML={{__html: result.text}}/>
            </p>
        );
    };

    render() {
        const {heading, results} = this.props;
        return (
            <div className={style.yoastInfoView__result_group}>
                <span><Icon icon={'caret-down'}/> {heading} ({results.length})</span>
                {results.map((result, index) => this.renderRating(result, index))}
            </div>
        )
    }
}
