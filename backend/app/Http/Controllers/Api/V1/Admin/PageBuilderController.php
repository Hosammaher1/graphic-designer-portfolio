<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Page;
use App\Models\PageVersion;
use App\Services\PageBuilder\ServerBlockValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PageBuilderController extends Controller
{
    protected ServerBlockValidator $validator;

    public function __construct(ServerBlockValidator $validator)
    {
        $this->validator = $validator;
    }

    /**
     * Fetch draft document and metadata for a given page.
     */
    public function getDraft(string $slug): JsonResponse
    {
        $page = Page::with(['currentDraftVersion', 'publishedVersion'])->where('slug', $slug)->first();

        if (!$page) {
            return response()->json([
                'page' => [
                    'slug' => $slug,
                    'title_ar' => null,
                    'title_en' => null,
                    'lock_version' => 1,
                ],
                'draft_version' => null,
                'blocks' => [],
            ], 200);
        }

        $activeDraft = $page->currentDraftVersion ?? $page->publishedVersion;

        return response()->json([
            'page' => $page,
            'draft_version' => $activeDraft,
            'blocks' => $activeDraft ? ($activeDraft->blocks ?? []) : [],
        ], 200);
    }

    /**
     * Save draft version with optimistic concurrency check.
     */
    public function saveDraft(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'lock_version' => 'required|integer|min:1',
            'blocks' => 'required|array',
            'title_ar' => 'nullable|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        $blocks = $request->input('blocks', []);
        $incomingLockVersion = (int) $request->input('lock_version');

        // 1. Strict Server Block Validation (Allowlist, depth limits, byte size, XSS prevention)
        $validationResult = $this->validator->validateDocument($blocks);
        if (!$validationResult['valid']) {
            return response()->json([
                'message' => 'Page builder block validation failed.',
                'errors' => $validationResult['errors'],
            ], 422);
        }

        // 2. Atomic Database Transaction with Optimistic Concurrency Check
        return DB::transaction(function () use ($request, $slug, $blocks, $incomingLockVersion) {
            $page = Page::where('slug', $slug)->lockForUpdate()->first();

            if ($page) {
                // Optimistic concurrency check
                if ($page->lock_version !== $incomingLockVersion) {
                    return response()->json([
                        'message' => 'Stale update conflict: this page was modified in another session.',
                        'conflict' => true,
                        'current_lock_version' => $page->lock_version,
                    ], 409);
                }

                // Bump lock version
                $page->lock_version += 1;
                if ($request->has('title_ar')) {
                    $page->title_ar = $request->input('title_ar');
                }
                if ($request->has('title_en')) {
                    $page->title_en = $request->input('title_en');
                }
            } else {
                $page = Page::create([
                    'slug' => $slug,
                    'title_ar' => $request->input('title_ar', $slug),
                    'title_en' => $request->input('title_en', $slug),
                    'lock_version' => $incomingLockVersion + 1,
                ]);
            }

            // Determine next sequential version number
            $latestVersion = (int) $page->versions()->max('version_number');
            $nextVersionNumber = $latestVersion + 1;

            $draftVersion = PageVersion::create([
                'page_id' => $page->id,
                'version_number' => $nextVersionNumber,
                'status' => 'draft',
                'blocks' => $blocks,
                'metadata' => $request->input('metadata'),
                'created_by' => auth()->id(),
            ]);

            // Update current draft pointer (published_version_id remains untouched!)
            $page->current_draft_version_id = $draftVersion->id;
            $page->save();

            // Record audit log if method exists
            if (class_exists(AuditLog::class) && method_exists(AuditLog::class, 'record')) {
                AuditLog::record(
                    auth()->id(),
                    'page_draft_saved',
                    "Saved draft version {$nextVersionNumber} for page '{$slug}'",
                    $request->ip(),
                    ['slug' => $slug, 'version' => $nextVersionNumber, 'lock_version' => $page->lock_version]
                );
            }

            return response()->json([
                'message' => 'Draft saved successfully.',
                'page' => $page,
                'draft_version' => $draftVersion,
            ], 200);
        });
    }
}
