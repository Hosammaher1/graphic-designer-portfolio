<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit log entries.
     */
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'status' => 'success',
            'data' => [
                'logs' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                    'last_page' => $logs->lastPage(),
                ],
            ],
        ]);
    }
}
