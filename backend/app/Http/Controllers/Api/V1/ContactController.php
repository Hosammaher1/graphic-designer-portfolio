<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactInquiryRequest;
use App\Mail\InquiryConfirmationMail;
use App\Mail\InquiryNotificationMail;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    /**
     * Store a newly submitted contact inquiry and queue notification emails.
     */
    public function store(ContactInquiryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $inquiry = Inquiry::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'new',
            'is_read' => false,
        ]);

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
