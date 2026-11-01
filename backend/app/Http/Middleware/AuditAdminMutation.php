<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditAdminMutation
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            try {
                AuditLogger::log('admin.request', [
                    'route' => $request->route()?->getName(),
                    'method' => $request->method(),
                    'response_status' => $response->getStatusCode(),
                ], $request->user(), $request);
            } catch (\Throwable $e) {
                Log::error('Admin mutation audit write failed.', [
                    'exception_type' => get_class($e),
                ]);
            }
        }

        return $response;
    }
}
