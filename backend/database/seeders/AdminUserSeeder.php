<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds exactly one administrator idempotently.
     * Password is read from configuration/environment; if not set,
     * a secure cryptographically random 32-character string is generated
     * to prevent using hardcoded or default credentials.
     */
    public function run(): void
    {
        $email = config('portfolio.admin_email', env('ADMIN_EMAIL', 'admin@mohammed-portfolio.test'));
        $name = config('portfolio.admin_name', env('ADMIN_NAME', 'Mohammed Maher'));
        $password = config('portfolio.admin_password', env('ADMIN_PASSWORD'));

        // If no password provided, generate a secure random bootstrap password
        if (empty($password)) {
            $password = Str::random(32);
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );
    }
}
