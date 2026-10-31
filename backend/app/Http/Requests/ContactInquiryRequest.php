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
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'min:2', 'max:200'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ];
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
