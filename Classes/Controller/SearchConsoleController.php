<?php
namespace Shel\Neos\YoastSeo\Controller;

use Neos\Error\Messages\Message;
use Neos\Flow\Annotations as Flow;
use Neos\Neos\Controller\Module\AbstractModuleController;
use Neos\Neos\Domain\Model\Domain;
use Neos\Neos\Domain\Model\Site;
use Shel\Neos\YoastSeo\Service\GoogleWebmasters;

class SearchConsoleController extends AbstractModuleController
{
    /**
     * @Flow\Inject
     * @var \Neos\Neos\Domain\Repository\SiteRepository
     */
    protected $siteRepository;

    /**
     * @Flow\Inject
     * @var GoogleWebmasters
     */
    protected $webmasters;

    /**
     * @param Domain $selectedDomain
     * @return void
     */
    public function indexAction(Domain $selectedDomain = null)
    {
        /** @var array<Site> $availableSites */
        $availableSites = $this->siteRepository->findOnline()->toArray();
        $availableDomains = array_reduce($availableSites, function (array $carry, Site $site) {
            return array_merge($carry, $site->getActiveDomains()->toArray());
        }, []);

        $combinedCrawlErrorData = [];
        if ($selectedDomain !== null && in_array($selectedDomain, $availableDomains)) {
            $combinedCrawlErrorData = $this->webmasters->getCrawlErrors($selectedDomain->__toString());
        }

        $this->view->assignMultiple([
            'availableDomains' => $availableDomains,
            'selectedDomain' => $selectedDomain,
            'crawlErrorData' => $combinedCrawlErrorData,
        ]);
    }

    /**
     * @return void
     */
    public function errorMessageAction()
    {
        $client = $this->webmasters->getClient();

        if ($client instanceof \Google_Client) {
            $authenticated = $client->getAccessToken() !== null;
        } else {
            $authenticated = false;
        }
        $this->view->assign('authenticated', $authenticated);
    }

    /**
     * Marks a crawl error as resolved via the Google Webmasters API
     *
     * @param Domain $selectedDomain
     * @param string $url
     * @param string $category
     * @param string $platform
     * @throws \Neos\Flow\Mvc\Exception\StopActionException
     */
    public function markCrawlErrorAsResolvedAction(
        Domain $selectedDomain = null,
        $url = '',
        $category = '',
        $platform = ''
    ) {
        if ($selectedDomain && $url && $category && $platform) {
            $this->webmasters->markCrawlErrorAsResolved(
                $selectedDomain->__toString(), $url, $category, $platform);
            $this->addFlashMessage(sprintf('Marked error for url "%s" as resolved', $url), 'Success',
                Message::SEVERITY_OK);
        } else {
            $this->addFlashMessage('Missing parameters for mark error as resolved!', 'Failure',
                Message::SEVERITY_ERROR);
        }

        $this->redirect('index', null, null, [
            'selectedDomain' => $selectedDomain,
        ]);
    }

    /**
     * Catch Google service exceptions and forward to the "apiError" action to show
     * an error message.
     *
     * @return void
     * @throws \Neos\Flow\Mvc\Exception\ForwardException
     * @throws \Neos\Flow\Mvc\Exception\StopActionException
     */
    protected function callActionMethod()
    {
        try {
            parent::callActionMethod();
        } catch (\Google_Service_Exception $exception) {
            $errors = array_map(function ($error) {
                return $error['message'];
            }, $exception->getErrors());

            $this->addFlashMessage('%1$s', 'Google API error', Message::SEVERITY_ERROR,
                ['message' => join('<br>', $errors), 1551888767]);
            $this->forward('errorMessage');
        }
    }
}
