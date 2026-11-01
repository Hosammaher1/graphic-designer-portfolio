<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SystemAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $alertData
    ) {
    }

    public function envelope(): Envelope
    {
        $severity = strtoupper($this->alertData['severity'] ?? 'WARNING');
        $title = $this->alertData['title'] ?? 'System Health Alert';

        return new Envelope(
            subject: "[{$severity}] Mohammed Portfolio Health Alert: {$title} / تنبيه النظام"
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->renderHtml()
        );
    }

    protected function renderHtml(): string
    {
        $severity = strtoupper($this->alertData['severity'] ?? 'WARNING');
        $color = $severity === 'RECOVERY' ? '#10b981' : ($severity === 'CRITICAL' ? '#ef4444' : '#f59e0b');
        $title = htmlspecialchars($this->alertData['title'] ?? 'Alert');
        $message = htmlspecialchars($this->alertData['message'] ?? '');
        $timestamp = htmlspecialchars($this->alertData['timestamp'] ?? now()->toIso8601String());

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 8px; border: 1px solid #334155; overflow: hidden;">
        <div style="background-color: {$color}; color: #ffffff; padding: 16px 24px; font-weight: bold; font-size: 18px;">
            [{$severity}] {$title}
        </div>
        <div style="padding: 24px;">
            <p style="font-size: 16px; margin-top: 0;">{$message}</p>
            <div style="background-color: #0f172a; border-radius: 6px; padding: 12px; margin-top: 16px; font-size: 13px; color: #94a3b8;">
                <strong>Detected:</strong> {$timestamp}<br>
                <strong>Host:</strong> Mohammed Portfolio Production System
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
