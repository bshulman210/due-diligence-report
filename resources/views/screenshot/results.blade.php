<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #fff;
            padding: 20px 30px;
            width: 1280px;
        }
        .search-bar {
            background: #f1f3f4;
            border-radius: 24px;
            padding: 12px 20px;
            margin-bottom: 8px;
            font-size: 16px;
            color: #202124;
            border: 1px solid #dfe1e5;
        }
        .stats {
            color: #70757a;
            font-size: 13px;
            padding: 8px 0 16px 0;
            border-bottom: 1px solid #ebebeb;
            margin-bottom: 16px;
        }
        .result {
            margin-bottom: 24px;
            max-width: 652px;
        }
        .result-url-line {
            font-size: 14px;
            color: #202124;
            margin-bottom: 4px;
        }
        .result-url-line .site {
            color: #4d5156;
            font-size: 12px;
        }
        .result-url-line .url {
            color: #4d5156;
            font-size: 12px;
        }
        .result-title {
            font-size: 20px;
            color: #1a0dab;
            line-height: 1.3;
            margin-bottom: 4px;
            cursor: pointer;
        }
        .result-title:hover {
            text-decoration: underline;
        }
        .result-snippet {
            font-size: 14px;
            color: #4d5156;
            line-height: 1.58;
        }
        .no-results {
            color: #70757a;
            font-size: 16px;
            padding: 40px 0;
        }
    </style>
</head>
<body>
    <div class="search-bar">{{ $query }}</div>
    <div class="stats">About {{ $totalResults }} results</div>

    @if(!empty($links))
        @foreach($links as $link)
            <div class="result">
                <div class="result-url-line">
                    <span class="site">{{ parse_url($link['url'], PHP_URL_HOST) ?? '' }}</span>
                    <span class="url"> › {{ Str::limit(parse_url($link['url'], PHP_URL_PATH) ?? '', 60) }}</span>
                </div>
                <div class="result-title">{{ $link['title'] }}</div>
                @if(!empty($link['snippet']))
                    <div class="result-snippet">{{ $link['snippet'] }}</div>
                @endif
            </div>
        @endforeach
    @else
        <div class="no-results">No results found for this search.</div>
    @endif
</body>
</html>
