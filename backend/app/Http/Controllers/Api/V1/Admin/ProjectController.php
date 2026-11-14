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
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Project::query()
            ->with(['translations', 'categories.translations', 'tools', 'coverMedia', 'media.mediaAsset']);

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
            'featured_order' => $request->input('featured_order'),
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

        // Attach gallery media items if provided
        if ($request->has('media_items') && is_array($request->input('media_items'))) {
            foreach ($request->input('media_items') as $idx => $item) {
                $isCover = !empty($item['is_cover']) || ($project->cover_media_id && $project->cover_media_id == $item['media_asset_id']);
                $project->media()->create([
                    'media_asset_id' => $item['media_asset_id'],
                    'caption_en'     => $item['caption_en'] ?? null,
                    'caption_ar'     => $item['caption_ar'] ?? null,
                    'is_cover'       => $isCover,
                    'sort_order'     => $item['sort_order'] ?? ($idx + 1),
                ]);

                if ($isCover && ! $project->cover_media_id) {
                    $project->update(['cover_media_id' => $item['media_asset_id']]);
                }
            }
        }

        // If status is published, generate the published snapshot immediately
        if ($request->input('status') === 'published') {
            $project = app(\App\Services\Publishing\ProjectPublishingService::class)->publish($project);
        }

        $project->load(['translations', 'categories.translations', 'tools', 'coverMedia', 'media.mediaAsset']);

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($project)],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $project = Project::withTrashed()
            ->with(['translations', 'categories.translations', 'tools', 'coverMedia', 'media.mediaAsset'])
            ->find($id);

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => ['project' => new ProjectResource($project)],
        ]);
    }

    public function update(UpdateProjectRequest $request, string|int $id): JsonResponse
    {
        $project = Project::withTrashed()
            ->where(function ($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', (int) $id);
                }
                $q->orWhere('slug', (string) $id);
            })
            ->first();

        if (! $project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $project->update($request->only([
            'slug', 'status', 'is_featured', 'featured_order', 'year', 'client', 'cover_media_id',
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

        // Sync gallery media items if provided
        if ($request->has('media_items') && is_array($request->input('media_items'))) {
            $project->media()->delete();
            foreach ($request->input('media_items') as $idx => $item) {
                $isCover = !empty($item['is_cover']) || ($project->cover_media_id && $project->cover_media_id == $item['media_asset_id']);
                $project->media()->create([
                    'media_asset_id' => $item['media_asset_id'],
                    'caption_en'     => $item['caption_en'] ?? null,
                    'caption_ar'     => $item['caption_ar'] ?? null,
                    'is_cover'       => $isCover,
                    'sort_order'     => $item['sort_order'] ?? ($idx + 1),
                ]);

                if ($isCover && ! $project->cover_media_id) {
                    $project->update(['cover_media_id' => $item['media_asset_id']]);
                }
            }
        }

        // Re-publish or unpublish if status was modified, or refresh snapshot if published
        if ($request->has('status')) {
            if ($request->input('status') === 'published') {
                app(\App\Services\Publishing\ProjectPublishingService::class)->publish($project);
            } elseif ($request->input('status') === 'draft') {
                app(\App\Services\Publishing\ProjectPublishingService::class)->unpublish($project);
            }
        } elseif ($project->status === 'published') {
            app(\App\Services\Publishing\ProjectPublishingService::class)->publish($project);
        }

        $project->load(['translations', 'categories.translations', 'tools', 'coverMedia', 'media.mediaAsset']);

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
            'data'    => ['project' => new ProjectResource($project->fresh(['translations', 'categories.translations', 'tools', 'coverMedia.mediaAsset']))],
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

    /**
     * Set and reorder the homepage featured projects showcase (maximum 3, positions 1, 2, 3).
     * Prevents duplicate positions and ensures exactly selected projects are featured.
     */
    public function reorderFeatured(Request $request): JsonResponse
    {
        $rawProjects = $request->input('featured_projects', $request->input('projects', []));
        if (!is_array($rawProjects)) {
            $rawProjects = [];
        }

        if (count($rawProjects) > 3) {
            return response()->json([
                'status'  => 'error',
                'message' => 'A maximum of 3 projects can be featured on the homepage.',
            ], 422);
        }

        $normalized = [];
        $positions = [];
        $ids = [];

        foreach ($rawProjects as $index => $item) {
            $id = is_array($item) ? ($item['id'] ?? null) : $item;
            $pos = is_array($item) ? ($item['position'] ?? $item['featured_order'] ?? ($index + 1)) : ($index + 1);

            if (!$id) {
                continue;
            }

            $id = (int) $id;
            $pos = (int) $pos;

            if ($pos < 1 || $pos > 3) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Featured position for project ID {$id} must be between 1 and 3.",
                ], 422);
            }

            if (in_array($pos, $positions, true)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Duplicate position #{$pos} detected. Each position (1st, 2nd, 3rd) must be assigned to at most one project.",
                ], 422);
            }

            if (in_array($id, $ids, true)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Project ID {$id} is listed more than once.",
                ], 422);
            }

            $positions[] = $pos;
            $ids[] = $id;
            $normalized[] = [
                'id'       => $id,
                'position' => $pos,
            ];
        }

        // Verify all referenced projects exist
        if (!empty($ids)) {
            $existingCount = Project::whereIn('id', $ids)->count();
            if ($existingCount !== count($ids)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'One or more selected projects do not exist.',
                ], 404);
            }
        }

        $featuredResults = [];

        DB::transaction(function () use ($normalized, $ids, &$featuredResults) {
            $publishingService = app(\App\Services\Publishing\ProjectPublishingService::class);

            // 1. Un-feature all projects not in the new selection
            $toUnfeature = Project::where('is_featured', true)
                ->whereNotIn('id', $ids)
                ->get();

            foreach ($toUnfeature as $p) {
                $p->is_featured = false;
                $p->featured_order = null;
                if ($p->status === 'published' && is_array($p->published_snapshot)) {
                    $snapshot = $p->published_snapshot;
                    $snapshot['is_featured'] = false;
                    $snapshot['featured_order'] = null;
                    $snapshot['position'] = null;
                    $p->published_snapshot = $snapshot;
                }
                $p->save();
            }

            // 2. Set featured status and position for selected projects
            foreach ($normalized as $item) {
                $p = Project::find($item['id']);
                if (!$p) {
                    continue;
                }

                $p->is_featured = true;
                $p->featured_order = (int) $item['position'];
                $p->save();

                if ($p->status === 'published') {
                    $publishingService->publish($p);
                }
            }

            // 3. Persist to SiteSetting for unified configuration sync
            try {
                $currentSettings = SiteSetting::getSetting('portfolio_settings', SiteSetting::defaultSettings());
                if (!isset($currentSettings['preferences']) || !is_array($currentSettings['preferences'])) {
                    $currentSettings['preferences'] = [];
                }
                $currentSettings['preferences']['featured_projects'] = $normalized;
                SiteSetting::setSetting('portfolio_settings', $currentSettings);
                \Illuminate\Support\Facades\Cache::forget(SiteSetting::CACHE_KEY . '_ar');
                \Illuminate\Support\Facades\Cache::forget(SiteSetting::CACHE_KEY . '_en');
            } catch (\Throwable $e) {
                Log::warning('Failed to sync featured projects to SiteSetting: ' . $e->getMessage());
            }

            // 4. Return refreshed list
            $featuredResults = Project::where('is_featured', true)
                ->with(['translations', 'categories.translations', 'tools', 'coverMedia', 'media.mediaAsset'])
                ->orderBy('featured_order', 'asc')
                ->get();
        });

        AuditLogger::log('projects.featured_reordered', [
            'featured_count' => count($normalized),
            'projects'       => $normalized,
        ], $request->user(), $request);

        return response()->json([
            'status'  => 'success',
            'message' => 'Homepage featured showcase updated successfully.',
            'data'    => [
                'featured_projects' => ProjectResource::collection($featuredResults),
            ],
        ]);
    }
}
