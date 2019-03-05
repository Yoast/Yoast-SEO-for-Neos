<?php
namespace Shel\Neos\YoastSeo\Controller;

use Neos\Neos\Controller\Module\AbstractModuleController;

class SearchConsoleController extends AbstractModuleController
{

    /**
     * @return void
     */
    public function indexAction()
    {
        $client = new Google_Client();
    }
}
