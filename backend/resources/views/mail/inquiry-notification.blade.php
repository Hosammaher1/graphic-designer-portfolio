<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New Portfolio Inquiry</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">New Portfolio Inquiry Received</h2>
    <p><strong>From:</strong> {{ $inquiry->name }} (&lt;{{ $inquiry->email }}&gt;)</p>
    <p><strong>Subject:</strong> {{ $inquiry->subject }}</p>
    <p><strong>Date:</strong> {{ $inquiry->created_at ? $inquiry->created_at->format('Y-m-d H:i:s T') : now()->format('Y-m-d H:i:s') }}</p>
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin-top: 0;">Message:</h4>
        <p style="white-space: pre-wrap;">{{ $inquiry->message }}</p>
    </div>
    <p style="font-size: 12px; color: #64748b;">IP Address: {{ $inquiry->ip_address }}</p>
</body>
</html>
