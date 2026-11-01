<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactInquiryRequest;
use App\Mail\InquiryConfirmationMail;
use App\Mail\InquiryNotificationMail;
use App\Models\Inquiry;
use App\Services\Security\InputSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    /**
     * Store a newly submitted contact inquiry and queue notification emails.
     * Sanitizes all plain text inputs against XSS (Task 08.02).
     */
    public function store(ContactInquiryRequest $request, InputSanitizer $sanitizer): JsonResponse
    {
        $validated = $request->validated();

        $idempotencyKey = $request->header('Idempotency-Key');
        if ($idempotencyKey !== null && (strlen($idempotencyKey) > 128 || !preg_match('/^[\x21-\x7E]+$/D', $idempotencyKey))) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'idempotency_key' => ['The Idempotency-Key header must contain 1 to 128 printable ASCII characters.'],
            ]);
        }

        $attributes = [
            'name' => $sanitizer->cleanPlainText($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'subject' => $sanitizer->cleanPlainText($validated['subject']),
            'message' => $sanitizer->cleanPlainText($validated['message']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'new',
            'is_read' => false,
        ];

        if ($idempotencyKey !== null) {
            $keyHash = hash_hmac('sha256', $attributes['email']."\0".$idempotencyKey, (string) config('app.key'));
            $fingerprint = hash('sha256', json_encode(array_intersect_key($attributes, array_flip([
                'name', 'email', 'subject', 'message',
            ])), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
            $inquiry = Inquiry::firstOrCreate(
                ['idempotency_key_hash' => $keyHash],
                $attributes + ['request_fingerprint' => $fingerprint]
            );

            if (!$inquiry->wasRecentlyCreated) {
                if (!hash_equals((string) $inquiry->request_fingerprint, $fingerprint)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Idempotency-Key was already used for a different request.',
                        'code' => 409,
                    ], 409);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Your message has been sent successfully.',
                    'data' => ['id' => $inquiry->id],
                ]);
            }
        } else {
            $inquiry = Inquiry::create($attributes);
        }

        // 1. Queue notification to portfolio owner
        $adminEmail = config('portfolio.admin_email', env('ADMIN_EMAIL', 'admin@mohammed-portfolio.test'));
        Mail::to($adminEmail)->queue(new InquiryNotificationMail($inquiry));

        // 2. Queue confirmation to sender
        Mail::to($inquiry->email)->queue(new InquiryConfirmationMail($inquiry));

        return response()->json([
            'status' => 'success',
            'message' => 'Your message has been sent successfully. / تم إرسال رسالتك بنجاح.',
            'data' => [
                'id' => $inquiry->id,
            ],
        ], 201);
    }

    /**
     * Admin: List inquiries with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inquiry::query()->orderBy('created_at', 'desc');

        if ($request->has('is_read')) {
            $query->where('is_read', filter_var($request->query('is_read'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
        $inquiries = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $inquiries,
        ]);
    }

    /**
     * Admin: View single inquiry and mark as read.
     */
    public function show(int $id): JsonResponse
    {
        $inquiry = Inquiry::findOrFail($id);

        if (!$inquiry->is_read) {
            $inquiry->update([
                'is_read' => true,
                'status' => $inquiry->status === 'new' ? 'read' : $inquiry->status,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $inquiry,
        ]);
    }

    /**
     * Admin: Delete an inquiry.
     */
    public function destroy(int $id): JsonResponse
    {
        $inquiry = Inquiry::findOrFail($id);
        $inquiry->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Inquiry deleted successfully.',
        ]);
    }
}
