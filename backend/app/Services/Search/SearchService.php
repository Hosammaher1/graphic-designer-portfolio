<?php

namespace App\Services\Search;

use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class SearchService
{
    /**
     * Normalize Arabic text by removing tashkeel and standardizing alefs and yaas.
     */
    public function normalizeArabic(string $text): string
    {
        // Remove diacritics / tashkeel
        $tashkeel = ['ِ', 'ُ', 'ٓ', 'ٰ', 'ْ', 'ٌ', 'ٍ', 'ً', 'ّ', 'َ'];
        $text = str_replace($tashkeel, '', $text);

        // Standardize alef variants (أ, إ, آ, ٱ) -> ا
        $text = preg_replace('/[أإآٱ]/u', 'ا', $text);

        // Standardize yaa / alef maksura (ى) -> ي
        $text = preg_replace('/[ى]/u', 'ي', $text);

        return trim($text);
    }

    /**
     * Escape special SQL LIKE wildcards (% and _) to avoid wildcard injection.
     */
    public function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    /**
     * Generate searchable query variants (original + normalized forms).
     *
     * @return array<string>
     */
    public function getSearchVariants(string $query): array
    {
        $raw = trim($query);
        if ($raw === '') {
            return [];
        }

        $variants = [$raw];

        $arabicNormalized = $this->normalizeArabic($raw);
        if ($arabicNormalized !== '' && !in_array($arabicNormalized, $variants, true)) {
            $variants[] = $arabicNormalized;
        }

        // If the query contains standard 'ا', also create variants with 'أ' and 'إ' if helpful
        if (str_contains($arabicNormalized, 'ا')) {
            $withHamza = preg_replace('/ا/u', 'أ', $arabicNormalized, 1);
            if ($withHamza && !in_array($withHamza, $variants, true)) {
                $variants[] = $withHamza;
            }
        }

        return $variants;
    }

    /**
     * Perform bilingual project search with strict published snapshot filtering.
     *
     * @param array<string, mixed> $filters
     */
    public function searchProjects(string $queryStr, array $filters = []): LengthAwarePaginator
    {
        $locale = $filters['locale'] ?? 'ar';
        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 12)));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $trimmedQuery = trim($queryStr);

        // Strict published invariants
        $baseQuery = Project::published()
            ->whereNotNull('published_snapshot')
            ->latest('published_at');

        // If query is empty, return empty paginated collection
        if ($trimmedQuery === '') {
            return $baseQuery->whereRaw('1 = 0')->paginate($perPage, ['*'], 'page', $page);
        }

        $variants = $this->getSearchVariants($trimmedQuery);

        // Search across project fields and translations
        $baseQuery->where(function (Builder $builder) use ($variants) {
            foreach ($variants as $variant) {
                $escaped = $this->escapeLike($variant);
                $likePattern = "%{$escaped}%";

                // 1. Project attributes (slug, client)
                $builder->orWhere('slug', 'LIKE', $likePattern)
                    ->orWhere('client', 'LIKE', $likePattern);

                // 2. Project translations (title, summary, description)
                $builder->orWhereHas('translations', function (Builder $q) use ($likePattern) {
                    $q->where('title', 'LIKE', $likePattern)
                        ->orWhere('summary', 'LIKE', $likePattern)
                        ->orWhere('description', 'LIKE', $likePattern);
                });

                // 3. Category relations
                $builder->orWhereHas('categories', function (Builder $q) use ($likePattern) {
                    $q->where('slug', 'LIKE', $likePattern)
                        ->orWhereHas('translations', function (Builder $tq) use ($likePattern) {
                            $tq->where('name', 'LIKE', $likePattern);
                        });
                });

                // 4. Tool relations
                $builder->orWhereHas('tools', function (Builder $q) use ($likePattern) {
                    $q->where('name', 'LIKE', $likePattern)
                        ->orWhere('slug', 'LIKE', $likePattern);
                });
            }
        });

        // Optional category filter
        if (!empty($filters['category'])) {
            $catSlug = $filters['category'];
            $baseQuery->whereHas('categories', fn($q) => $q->where('slug', $catSlug));
        }

        // Optional tool filter
        if (!empty($filters['tool'])) {
            $toolSlug = $filters['tool'];
            $baseQuery->whereHas('tools', fn($q) => $q->where('slug', $toolSlug));
        }

        // Optional year filter
        if (!empty($filters['year'])) {
            $baseQuery->where('year', (int) $filters['year']);
        }

        return $baseQuery->paginate($perPage, ['*'], 'page', $page);
    }
}
