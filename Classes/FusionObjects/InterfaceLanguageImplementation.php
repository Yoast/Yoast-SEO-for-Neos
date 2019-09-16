<?php
declare(strict_types=1);

namespace Yoast\YoastSeoForNeos\FusionObjects;

use Neos\Flow\Annotations as Flow;
use Neos\Fusion\FusionObjects\AbstractFusionObject;
use Neos\Neos\Service\UserService;

/**
 * Object to retrieve the current backend users interface language
 */
class InterfaceLanguageImplementation extends AbstractFusionObject
{

    /**
     * @Flow\Inject
     * @var UserService
     */
    protected $userService;

    /**
     * Returns the interface language as string
     *
     * @return string
     */
    public function evaluate(): string
    {
        return $this->userService->getInterfaceLanguage();
    }
}
