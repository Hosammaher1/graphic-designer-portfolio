<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactInquiryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email:rfc,filter', 'max:255', 'not_regex:/[\r\n]/'],
            'subject' => ['required', 'string', 'min:2', 'max:200'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            'website_url' => ['nullable', 'string'],
            'hp_fax' => ['nullable', 'string'],
            'website' => ['nullable', 'string'],
            '_timestamp' => ['nullable'],
            '_form_loaded_at' => ['nullable'],
        ];
    }

    /**
     * Configure after validation hooks for anti-spam honeypot and timing checks.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // 1. Anti-spam honeypot check
            $honeypotFields = ['website_url', 'hp_fax', 'website'];
            foreach ($honeypotFields as $field) {
                if ($this->filled($field)) {
                    $validator->errors()->add('honeypot', 'Spam detected. / تم اكتشاف نشاط مشبوه.');
                    return;
                }
            }

            // 2. Submission timing check
            $timestamp = $this->input('_timestamp') ?? $this->input('_form_loaded_at');
            if ($timestamp !== null && is_numeric($timestamp)) {
                // If timestamp in milliseconds, normalize to seconds
                if ($timestamp > 10000000000) {
                    $timestamp = (int) round($timestamp / 1000);
                }

                $elapsed = now()->timestamp - (int) $timestamp;

                // Rejected if submitted under 2 seconds from form render
                if ($elapsed < 2) {
                    $validator->errors()->add(
                        'timing',
                        'Submission occurred too quickly. Please take your time. / تم الإرسال بسرعة غير طبيعية، يرجى المحاولة بعد قليل.'
                    );
                }
            }
        });
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب / Name is required.',
            'email.required' => 'البريد الإلكتروني مطلوب / Email address is required.',
            'email.email' => 'الرجاء إدخال بريد إلكتروني صحيح / Please provide a valid email address.',
            'subject.required' => 'موضوع الرسالة مطلوب / Subject is required.',
            'message.required' => 'نص الرسالة مطلوب / Message body is required.',
            'message.min' => 'نص الرسالة يجب ألا يقل عن 10 أحرف / Message must be at least 10 characters.',
        ];
    }
}
