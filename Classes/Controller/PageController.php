<?php
namespace Yoast\YoastSeoForNeos\Controller;

use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\Flow\Mvc\Controller\ActionController;

class PageController extends ActionController
{

    /**
     * Redirects request to the given node in preview mode without the neos backend
     *
     * @param NodeInterface $node
     * @throws \Neos\Flow\Mvc\Exception\StopActionException
     */
    public function renderPreviewPageAction(NodeInterface $node)
    {
        $this->response->getHeaders()->setCacheControlDirective('no-cache');
        $this->response->getHeaders()->setCacheControlDirective('no-store');
        $this->redirect('show', 'Frontend\Node', 'Neos.Neos', [
            'node' => $node,
            'yoastSeoPreviewMode' => true,
        ]);
    }
}
