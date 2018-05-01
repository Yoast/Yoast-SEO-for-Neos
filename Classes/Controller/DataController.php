<?php
namespace Shel\Neos\YoastSeo\Controller;

use Neos\Flow\Annotations as Flow;
use Neos\Flow\Mvc\Controller\ActionController;
use Neos\Flow\Mvc\View\JsonView;
use Neos\Neos\Service\UserService;

class DataController extends ActionController
{

    /**
     * @var array
     */
    protected $viewFormatToObjectNameMap = [
        'json' => JsonView::class
    ];

    /**
     * @Flow\InjectConfiguration(path="languageToLocaleMapping", package="Shel.Neos.YoastSeo")
     * @var array
     */
    protected $languageToLocaleMapping = [
        'da' => 'da_DK',
        'de' => 'de_DE',
        'en' => '',
        'es' => 'es_ES',
        'fi' => 'fi',
        'fr' => 'fr_FR',
        'km' => '',
        'lv' => '',
        'nl' => 'nl_NL',
        'no' => '',
        'pl' => 'pl_PL',
        'pt-BR' => 'pt_BR',
        'ru' => 'ru_RU',
        'zh-CN' => 'zh_CN',
    ];

    /**
     * @Flow\Inject
     * @var UserService
     */
    protected $userService;

    /**
     * Returns json data containing the Yoast SEO translations for the current users backend language
     *
     * @Flow\SkipCsrfProtection
     */
    public function fetchTranslationsAction() : void
    {
        $interfaceLanguage = $this->userService->getInterfaceLanguage();

        $locale = $this->getValidLocale($interfaceLanguage);
        $translationData = false;
        $error = '';

        if (!empty($locale)) {
            try {
                $translationData = file_get_contents('resource://Shel.Neos.YoastSeo/Private/Languages/wordpress-seo-' . $locale . '.json');
                $translationData = json_decode(str_replace('wordpress-seo', 'js-text-analysis', $translationData), true);
            } catch (\Exception $e) {
                $error = $e->getMessage();
            }
        }

        if ($translationData) {
            $result = $translationData;
        } else {
            $result = [
                'error' => $error ? $error : 'No translation available for language ' . $interfaceLanguage
            ];
        }

        $this->view->assign('value', $result);
    }

    /**
     * Returns a locale based on the given interface language
     *
     * @param string $interfaceLanguage
     * @return string
     */
    protected function getValidLocale($interfaceLanguage) : string
    {
        if (array_key_exists($interfaceLanguage, $this->languageToLocaleMapping)) {
            return $this->languageToLocaleMapping[$interfaceLanguage];
        }
        return $interfaceLanguage;
    }
}
