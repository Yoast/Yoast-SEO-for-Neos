<?php
declare(strict_types=1);

namespace Yoast\YoastSeoForNeos\Controller;

/**
 * This file is part of the Yoast.YoastSeoForNeos package
 *
 * (c) 2020
 * Sebastian Helzle <yoast@helzle.it>
 *
 * This package is Open Source Software. For the full copyright and license
 * information, please view the LICENSE file which was distributed with this
 * source code.
 */

use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\Flow\Mvc\Controller\ActionController;
use Neos\Flow\Mvc\Exception\StopActionException;
use Neos\Neos\Controller\Frontend\NodeController;

class PageController extends ActionController
{

    /**
     * Redirects request to the given node in preview mode without the neos backend
     *
     * @param NodeInterface $node
     * @throws StopActionException
     */
    public function renderPreviewPageAction(NodeInterface $node): void
    {
        $previewAction = 'preview';

        # Neos 5.x uses the 'preview' action which also sets cache headers
        # So for Neos 4.x we have to add the cache headers and use the 'show' action
        if (!method_exists(NodeController::class, 'previewAction')) {
            $previewAction = 'show';
            /** @noinspection PhpUndefinedMethodInspection */
            $this->response->getHeaders()->setCacheControlDirective('no-cache, no-store, must-revalidate');
        }

        $this->forward($previewAction, 'Frontend\Node', 'Neos.Neos', [
            'node' => $node,
            'yoastSeoPreviewMode' => true,
        ]);
    }
}
