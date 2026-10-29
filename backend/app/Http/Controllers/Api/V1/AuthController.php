<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Maximum allowed failed attempts before throttling.
     */
    protected int $maxAttempts = 5;

    /**
     * Lockout duration in seconds.
     */
    protected int $decaySeconds = 60;

    /**
     * Handle an incoming authentication request with brute-force protection.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $throttleKey = Str::lower($credentials['email']) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, $this->maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            Log::warning('Login rate limit exceeded', [
                'email' => $credentials['email'],
                'ip' => $request->ip(),
                'retry_after' => $seconds,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Too many login attempts. Please try again later.',
                'retry_after' => $seconds,
            ], 429);
        }

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey, $this->decaySeconds);

            // Audit log without sensitive payload/password
            Log::warning('Failed authentication attempt', [
                'email' => $credentials['email'],
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            AuditLogger::log('auth.login.failed', ['email' => $credentials['email']], null, $request);

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Authentication succeeded: clear rate limiter counter
        RateLimiter::clear($throttleKey);

        // Regenerate session ID to prevent session fixation attacks
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user = Auth::user();

        Log::info('Successful administrator authentication', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);

        AuditLogger::log('auth.login.success', ['email' => $user->email], $user, $request);

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully authenticated.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ],
        ], 200);
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($user) {
            Log::info('Administrator logout', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
            ]);

            AuditLogger::log('auth.logout', ['email' => $user->email], $user, $request);
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully logged out.',
        ], 200);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ],
        ], 200);
    }
}
