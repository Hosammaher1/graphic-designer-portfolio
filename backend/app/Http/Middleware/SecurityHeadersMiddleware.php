<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and attach strict HTTP security headers.
     * Task 08.01 — Content-Security-Policy, HSTS, X-Frame-Options,
     * X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $production = config('app.env') === 'production';

        $cspDirectives = [
            "default-src 'self'",
            $production ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
            $production ? "style-src 'self' https://fonts.googleapis.com" : "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            $production ? "connect-src 'self' https://*.iconify.design" : "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.iconify.design ws://localhost:* ws://127.0.0.1:*",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
        ];

        $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));
        if ($production) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $origin = $request->header('Origin');
        if ($origin && $request->is('api/*')) {
            $response->headers->set('Cross-Origin-Resource-Policy', 'cross-origin');
        } else {
            $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');
        }

        return $response;
    }
}
