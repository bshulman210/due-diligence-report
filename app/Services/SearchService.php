<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SearchService
{
    protected array $queryTemplates = [
        'breach OR charge OR crime OR fraud OR laundering OR guilt OR scam OR bankrupt OR allege OR embezzle OR sanction OR investigate OR lawsuit OR corrupt OR arrest',
        'fraud OR lien OR judgment OR suit OR convict OR investigate OR allege OR crime OR scheme OR inquiry OR settle',
        'plea OR barred OR terrorist OR traffic OR narcotic OR judgment OR criminal OR bribe OR scam OR launder OR corrupt OR charges OR hearing OR civil OR corruption',
    ];

    protected array $queryLabels = [
        'Search 1: Criminal & Financial Red Flags',
        'Search 2: Legal & Fraud Indicators',
        'Search 3: Criminal & Corruption Keywords',
    ];

    public function buildQuery(string $name, string $cityState, int $queryIndex): string
    {
        return '"' . $name . '" "' . $cityState . '" ' . $this->queryTemplates[$queryIndex];
    }

    public function executeSearch(string $query): array
    {
        $apiKey = config('services.serper.api_key');

        if (empty($apiKey)) {
            throw new \RuntimeException('Serper API key is not configured. Check your .env file.');
        }

        $response = Http::withHeaders([
            'X-API-KEY' => $apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://google.serper.dev/search', [
            'q' => $query,
            'gl' => 'us',
            'hl' => 'en',
            'num' => 10,
        ]);

        if (!$response->successful()) {
            $error = $response->json('message', 'Unknown API error');
            throw new \RuntimeException('Serper API error: ' . $error);
        }

        $data = $response->json();
        $organic = $data['organic'] ?? [];

        $links = [];
        foreach ($organic as $item) {
            $links[] = [
                'title' => $item['title'] ?? 'No title',
                'url' => $item['link'] ?? '',
                'snippet' => $item['snippet'] ?? '',
            ];
        }

        $totalResults = number_format((int) ($data['searchParameters']['totalResults'] ?? count($links)));

        return [
            'links' => $links,
            'totalResults' => $totalResults,
        ];
    }

    public function runSearches(string $name, string $city, string $state): array
    {
        $cityState = $city . ', ' . $state;
        $results = [];

        for ($i = 0; $i < 3; $i++) {
            $query = $this->buildQuery($name, $cityState, $i);

            $searchResult = $this->executeSearch($query);

            $results[] = [
                'label' => $this->queryLabels[$i],
                'query' => $query,
                'links' => $searchResult['links'],
                'totalResults' => $searchResult['totalResults'],
            ];
        }

        return $results;
    }
}
