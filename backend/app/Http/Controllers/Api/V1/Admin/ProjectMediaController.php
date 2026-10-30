<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectMediaController extends Controller
{
    public function attach(Request $request, int $projectId): JsonResponse
    {
        $project = Project::find($projectId);
        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $validated = $request->validate([
            'media_asset_id' => ['required', 'integer', 'exists:media_assets,id'],
            'caption_ar'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'caption_en'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_cover'       => ['sometimes', 'boolean'],
            'sort_order'     => ['sometimes', 'integer', 'min:0'],
        ]);

        $isCover = $request->boolean('is_cover', false);

        if (! isset($validated['sort_order'])) {
            $maxSort = ProjectMedia::where('project_id', $projectId)->max('sort_order') ?? 0;
            $validated['sort_order'] = $maxSort + 1;
        }

        $projectMedia = DB::transaction(function () use ($project, $validated, $isCover) {
            if ($isCover) {
                ProjectMedia::where('project_id', $project->id)->update(['is_cover' => false]);
                $project->update(['cover_media_id' => $validated['media_asset_id']]);
            }

            return ProjectMedia::create([
                'project_id'     => $project->id,
                'media_asset_id' => $validated['media_asset_id'],
                'caption_ar'     => $validated['caption_ar'] ?? null,
                'caption_en'     => $validated['caption_en'] ?? null,
                'is_cover'       => $isCover,
                'sort_order'     => $validated['sort_order'],
            ]);
        });

        return response()->json([
            'status' => 'success',
            'data'   => ['project_media' => $projectMedia],
        ], 201);
    }

    public function reorder(Request $request, int $projectId): JsonResponse
    {
        $project = Project::find($projectId);
        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $validated = $request->validate([
            'items'              => ['required', 'array', 'min:1'],
            'items.*.id'         => ['required', 'integer'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $validIds = ProjectMedia::where('project_id', $projectId)->pluck('id')->all();

        foreach ($validated['items'] as $item) {
            if (! in_array($item['id'], $validIds, true)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Media item [{$item['id']}] does not belong to this project.",
                ], 422);
            }
        }

        DB::transaction(function () use ($validated, $projectId) {
            foreach ($validated['items'] as $item) {
                ProjectMedia::where('id', $item['id'])
                    ->where('project_id', $projectId)
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Project media reordered successfully.',
        ]);
    }

    public function setCover(int $projectId, int $mediaId): JsonResponse
    {
        $project = Project::find($projectId);
        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $pm = ProjectMedia::where('id', $mediaId)
            ->where('project_id', $projectId)
            ->first();

        if (! $pm) {
            return response()->json(['status' => 'error', 'message' => 'Media item not found for this project.'], 404);
        }

        DB::transaction(function () use ($project, $pm) {
            ProjectMedia::where('project_id', $project->id)->update(['is_cover' => false]);
            $pm->update(['is_cover' => true]);
            $project->update(['cover_media_id' => $pm->media_asset_id]);
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Cover image updated successfully.',
        ]);
    }

    public function detach(int $projectId, int $mediaId): JsonResponse
    {
        $project = Project::find($projectId);
        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $pm = ProjectMedia::where('id', $mediaId)
            ->where('project_id', $projectId)
            ->first();

        if (! $pm) {
            return response()->json(['status' => 'error', 'message' => 'Media item not found for this project.'], 404);
        }

        DB::transaction(function () use ($project, $pm) {
            if ($pm->is_cover) {
                $project->update(['cover_media_id' => null]);
            }
            $pm->delete();
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Media detached from project successfully.',
        ]);
    }
}
