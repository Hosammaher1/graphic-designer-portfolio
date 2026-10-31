<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Inquiry Confirmation</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Thank You for Reaching Out / شكراً لتواصلك</h2>
    <p>Hello {{ $inquiry->name }},</p>
    <p>Thank you for reaching out regarding <strong>{{ $inquiry->subject }}</strong>. Your message has been safely received, and I will get back to you within 24–48 hours.</p>

    <div style="direction: rtl; text-align: right; background: #f8fafc; border-right: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0;">أهلاً {{ $inquiry->name }}،<br>شكراً لتواصلك بخصوص <strong>{{ $inquiry->subject }}</strong>. تم استلام رسالتك بنجاح، وسأقوم بالرد عليك في أقرب وقت ممكن خلال 24–48 ساعة.</p>
    </div>

    <p style="margin-top: 25px;">Best regards,<br><strong>Mohammed Maher</strong><br>Graphic & Brand Identity Designer</p>
</body>
</html>
