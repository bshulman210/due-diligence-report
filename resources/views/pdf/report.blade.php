<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Due Diligence Report - {{ $name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.4;
            padding: 20px 40px;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 20px;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .header .subtitle {
            font-size: 12px;
            color: #6b7280;
        }

        .info-box {
            background-color: #f0f4ff;
            border: 1px solid #bfdbfe;
            padding: 10px 15px;
            margin-bottom: 20px;
        }

        .info-box table {
            width: 100%;
        }

        .info-box td {
            padding: 3px 0;
        }

        .info-box .label {
            font-weight: bold;
            color: #1e40af;
            width: 120px;
        }

        .section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 14px;
            color: #1e40af;
            border-bottom: 1px solid #93c5fd;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }

        .query-text {
            font-size: 8px;
            color: #6b7280;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 8px;
            margin-bottom: 5px;
            word-wrap: break-word;
        }

        .total-results {
            font-size: 9px;
            color: #6b7280;
            margin-bottom: 10px;
        }

        .result-item {
            margin-bottom: 16px;
        }

        .result-site {
            font-size: 9px;
            color: #4d5156;
            margin-bottom: 2px;
        }

        .result-title a {
            font-size: 12px;
            color: #1a0dab;
            text-decoration: none;
        }

        .result-snippet {
            font-size: 9px;
            color: #4d5156;
            line-height: 1.5;
            margin-top: 3px;
        }

        .no-results {
            color: #9ca3af;
            font-style: italic;
            padding: 10px 0;
        }

        .page-break {
            page-break-after: always;
        }

        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #d1d5db;
            font-size: 8px;
            color: #9ca3af;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Open Source Research Report</h1>
        <div class="subtitle">Confidential - For Internal Use Only</div>
    </div>

    <div class="info-box">
        <table>
            <tr>
                <td class="label">Subject Name:</td>
                <td>{{ $name }}</td>
            </tr>
            <tr>
                <td class="label">Location:</td>
                <td>{{ $city }}, {{ $state }}</td>
            </tr>
            <tr>
                <td class="label">Report Generated:</td>
                <td>{{ $generatedAt }}</td>
            </tr>
        </table>
    </div>

    @foreach($results as $index => $result)
        <div class="section">
            <h2 class="section-title">{{ $result['label'] }}</h2>

            <div class="query-text">
                <strong>Search Query:</strong> {{ $result['query'] }}
            </div>

            <div class="total-results">
                Approximately {{ $result['totalResults'] }} results found
            </div>

            @if(!empty($result['links']))
                @foreach($result['links'] as $link)
                    <div class="result-item">
                        <div class="result-site">{{ parse_url($link['url'], PHP_URL_HOST) }}</div>
                        <div class="result-title"><a href="{{ $link['url'] }}">{{ $link['title'] }}</a></div>
                        @if(!empty($link['snippet']))
                            <div class="result-snippet">{{ $link['snippet'] }}</div>
                        @endif
                    </div>
                @endforeach
            @else
                <p class="no-results">No results were found for this search query.</p>
            @endif
        </div>

        @if($index < count($results) - 1)
            <div class="page-break"></div>
        @endif
    @endforeach

    <div class="footer">
        <p>This report was generated automatically using publicly available search engine results.</p>
        <p>It is intended for internal due diligence purposes only and does not constitute legal advice.</p>
        <p>Results should be reviewed and verified by qualified personnel before making any decisions.</p>
    </div>
</body>
</html>
