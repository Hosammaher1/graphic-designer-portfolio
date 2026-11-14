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
        // Resolve project slug to integer id if string is provided
        $projectId = $request->input('project_id');
        if ($projectId !== null && !is_numeric($projectId)) {
            $foundProj = \App\Models\Project::where('slug', (string) $projectId)->first();
            $request->merge(['project_id' => $foundProj ? $foundProj->id : null]);
        }

        $validated = $request->validate([
            'event_type' => ['nullable', 'string', 'in:page_view,project_view,custom'],
            'path' => ['required', 'string', 'max:255'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'referrer' => ['nullable', 'string', 'max:1000'],
            'locale' => ['nullable', 'string', 'in:ar,en'],
            'consent_token' => ['nullable', 'string', 'max:64'],
            'consent_status' => ['nullable', 'string', 'in:accepted,customized,rejected,withdrawn'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
        ]);

        $result = $this->analyticsEventService->recordEvent($validated, $request);

        return response()->json($result, 200);
    }
}
