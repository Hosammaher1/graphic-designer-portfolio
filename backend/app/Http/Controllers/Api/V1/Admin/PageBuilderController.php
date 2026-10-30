<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Page;
use App\Models\PageVersion;
use App\Services\PageBuilder\ServerBlockValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

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

    /**
     * Generate a cryptographic short-lived signed preview URL.
     */
    public function createPreviewUrl(Request $request, string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        $expiresAt = now()->addMinutes(30);
        $previewUrl = URL::temporarySignedRoute(
            'api.v1.pages.preview.signed',
            $expiresAt,
            ['slug' => $slug]
        );

        return response()->json([
            'preview_url' => $previewUrl,
            'expires_at' => $expiresAt->toIso8601String(),
        ], 200);
    }

    /**
     * Render secure preview of draft page.
     * Authorized via admin session OR valid unexpired signature.
     */
    public function preview(Request $request, string $slug): JsonResponse
    {
        // 1. Authorization check
        $user = auth('sanctum')->user() ?? $request->user();
        $isAdmin = $user && $user->is_admin;
        $hasValidSignature = $request->hasValidSignature();

        if (!$isAdmin && !$hasValidSignature) {
            return response()->json([
                'message' => 'Unauthorized preview access. Admin authentication or valid signed signature required.',
            ], 403);
        }

        // 2. Fetch page and active draft or published version
        $page = Page::with(['currentDraftVersion', 'publishedVersion'])->where('slug', $slug)->first();
        if (!$page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        $activeVersion = $page->currentDraftVersion ?? $page->publishedVersion;
        $blocks = $activeVersion ? ($activeVersion->blocks ?? []) : [];

        // 3. Return response with strict no-index and no-cache security headers
        return response()->json([
            'page' => $page,
            'draft_version' => $activeVersion,
            'blocks' => $blocks,
            'is_preview' => true,
        ], 200)
            ->header('X-Robots-Tag', 'noindex, nofollow, noarchive')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Atomically publish the current draft version and update the active published pointer.
     */
    public function publish(Request $request, string $slug): JsonResponse
    {
        $page = Page::with('currentDraftVersion')->where('slug', $slug)->firstOrFail();

        // 1. Localized Completeness Policy: Both Arabic and English titles are required for publication
        if (empty(trim((string) $page->title_ar)) || empty(trim((string) $page->title_en))) {
            $errors = [];
            if (empty(trim((string) $page->title_ar))) {
                $errors['title_ar'] = ['The title_ar field is required to publish this page.'];
            }
            if (empty(trim((string) $page->title_en))) {
                $errors['title_en'] = ['The title_en field is required to publish this page.'];
            }

            return response()->json([
                'message' => 'Localized completeness policy violation: Both Arabic and English titles are required for publication.',
                'policy_violation' => true,
                'errors' => $errors,
            ], 422);
        }

        $draft = $page->currentDraftVersion;
        if (!$draft) {
            return response()->json([
                'message' => 'No active draft version available to publish.',
            ], 400);
        }

        // 2. Atomic Database Transaction
        return DB::transaction(function () use ($page, $draft, $slug, $request) {
            // Mark draft status as published
            $draft->status = 'published';
            $draft->save();

            // Update page published_version_id pointer
            $page->published_version_id = $draft->id;
            $page->save();

            // Invalidate public page and sitemap caches
            Cache::forget("page_public_{$slug}");
            Cache::forget("sitemap");
            Cache::forget("public_pages_index");

            // Audit log
            if (class_exists(AuditLog::class) && method_exists(AuditLog::class, 'record')) {
                AuditLog::record(
                    auth()->id(),
                    'page_published',
                    "Published version {$draft->version_number} of page '{$slug}'",
                    $request->ip(),
                    ['slug' => $slug, 'version' => $draft->version_number, 'published_version_id' => $draft->id]
                );
            }

            return response()->json([
                'message' => 'Page published successfully.',
                'page' => $page,
                'published_version' => $draft,
            ], 200);
        });
    }

    /**
     * Public endpoint: Serves only the published immutable version.
     */
    public function showPublic(string $slug): JsonResponse
    {
        $page = Page::with('publishedVersion')->where('slug', $slug)->first();

        if (!$page || !$page->publishedVersion) {
            return response()->json([
                'message' => 'Page not found or not published.',
            ], 404);
        }

        return response()->json([
            'page' => [
                'slug' => $page->slug,
                'title_ar' => $page->title_ar,
                'title_en' => $page->title_en,
                'published_at' => $page->publishedVersion->updated_at,
            ],
            'blocks' => $page->publishedVersion->blocks ?? [],
        ], 200);
    }
}
