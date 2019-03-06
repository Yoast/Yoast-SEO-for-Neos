<?php
namespace Shel\Neos\YoastSeo\Service;

use Google_Client;
use Neos\Flow\Annotations as Flow;
use Neos\Neos\Routing\FrontendNodeRoutePartHandlerInterface;

/**
 * Extend the base Google Analytics API service
 *
 * @Flow\Scope("singleton")
 */
class GoogleWebmasters extends \Google_Service_Webmasters
{
    /**
     * Datetime values from Google have this format: `2019-02-20T08:12:53.000Z`
     */
    const DATETIME_FORMAT = 'Y-m-d\TH:i:s.uP';

    /**
     * @Flow\Inject
     * @var FrontendNodeRoutePartHandlerInterface
     */
    protected $frontendNodeRoutePartHandler;

    /**
     * @inheritdoc
     */
    public function __construct(Google_Client $client)
    {
        parent::__construct($client);

        $client->addScope(\Google_Service_Webmasters::WEBMASTERS);
    }

    /**
     * @param string $siteUrl
     * @return array
     */
    public function getCrawlErrors($siteUrl): array
    {
        $urlCrawlErrorsCounts = $this->urlcrawlerrorscounts->query($siteUrl);
        $combinedCrawlErrorData = [];
        $this->frontendNodeRoutePartHandler->setName('node');

        foreach ($urlCrawlErrorsCounts['countPerTypes'] as $urlCrawlErrorGroup) {
            $count = intval($urlCrawlErrorGroup['entries'][0]['count']);

            if ($count > 0) {
                $category = $urlCrawlErrorGroup['category'];
                $platform = $urlCrawlErrorGroup['platform'];
                $samples = $this->urlcrawlerrorssamples->listUrlcrawlerrorssamples(
                    $siteUrl, $category, $platform);

                foreach ($samples as $sample) {
                    $pageUrl = $sample['pageUrl'];
                    $normalizedPageUrl = (strpos($pageUrl, '/') !== 0 ? '/' : '') . $pageUrl;

                    $matchedNode = null;
                    $matchedPath = $this->frontendNodeRoutePartHandler->match($pageUrl);
                    if ($matchedPath) {
                        $matchedNode = $this->frontendNodeRoutePartHandler->getValue();
                    }

                    $lastCrawled = \DateTime::createFromFormat(self::DATETIME_FORMAT, $sample['lastCrawled']);
                    $firstDetected = \DateTime::createFromFormat(self::DATETIME_FORMAT, $sample['firstDetected']);

                    $combinedCrawlErrorData[] = [
                        'category' => $category,
                        'platform' => $platform,
                        'pageUrl' => $sample['pageUrl'],
                        'normalizedPageUrl' => $normalizedPageUrl,
                        'matchedNode' => $matchedNode,
                        'lastCrawled' => $lastCrawled,
                        'firstDetected' => $firstDetected,
                        'responseCode' => $sample['responseCode'],
                        'linkedFromUrls' => isset($sample['urlDetails']['linkedFromUrls']) ? $sample['urlDetails']['linkedFromUrls'] : [],
                    ];
                }

            }
        }

        return $combinedCrawlErrorData;
    }

    /**
     * @param $siteUrl
     * @param $url
     * @param $category
     * @param $platform
     * @return bool
     */
    public function markCrawlErrorAsResolved($siteUrl, $url, $category, $platform): bool
    {
        if ($siteUrl && $url && $category && $platform) {
            $this->urlcrawlerrorssamples->markAsFixed($siteUrl, $url, $category, $platform);
            return true;
        }
        return false;
    }
}
