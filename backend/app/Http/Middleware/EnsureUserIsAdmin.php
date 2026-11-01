<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $locale = $request->getPreferredLanguage(['en', 'ar']) ?: 'en';

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => trans('api_errors.http_401', [], $locale),
                'code' => 401,
            ], 401, ['Content-Language' => $locale]);
        }

        if (!$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => trans('api_errors.http_403_admin', [], $locale),
                'code' => 403,
            ], 403, ['Content-Language' => $locale]);
        }

        return $next($request);
    }
}
