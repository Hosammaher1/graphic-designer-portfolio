<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Analytics\AnalyticsEventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    protected AnalyticsEventService $analyticsEventService;

    public function __construct(AnalyticsEventService $analyticsEventService)
    {
        $this->analyticsEventService = $analyticsEventService;
    }

    /**
     * Record a privacy-first analytics event with consent enforcement and bot heuristics.
     */
    public function recordEvent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_type' => ['nullable', 'string', 'in:page_view,project_view,custom'],
            'path' => ['required', 'string', 'max:255'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'referrer' => ['nullable', 'string', 'max:1000'],
            'locale' => ['nullable', 'string', 'in:ar,en'],
            'consent_token' => ['nullable', 'string', 'max:64'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
        ]);

        $result = $this->analyticsEventService->recordEvent($validated, $request);

        return response()->json($result, 200);
    }
}
