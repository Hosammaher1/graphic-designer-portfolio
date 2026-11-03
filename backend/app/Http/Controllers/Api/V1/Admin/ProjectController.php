<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\SyncProjectRelationshipsRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Services\AuditLogger;
use App\Services\Media\MediaStorageInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Project::query()
            ->with(['translations', 'categories', 'tools']);

        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        if ($request->filled('year')) {
            $query->where('year', (int) $request->year);
        }

        if ($request->filled('tool_id')) {
            $query->whereHas('tools', fn($q) => $q->where('tools.id', (int) $request->tool_id));
        }

        if ($request->filled('category_id')) {
            $query->whereHas('categories', fn($q) => $q->where('categories.id', (int) $request->category_id));
        }

        $projects = $query->latest()->paginate(20);

        return response()->json([
            'status' => 'success',
            'data'   => ['projects' => $projects],
        ]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = Project::create([
            'slug'           => $request->slug,
            'status'         => $request->input('status', 'draft'),
            'is_featured'    => $request->boolean('is_featured', false),
            'year'           => $request->input('year'),
            'client'         => $request->input('client'),
            'cover_media_id' => $request->input('cover_media_id'),
        ]);

        foreach ($request->translations as $trans) {
            $project->translations()->create($trans);
        }

        if ($request->has('category_ids')) {
            $project->categories()->sync($request->input('category_ids'));
        }

        if ($request->has('tool_ids')) {
            $project->tools()->sync($request->input('tool_ids'));
        }

        // If status is published, generate the published snapshot immediately
        if ($request->input('status') === 'published') {
            app(\App\Services\Publishing\ProjectPublishingService::class)->publish($project);
        }

        $project->load(['translations', 'categories', 'tools', 'coverMedia']);

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($project)],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $project = Project::withTrashed()
            ->with(['translations', 'categories', 'tools', 'coverMedia'])
            ->find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($project)],
        ]);
    }

    public function update(UpdateProjectRequest $request, int $id): JsonResponse
    {
        $project = Project::withTrashed()->find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $project->update($request->only([
            'slug', 'status', 'is_featured', 'year', 'client', 'cover_media_id',
        ]));

        if ($request->has('translations')) {
            foreach ($request->translations as $trans) {
                $project->translations()->updateOrCreate(
                    ['locale' => $trans['locale']],
                    $trans
                );
            }
        }

        if ($request->has('category_ids')) {
            $project->categories()->sync($request->input('category_ids'));
        }

        if ($request->has('tool_ids')) {
            $project->tools()->sync($request->input('tool_ids'));
        }

        // Re-publish or unpublish if status was modified
        if ($request->has('status')) {
            if ($request->input('status') === 'published') {
                app(\App\Services\Publishing\ProjectPublishingService::class)->publish($project);
            } elseif ($request->input('status') === 'draft') {
                app(\App\Services\Publishing\ProjectPublishingService::class)->unpublish($project);
            }
        }

        $project->load(['translations', 'categories', 'tools', 'coverMedia']);

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($project)],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $project = Project::find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $project->delete();

        AuditLogger::log('project.soft_deleted', [
            'project_id' => $project->id,
            'slug'       => $project->slug,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Project moved to trash.',
        ]);
    }

    public function syncRelationships(SyncProjectRelationshipsRequest $request, int $id): JsonResponse
    {
        $project = Project::find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        if ($request->has('category_ids')) {
            $project->categories()->sync($request->category_ids);
        }

        if ($request->has('tool_ids')) {
            $project->tools()->sync($request->tool_ids);
        }

        $project->load(['categories', 'tools']);

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($project)],
        ]);
    }

    public function toggleWatermark(Request $request, int $id): JsonResponse
    {
        $project = Project::find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $request->validate([
            'enable_watermark' => ['required', 'boolean'],
        ]);

        $project->update([
            'enable_watermark' => $request->boolean('enable_watermark'),
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => [
                'id' => $project->id,
                'enable_watermark' => (bool) $project->enable_watermark,
            ]],
        ]);
    }

    public function publish(Request $request, int $id, \App\Services\Publishing\ProjectPublishingService $service): JsonResponse
    {
        $idempotencyKey = $request->header('Idempotency-Key');
        if ($idempotencyKey !== null && (strlen($idempotencyKey) > 128 || !preg_match('/^[\x21-\x7E]+$/D', $idempotencyKey))) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'idempotency_key' => ['The Idempotency-Key header must contain 1 to 128 printable ASCII characters.'],
            ]);
        }

        $project = Project::find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $published = $service->publish($project, $idempotencyKey);

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($published)],
        ]);
    }

    public function unpublish(int $id, \App\Services\Publishing\ProjectPublishingService $service): JsonResponse
    {
        $project = Project::find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $unpublished = $service->unpublish($project);

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($unpublished)],
        ]);
    }

    public function preview(int $id): JsonResponse
    {
        $project = Project::with(['translations', 'categories.translations', 'tools', 'media.mediaAsset', 'coverMedia'])
            ->find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $trans = $project->translation() ?: $project->translations->first();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'project' => [
                    'id'               => $project->id,
                    'slug'             => $project->slug,
                    'status'           => $project->status,
                    'title'            => $trans?->title ?? '',
                    'summary'          => $trans?->summary ?? '',
                    'description'      => $trans?->description ?? '',
                    'enable_watermark' => (bool) $project->enable_watermark,
                    'categories'       => $project->categories,
                    'tools'            => $project->tools,
                    'media'            => $project->media,
                ],
            ],
        ])
        ->header('X-Robots-Tag', 'noindex, nofollow')
        ->header('Cache-Control', 'no-store, private');
    }

    public function trash(Request $request): JsonResponse
    {
        $projects = Project::onlyTrashed()
            ->with(['translations', 'categories.translations', 'tools', 'coverMedia.mediaAsset'])
            ->latest('deleted_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data'   => ['projects' => $projects],
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $project = Project::onlyTrashed()->find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Trashed project not found.'], 404);
        }

        $project->restore();

        AuditLogger::log('project.restored', [
            'project_id' => $project->id,
            'slug'       => $project->slug,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Project restored from trash.',
            'data'    => ['project' => new ProjectResource($project->fresh(['translations', 'categories', 'tools', 'coverMedia.mediaAsset']))],
        ]);
    }

    public function forceDelete(int $id, MediaStorageInterface $storage): JsonResponse
    {
        $project = Project::withTrashed()->find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        // Clean up unshared media
        $projectMediaItems = ProjectMedia::where('project_id', $project->id)
            ->with('mediaAsset')
            ->get();

        foreach ($projectMediaItems as $pm) {
            $asset = $pm->mediaAsset;
            if (! $asset) {
                continue;
            }

            $isShared = ProjectMedia::where('media_asset_id', $asset->id)
                ->where('project_id', '!=', $project->id)
                ->exists();

            if (! $isShared) {
                try {
                    if ($asset->provider_id) {
                        $storage->delete($asset->provider_id);
                    }
                    $asset->delete();
                } catch (\Throwable $e) {
                    Log::warning("Could not delete media asset {$asset->id} during project force delete.", [
                        'exception_type' => get_class($e),
                    ]);
                }
            }
        }

        $projectId = $project->id;
        $projectSlug = $project->slug;

        $project->categories()->detach();
        $project->tools()->detach();
        $project->media()->delete();
        $project->translations()->forceDelete();
        $project->forceDelete();

        AuditLogger::log('project.force_deleted', [
            'project_id' => $projectId,
            'slug'       => $projectSlug,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Project permanently deleted.',
        ]);
    }

    public function updateLayout(Request $request, int $id): JsonResponse
    {
        $project = Project::with('media')->find($id);

        if (!$project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $request->validate([
            'layout_blocks' => ['required', 'array'],
        ]);

        $blocks = $request->input('layout_blocks', []);
        $allowedTypes = ['text', 'image', 'gallery', 'columns', 'spacer', 'heading', 'cta', 'stats'];

        // 1. Validate restricted block types
        foreach ($blocks as $block) {
            $type = $block['type'] ?? '';
            if (!in_array($type, $allowedTypes, true)) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Block type '{$type}' is not allowed in project layouts.",
                    'restricted_type' => true,
                ], 422);
            }
        }

        // 2. Validate media permissions (project-specific media isolation)
        $attachedMediaAssetIds = $project->media->pluck('media_asset_id')->filter()->all();

        foreach ($blocks as $block) {
            $data = $block['data'] ?? [];
            if (!empty($data['media_asset_id'])) {
                $assetId = (int) $data['media_asset_id'];
                $isAttached = in_array($assetId, $attachedMediaAssetIds, true);
                if (!$isAttached) {
                    $asset = MediaAsset::find($assetId);
                    $isPubliclyAvailable = $asset && $asset->projects()->where('status', 'published')->exists();
                    if (!$isPubliclyAvailable) {
                        return response()->json([
                            'status' => 'error',
                            'message' => "Media permission denied: media asset #{$assetId} is not attached to this project or part of a published project.",
                            'media_permission_denied' => true,
                        ], 422);
                    }
                }
            }
        }

        $project->update([
            'layout_blocks' => $blocks,
        ]);

        return response()->json([
            'status' => 'success',
            'project' => $project->fresh(),
        ]);
    }
}
