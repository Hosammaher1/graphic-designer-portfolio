<?php

namespace Tests\Feature;

use App\Mail\InquiryConfirmationMail;
use App\Mail\InquiryNotificationMail;
use App\Models\Inquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactInquiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_submission_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/contact', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);
    }

    public function test_contact_submission_validates_email_format(): void
    {
        $response = $this->postJson('/api/v1/contact', [
            'name' => 'Sara Ahmed',
            'email' => 'invalid-email-format',
            'subject' => 'Project Inquiry',
            'message' => 'I would like to discuss a brand identity project for our new startup.',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_valid_contact_submission_stores_in_database_and_queues_emails(): void
    {
        Mail::fake();

        $adminEmail = config('portfolio.admin_email', 'admin@mohammed-portfolio.test');

        $payload = [
            'name' => 'Karim Mostafa',
            'email' => 'karim@example.com',
            'subject' => 'Luxury Packaging Commission',
            'message' => 'We are launching a high-end specialty coffee brand and require bespoke box design.',
        ];

        $response = $this->postJson('/api/v1/contact', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
        ]);
        $response->assertJsonStructure([
            'status',
            'message',
            'data' => ['id'],
        ]);

        // 1. Verify DB persistence
        $this->assertDatabaseHas('inquiries', [
            'name' => 'Karim Mostafa',
            'email' => 'karim@example.com',
            'subject' => 'Luxury Packaging Commission',
            'status' => 'new',
            'is_read' => false,
        ]);

        $inquiry = Inquiry::where('email', 'karim@example.com')->first();
        $this->assertNotNull($inquiry);
        $this->assertEquals('We are launching a high-end specialty coffee brand and require bespoke box design.', $inquiry->message);

        // 2. Verify owner notification mail was queued
        Mail::assertQueued(InquiryNotificationMail::class, function ($mail) use ($adminEmail, $inquiry) {
            return $mail->hasTo($adminEmail) &&
                   $mail->inquiry->id === $inquiry->id;
        });

        // 3. Verify sender confirmation mail was queued
        Mail::assertQueued(InquiryConfirmationMail::class, function ($mail) use ($inquiry) {
            return $mail->hasTo('karim@example.com') &&
                   $mail->inquiry->id === $inquiry->id;
        });
    }

    public function test_contact_idempotency_key_prevents_duplicate_inquiry_and_mail(): void
    {
        Mail::fake();
        $payload = [
            'name' => 'Amira Noor',
            'email' => 'amira@example.com',
            'subject' => 'Portfolio project',
            'message' => 'Please contact me about a portfolio design project.',
        ];
        $headers = ['Idempotency-Key' => 'contact-request-123'];

        $first = $this->postJson('/api/v1/contact', $payload, $headers);
        $second = $this->postJson('/api/v1/contact', $payload, $headers);

        $first->assertCreated();
        $second->assertOk();
        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, Inquiry::count());
        Mail::assertQueued(InquiryNotificationMail::class, 1);
        Mail::assertQueued(InquiryConfirmationMail::class, 1);

        $conflict = $this->postJson('/api/v1/contact', array_merge($payload, [
            'message' => 'A different request using the same key.',
        ]), $headers);
        $conflict->assertStatus(409);
        $this->assertSame(1, Inquiry::count());
        Mail::assertQueued(InquiryNotificationMail::class, 1);
    }

    public function test_admin_can_view_and_manage_inquiries(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $inquiry = Inquiry::create([
            'name' => 'Client One',
            'email' => 'client1@example.com',
            'subject' => 'Brand System',
            'message' => 'Inquiry details about a new brand design system.',
            'status' => 'new',
            'is_read' => false,
        ]);

        // Unauthenticated access fails with 401
        $this->getJson('/api/v1/admin/inquiries')->assertStatus(401);

        // Authenticated admin can list inquiries
        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/inquiries');
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Client One']);

        // Authenticated admin can view single inquiry and mark as read
        $showResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/v1/admin/inquiries/{$inquiry->id}");
        $showResponse->assertStatus(200);
        $showResponse->assertJsonFragment(['is_read' => true]);

        $this->assertTrue($inquiry->fresh()->is_read);
    }

    public function test_contact_submission_enforces_length_constraints(): void
    {
        $response = $this->postJson('/api/v1/contact', [
            'name' => 'A',
            'email' => 'valid@example.com',
            'subject' => 'X',
            'message' => 'Short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'subject', 'message']);
    }

    public function test_inquiry_mailables_render_proper_content(): void
    {
        $inquiry = new Inquiry([
            'name' => 'Amira Noor',
            'email' => 'amira@example.com',
            'subject' => 'Packaging Identity',
            'message' => 'Detailed message about packaging design.',
            'ip_address' => '127.0.0.1',
        ]);

        $notificationMail = new InquiryNotificationMail($inquiry);
        $notificationMail->assertHasSubject('[Portfolio Inquiry] Packaging Identity');
        $notificationHtml = $notificationMail->render();
        $this->assertStringContainsString('Amira Noor', $notificationHtml);
        $this->assertStringContainsString('Packaging Identity', $notificationHtml);
        $this->assertStringContainsString('Detailed message about packaging design.', $notificationHtml);

        $confirmationMail = new InquiryConfirmationMail($inquiry);
        $confirmationHtml = $confirmationMail->render();
        $this->assertStringContainsString('Amira Noor', $confirmationHtml);
        $this->assertStringContainsString('Packaging Identity', $confirmationHtml);
        $this->assertStringContainsString('Mohammed Maher', $confirmationHtml);
    }

    public function test_admin_can_filter_and_delete_inquiry(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $unreadInquiry = Inquiry::create([
            'name' => 'Unread Client',
            'email' => 'unread@example.com',
            'subject' => 'Urgent Question',
            'message' => 'Need response quickly regarding branding timeline.',
            'is_read' => false,
        ]);

        $readInquiry = Inquiry::create([
            'name' => 'Read Client',
            'email' => 'read@example.com',
            'subject' => 'General Question',
            'message' => 'Already reviewed inquiry message about design.',
            'is_read' => true,
        ]);

        // Filter unread
        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/inquiries?is_read=false');
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Unread Client']);
        $response->assertJsonMissing(['name' => 'Read Client']);

        // Delete inquiry
        $deleteResponse = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/inquiries/{$unreadInquiry->id}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('inquiries', ['id' => $unreadInquiry->id]);
    }
}
