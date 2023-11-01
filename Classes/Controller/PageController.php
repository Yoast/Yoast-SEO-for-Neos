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

use Neos\ContentRepository\Core\Projection\ContentGraph\Node;
use Neos\Flow\Mvc\Controller\ActionController;
use Neos\Flow\Mvc\Exception\StopActionException;

class PageController extends ActionController
{

    /**
     * Redirects request to the given node in preview mode without the neos backend
     *
     * @param Node $node
     * @throws StopActionException
     */
    public function renderPreviewPageAction(Node $node): void
    {
        $this->forward('preview', 'Frontend\Node', 'Neos.Neos', [
            'node' => $node,
            'yoastSeoPreviewMode' => true,
        ]);
    }
}
