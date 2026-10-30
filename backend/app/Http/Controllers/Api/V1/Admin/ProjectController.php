<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\SyncProjectRelationshipsRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Project::withTrashed()
            ->with(['translations', 'categories', 'tools']);

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
            'slug'        => $request->slug,
            'status'      => $request->input('status', 'draft'),
            'is_featured' => $request->boolean('is_featured', false),
            'year'        => $request->input('year'),
            'client'      => $request->input('client'),
        ]);

        foreach ($request->translations as $trans) {
            $project->translations()->create($trans);
        }

        $project->load(['translations', 'categories', 'tools']);

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

        $project->load(['translations', 'categories', 'tools']);

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
}
