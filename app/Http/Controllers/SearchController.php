<?php

namespace App\Http\Controllers;

use App\Services\SearchService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    public function index()
    {
        return view('search');
    }

    public function search(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
        ]);

        set_time_limit(300);

        try {
            $service = new SearchService();
            $results = $service->runSearches(
                $validated['name'],
                $validated['city'],
                $validated['state']
            );

            $pdf = Pdf::loadView('pdf.report', [
                'name' => $validated['name'],
                'city' => $validated['city'],
                'state' => $validated['state'],
                'results' => $results,
                'generatedAt' => now()->setTimezone('America/New_York')->format('F j, Y \a\t g:i A') . ' ET',
            ]);

            $pdf->setPaper('letter', 'portrait');
            $pdf->setOption('isRemoteEnabled', true);

            $slug = Str::slug($validated['name']);
            $date = now()->format('Y-m-d');
            $filename = "due-diligence-{$slug}-{$date}.pdf";

            return $pdf->download($filename);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
