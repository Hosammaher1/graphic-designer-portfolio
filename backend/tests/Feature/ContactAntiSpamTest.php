<?php

namespace Tests\Feature;

use App\Models\Inquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ContactAntiSpamTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('contact:127.0.0.1');
    }

    public function test_honeypot_field_triggers_rejection(): void
    {
        Mail::fake();

        $payload = [
            'name' => 'Bot Spammer',
            'email' => 'bot@spammer.org',
            'subject' => 'Buy Crypto Now',
            'message' => 'Spam message sent automatically by web crawler.',
            'website_url' => 'http://spam-link.xyz', // Honeypot populated
        ];

        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['honeypot']);

        // Assert nothing saved to DB and no email queued
        $this->assertDatabaseMissing('inquiries', ['email' => 'bot@spammer.org']);
        Mail::assertNothingQueued();
    }

    public function test_timing_check_triggers_rejection_if_submitted_under_two_seconds(): void
    {
        Mail::fake();

        // Form loaded 500ms ago (< 2s)
        $renderedAt = now()->timestamp;

        $payload = [
            'name' => 'Fast Bot',
            'email' => 'fast@bot.test',
            'subject' => 'Instant Submit',
            'message' => 'Automated form filling submitted in 200 milliseconds.',
            '_timestamp' => $renderedAt,
        ];

        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['timing']);

        $this->assertDatabaseMissing('inquiries', ['email' => 'fast@bot.test']);
        Mail::assertNothingQueued();
    }

    public function test_valid_submission_with_legitimate_timing_and_empty_honeypot_succeeds(): void
    {
        Mail::fake();

        // Form loaded 5 seconds ago (>= 2s)
        $renderedAt = now()->subSeconds(5)->timestamp;

        $payload = [
            'name' => 'Human Client',
            'email' => 'human@client.test',
            'subject' => 'Brand Strategy Request',
            'message' => 'Legitimate inquiry submitted by a human after browsing work.',
            'website_url' => '', // Empty honeypot
            '_timestamp' => $renderedAt,
        ];

        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('inquiries', ['email' => 'human@client.test']);
    }

    public function test_ip_rate_limiter_blocks_fourth_submission_within_one_minute(): void
    {
        Mail::fake();

        $validPayload = [
            'name' => 'Frequent Sender',
            'email' => 'frequent@test.com',
            'subject' => 'Question',
            'message' => 'Valid message content for rate limiting test.',
            '_timestamp' => now()->subSeconds(10)->timestamp,
        ];

        // 3 requests should succeed
        for ($i = 1; $i <= 3; $i++) {
            $res = $this->postJson('/api/v1/contact', $validPayload);
            $res->assertStatus(201);
        }

        // 4th request must be blocked by rate limiter with 429 Too Many Requests
        $fourthResponse = $this->postJson('/api/v1/contact', $validPayload);
        $fourthResponse->assertStatus(429);
        $this->assertNotEmpty($fourthResponse->headers->get('Retry-After'));
    }
}
