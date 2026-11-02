<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\JourneyMilestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JourneyController extends Controller
{
    /**
     * Public endpoint: retrieve published & visible timeline milestones.
     */
    public function index(Request $request): JsonResponse
    {
        $locale = $request->input('locale', 'ar');
        $isPreview = $request->boolean('preview') && auth('sanctum')->check();

        $query = $isPreview
            ? JourneyMilestone::query()->orderBy('sort_order', 'asc')->orderBy('id', 'asc')
            : JourneyMilestone::publiclyVisible();

        $milestones = $query->get()->map(fn (JourneyMilestone $m) => $m->toLocalizedArray($locale));

        return response()->json([
            'status' => 'success',
            'data' => [
                'milestones' => $milestones,
                'count' => $milestones->count(),
            ],
        ]);
    }

    /**
     * Protected Admin endpoint: retrieve all milestones for management.
     */
    public function adminIndex(): JsonResponse
    {
        $milestones = JourneyMilestone::orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'milestones' => $milestones,
                'count' => $milestones->count(),
            ],
        ]);
    }

    /**
     * Protected Admin endpoint: create a new milestone.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => 'required|string|max:50',
            'role_en' => 'required|string|max:255',
            'role_ar' => 'required|string|max:255',
            'description_en' => 'required|string|max:5000',
            'description_ar' => 'required|string|max:5000',
            'company_en' => 'nullable|string|max:255',
            'company_ar' => 'nullable|string|max:255',
            'location_en' => 'nullable|string|max:255',
            'location_ar' => 'nullable|string|max:255',
            'icon_name' => 'nullable|string|max:50',
            'image_url' => 'nullable|string|max:2048',
            'tags' => 'nullable|array',
            'achievements' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'is_visible' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
        ]);

        if (!isset($validated['sort_order'])) {
            $maxOrder = JourneyMilestone::max('sort_order') ?? 0;
            $validated['sort_order'] = $maxOrder + 1;
        }

        $milestone = JourneyMilestone::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Milestone created successfully.',
            'data' => [
                'milestone' => $milestone,
            ],
        ], 201);
    }

    /**
     * Protected Admin endpoint: retrieve a specific milestone.
     */
    public function show(int $id): JsonResponse
    {
        $milestone = JourneyMilestone::find($id);

        if (!$milestone) {
            return response()->json([
                'status' => 'error',
                'message' => 'Milestone not found.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'milestone' => $milestone,
            ],
        ]);
    }

    /**
     * Protected Admin endpoint: update an existing milestone.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $milestone = JourneyMilestone::find($id);

        if (!$milestone) {
            return response()->json([
                'status' => 'error',
                'message' => 'Milestone not found.',
            ], 404);
        }

        $validated = $request->validate([
            'year' => 'sometimes|required|string|max:50',
            'role_en' => 'sometimes|required|string|max:255',
            'role_ar' => 'sometimes|required|string|max:255',
            'description_en' => 'sometimes|required|string|max:5000',
            'description_ar' => 'sometimes|required|string|max:5000',
            'company_en' => 'nullable|string|max:255',
            'company_ar' => 'nullable|string|max:255',
            'location_en' => 'nullable|string|max:255',
            'location_ar' => 'nullable|string|max:255',
            'icon_name' => 'nullable|string|max:50',
            'image_url' => 'nullable|string|max:2048',
            'tags' => 'nullable|array',
            'achievements' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'is_visible' => 'nullable|boolean',
            'is_published' => 'nullable|boolean',
        ]);

        $milestone->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Milestone updated successfully.',
            'data' => [
                'milestone' => $milestone->fresh(),
            ],
        ]);
    }

    /**
     * Protected Admin endpoint: delete a milestone.
     */
    public function destroy(int $id): JsonResponse
    {
        $milestone = JourneyMilestone::find($id);

        if (!$milestone) {
            return response()->json([
                'status' => 'error',
                'message' => 'Milestone not found.',
            ], 404);
        }

        $milestone->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Milestone deleted successfully.',
        ]);
    }

    /**
     * Protected Admin endpoint: batch reorder milestones.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['order'] as $index => $id) {
                JourneyMilestone::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });

        $milestones = JourneyMilestone::orderBy('sort_order', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Milestones reordered successfully.',
            'data' => [
                'milestones' => $milestones,
            ],
        ]);
    }

    /**
     * Protected Admin endpoint: toggle published state.
     */
    public function publish(Request $request, int $id): JsonResponse
    {
        $milestone = JourneyMilestone::find($id);

        if (!$milestone) {
            return response()->json([
                'status' => 'error',
                'message' => 'Milestone not found.',
            ], 404);
        }

        $isPublished = $request->has('is_published')
            ? $request->boolean('is_published')
            : !$milestone->is_published;

        $milestone->update(['is_published' => $isPublished]);

        return response()->json([
            'status' => 'success',
            'message' => $isPublished ? 'Milestone published.' : 'Milestone moved to draft.',
            'data' => [
                'milestone' => $milestone->fresh(),
            ],
        ]);
    }
}
