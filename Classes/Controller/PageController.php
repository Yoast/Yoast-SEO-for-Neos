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

    /**                                                                w
     * Redirects request to the given node in preview mode without the neos backend
     *
     * @param NodeInterface $node
     * @throws StopActionException
     */
    public function renderPreviewPageAction(NodeInterface $node): void
    {
        if (method_exists($this->response, 'setComponentParameter')) {
            /** @noinspection PhpUndefinedClassInspection */
            /** @noinspection PhpUndefinedNamespaceInspection */
            $this->response->setComponentParameter(Neos\Flow\Http\Component\SetHeaderComponent::class, 'Cache-Control', [
                'no-cache',
                'no-store'
            ]);
        } else {
            /** @noinspection PhpUndefinedMethodInspection */
            $this->response->getHeaders()->setCacheControlDirective('no-cache');
            /** @noinspection PhpUndefinedMethodInspection */
            $this->response->getHeaders()->setCacheControlDirective('no-store');
        }

        $previewAction = 'show';
        if (method_exists(NodeController::class, 'previewAction')) {
            $previewAction = 'preview';
        }
        $this->redirect($previewAction, 'Frontend\Node', 'Neos.Neos', [
            'node' => $node,
            'yoastSeoPreviewMode' => true,
        ]);
    }
}
