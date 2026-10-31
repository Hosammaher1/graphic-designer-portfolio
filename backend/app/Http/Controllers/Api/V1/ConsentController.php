<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ConsentRecord;
use App\Models\VisitorPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConsentController extends Controller
{
    /**
     * Record or update pseudonymous visitor consent preferences.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'consent_token' => ['nullable', 'string', 'min:8', 'max:64'],
            'status' => ['required', 'string', 'in:accepted,rejected,customized,withdrawn'],
            'categories' => ['required', 'array'],
            'categories.analytics' => ['required', 'boolean'],
            'categories.personalization' => ['required', 'boolean'],
            'policy_version' => ['nullable', 'string', 'max:16'],
        ]);

        $token = $validated['consent_token'] ?? ConsentRecord::generateToken();
        $status = $validated['status'];

        $analyticsAllowed = ($status === 'withdrawn' || $status === 'rejected')
            ? false
            : (bool) $validated['categories']['analytics'];

        $personalizationAllowed = ($status === 'withdrawn' || $status === 'rejected')
            ? false
            : (bool) $validated['categories']['personalization'];

        $record = DB::transaction(function () use ($token, $status, $analyticsAllowed, $personalizationAllowed, $validated) {
            $consent = ConsentRecord::updateOrCreate(
                ['consent_token' => $token],
                [
                    'status' => $status,
                    'analytics_allowed' => $analyticsAllowed,
                    'personalization_allowed' => $personalizationAllowed,
                    'policy_version' => $validated['policy_version'] ?? '1.0',
                    'expires_at' => now()->addDays(180),
                    'withdrawn_at' => $status === 'withdrawn' ? now() : null,
                ]
            );

            // If personalization is revoked or withdrawn, purge associated visitor preferences immediately
            if (!$personalizationAllowed) {
                VisitorPreference::where('consent_token', $token)->delete();
            }

            return $consent;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'consent_token' => $record->consent_token,
                'status' => $record->status,
                'categories' => [
                    'essential' => true,
                    'analytics' => (bool) $record->analytics_allowed,
                    'personalization' => (bool) $record->personalization_allowed,
                ],
                'policy_version' => $record->policy_version,
                'expires_at' => $record->expires_at?->toISOString(),
            ],
        ], 200);
    }

    /**
     * Withdraw consent and immediately purge all personal/visitor preference data.
     */
    public function withdraw(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'consent_token' => ['required', 'string', 'min:8', 'max:64'],
        ]);

        $token = $validated['consent_token'];

        DB::transaction(function () use ($token) {
            $record = ConsentRecord::where('consent_token', $token)->first();
            if ($record) {
                $record->update([
                    'status' => 'withdrawn',
                    'analytics_allowed' => false,
                    'personalization_allowed' => false,
                    'withdrawn_at' => now(),
                ]);
            }

            // Immediately purge any saved visitor preferences
            VisitorPreference::where('consent_token', $token)->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Consent withdrawn successfully',
            'data' => [
                'status' => 'withdrawn',
                'categories' => [
                    'essential' => true,
                    'analytics' => false,
                    'personalization' => false,
                ],
            ],
        ], 200);
    }

    /**
     * Retrieve public consent status for a pseudonymous token.
     */
    public function show(string $token): JsonResponse
    {
        $record = ConsentRecord::where('consent_token', $token)->first();

        if (!$record || ($record->expires_at && $record->expires_at->isPast())) {
            return response()->json([
                'success' => false,
                'message' => 'Consent record not found or expired',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'consent_token' => $record->consent_token,
                'status' => $record->status,
                'categories' => [
                    'essential' => true,
                    'analytics' => (bool) $record->analytics_allowed,
                    'personalization' => (bool) $record->personalization_allowed,
                ],
                'policy_version' => $record->policy_version,
                'expires_at' => $record->expires_at?->toISOString(),
            ],
        ], 200);
    }
}
