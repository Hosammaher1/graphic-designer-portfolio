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
                $statusCode = 500;
                $message = 'An internal server error occurred.';

                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                    $statusCode = $e->getStatusCode();
                    $message = $e->getMessage() ?: match ($statusCode) {
                        400 => 'Bad request.',
                        401 => 'Unauthenticated.',
                        403 => 'This action is unauthorized.',
                        404 => 'Resource not found.',
                        405 => 'Method not allowed.',
                        419 => 'Page expired.',
                        422 => 'The given data was invalid.',
                        429 => 'Too many requests.',
                        default => 'An error occurred.',
                    };
                } elseif ($e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
                    $statusCode = 429;
                    $message = 'Too many requests. Please try again later.';
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $statusCode = 401;
                    $message = 'Unauthenticated.';
                } elseif ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    $statusCode = 403;
                    $message = 'This action is unauthorized.';
                } elseif ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    $statusCode = 404;
                    $message = 'Resource not found.';
                } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'status' => 'error',
                        'message' => $e->getMessage() ?: 'The given data was invalid.',
                        'errors' => $e->errors(),
                        'code' => 422,
                    ], 422);
                } elseif ($e instanceof \Illuminate\Database\QueryException) {
                    $statusCode = 500;
                    $message = 'A database error occurred. Details have been safely logged.';
                }

                // In debug mode and not a database query error, allow detailed error message for developers
                if (config('app.debug') && !($e instanceof \Illuminate\Database\QueryException) && $statusCode === 500) {
                    $message = $e->getMessage() ?: 'An internal server error occurred.';
                }

                $headers = [];
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                    $headers = $e->getHeaders();
                }

                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                    'code' => $statusCode,
                ], $statusCode, $headers);
            }
        });
    })->create();
