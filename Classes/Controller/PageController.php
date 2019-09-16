<?php
declare(strict_types=1);

namespace Yoast\YoastSeoForNeos\Controller;

use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\Flow\Mvc\Controller\ActionController;
use Neos\Flow\Mvc\Exception\StopActionException;

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
        $this->redirect('show', 'Frontend\Node', 'Neos.Neos', [
            'node' => $node,
            'yoastSeoPreviewMode' => true,
        ]);
    }
}
