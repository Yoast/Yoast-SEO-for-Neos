<?php
declare(strict_types=1);

namespace Yoast\YoastSeoForNeos\FusionObjects;

use Neos\Flow\Mvc\Routing\Exception\MissingActionNameException;
use Neos\Flow\Property\Exception as PropertyException;
use Neos\Flow\Security\Exception as SecurityException;
use Neos\Neos\Exception as NeosException;
use Neos\Neos\Fusion\NodeUriImplementation;

/**
 * Create a link to a node and trim the format.
 * Also enforce a slash at the end.
 */
class BaseUriImplementation extends NodeUriImplementation
{
    /**
     * If true, shortcuts will be resolved
     *
     * @return bool
     */
    public function resolveShortcuts(): bool
    {
        return (boolean)$this->fusionValue('resolveShortcuts');
    }

    /**
     * Render the Uri.
     *
     * @return string The rendered URI or NULL if no URI could be resolved for the given node
     * @throws NeosException
     * @throws MissingActionNameException
     * @throws PropertyException
     * @throws SecurityException
     */
    public function evaluate(): string
    {
        $baseNode = null;
        $baseNodeName = $this->getBaseNodeName() ?: 'documentNode';
        $currentContext = $this->runtime->getCurrentContext();
        if (isset($currentContext[$baseNodeName])) {
            $baseNode = $currentContext[$baseNodeName];
        } else {
            throw new NeosException(sprintf('Could not find a node instance in Fusion context with name "%s" and no node instance was given to the node argument. Set a node instance in the Fusion context or pass a node object to resolve the URI.', $baseNodeName), 1552324797);
        }

        try {
            $uri = $this->linkingService->createNodeUri(
                $this->runtime->getControllerContext(),
                $this->getNode(),
                $baseNode,
                $this->getFormat(),
                $this->isAbsolute(),
                $this->getAdditionalParams(),
                $this->getSection(),
                $this->getAddQueryString(),
                $this->getArgumentsToBeExcludedFromQueryString(),
                $this->resolveShortcuts()
            );

            $uri = preg_replace('/\.html/', '/', $uri);
            return rtrim($uri, '/') . '/';
        } catch (NeosException $exception) {
            return '';
        }
    }
}
