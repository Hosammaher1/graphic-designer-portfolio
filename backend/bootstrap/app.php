<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function (\Illuminate\Http\Request $request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) {
                return $e->getResponse();
            }

            if ($request->is('api/*') || $request->expectsJson()) {
                $locale = $request->getPreferredLanguage(['en', 'ar']) ?: 'en';
                $statusCode = 500;
                $message = trans('api_errors.internal', [], $locale);

                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                    $statusCode = $e->getStatusCode();
                    $key = in_array($statusCode, [400, 401, 403, 404, 405, 419, 422, 429], true)
                        ? 'http_'.$statusCode : 'http_default';
                    $message = trans('api_errors.'.$key, [], $locale);
                } elseif ($e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
                    $statusCode = 429;
                    $message = trans('api_errors.http_429', [], $locale);
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $statusCode = 401;
                    $message = trans('api_errors.http_401', [], $locale);
                } elseif ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    $statusCode = 403;
                    $message = trans('api_errors.http_403', [], $locale);
                } elseif ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    $statusCode = 404;
                    $message = trans('api_errors.http_404', [], $locale);
                } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'status' => 'error',
                        'message' => trans('api_errors.http_422', [], $locale),
                        'errors' => $e->errors(),
                        'code' => 422,
                    ], 422, ['Content-Language' => $locale]);
                } elseif ($e instanceof \Illuminate\Database\QueryException) {
                    $statusCode = 500;
                    $message = trans('api_errors.database', [], $locale);
                }

                // In debug mode and not a database query error, allow detailed error message for developers
                if (config('app.debug') && !($e instanceof \Illuminate\Database\QueryException) && $statusCode === 500) {
                    $message = $e->getMessage() ?: trans('api_errors.internal', [], $locale);
                }

                $headers = [];
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                    $headers = $e->getHeaders();
                }

                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                    'code' => $statusCode,
                ], $statusCode, array_merge($headers, ['Content-Language' => $locale]));
            }
        });
    })->create();
