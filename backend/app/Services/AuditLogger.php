<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Request as RequestFacade;

class AuditLogger
{
    /**
     * Forbidden keys that must be scrubbed from audit payloads.
     */
    protected static array $sensitiveKeys = [
        'password',
        'current_password',
        'password_confirmation',
        'token',
        'secret',
        'api_key',
        'authorization',
        'bearer',
        'message',
        'body',
        'payload',
        'exception',
        'trace',
        'cookie',
    ];

    /**
     * Record an audit event into the append-only audit log.
     */
    public static function log(string $action, array $details = [], ?object $user = null, ?Request $request = null): AuditLog
    {
        $req = $request ?: request();
        $actorUser = $user ?: $req?->user();

        $sanitizedDetails = self::scrubSensitiveData($details);

        return AuditLog::create([
            'user_id' => $actorUser?->id,
            'actor_email' => $actorUser?->email ?? ($details['email'] ?? null),
            'action' => $action,
            'ip_address' => $req?->ip(),
            'user_agent' => $req?->userAgent() ? 'sha256:'.hash('sha256', $req->userAgent()) : null,
            'details' => $sanitizedDetails,
            'created_at' => now(),
        ]);
    }

    /**
     * Recursively redact sensitive keys from details array.
     */
    public static function scrubSensitiveData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);
            $isSensitive = false;

            foreach (self::$sensitiveKeys as $pattern) {
                if (str_contains($lowerKey, $pattern)) {
                    $isSensitive = true;
                    break;
                }
            }

            if ($isSensitive) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::scrubSensitiveData($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
