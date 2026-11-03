<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class SetAdminPasswordCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:set-password
                            {email? : The administrator email address}
                            {--email= : The administrator email address}
                            {--create : Create a new administrator account if one does not exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Securely set or reset the administrator password in the local terminal';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email') ?: $this->option('email');

        if (empty($email)) {
            $existingAdmin = User::where('is_admin', true)->first();
            $defaultEmail = $existingAdmin?->email ?? config('portfolio.admin_email', 'admin@portfolio.test');

            $email = $this->ask('Enter administrator email', $defaultEmail);
        }

        $email = strtolower(trim((string) $email));

        $emailValidator = Validator::make(['email' => $email], [
            'email' => ['required', 'string', 'email:rfc,filter', 'max:255', 'not_regex:/[\r\n]/'],
        ]);

        if ($emailValidator->fails()) {
            $this->error('The provided email address is invalid.');
            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $create = (bool) $this->option('create');

            if (!$create) {
                if (!$this->input->isInteractive()) {
                    $this->error("Administrator account with email [{$email}] was not found. Use --create to initialize a new administrator.");
                    return self::FAILURE;
                }

                if (!$this->confirm("Administrator account [{$email}] was not found. Do you want to create a new administrator account?", true)) {
                    $this->warn('Operation cancelled.');
                    return self::FAILURE;
                }
            }

            $defaultName = config('portfolio.admin_name', 'Mohammed Maher Aldaya');
            $name = $this->ask('Enter administrator full name', $defaultName);

            $user = new User([
                'name' => trim((string) $name) ?: $defaultName,
                'email' => $email,
                'is_admin' => true,
            ]);
            $user->email_verified_at = now();

            $this->info("Initializing new administrator account: {$user->name} ({$user->email})");
        } else {
            $this->info("Found existing administrator account: {$user->name} ({$user->email})");
            $user->is_admin = true;
        }

        $this->newLine();
        $this->comment('Enter the new administrator password. Keystrokes will remain hidden.');

        $password = $this->secret('New administrator password (hidden)');

        if (empty($password)) {
            $this->error('Password cannot be empty.');
            return self::FAILURE;
        }

        $confirmation = $this->secret('Confirm new administrator password (hidden)');

        if ($password !== $confirmation) {
            $this->error('Password confirmation does not match.');
            return self::FAILURE;
        }

        $passwordValidator = Validator::make(
            ['password' => $password],
            [
                'password' => [
                    'required',
                    'string',
                    Password::min(8)
                        ->letters()
                        ->mixedCase()
                        ->numbers(),
                ],
            ],
            [
                'password.min' => 'The password must be at least 8 characters long.',
                'password.letters' => 'The password must contain at least one letter.',
                'password.mixed' => 'The password must contain both uppercase and lowercase letters.',
                'password.numbers' => 'The password must contain at least one number.',
            ]
        );

        if ($passwordValidator->fails()) {
            $this->error('Password does not meet strength requirements:');
            foreach ($passwordValidator->errors()->all() as $error) {
                $this->error("  • {$error}");
            }
            return self::FAILURE;
        }

        // Securely hash and update user record
        $user->password = Hash::make($password);
        $user->is_admin = true;

        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
        }

        $isNewUser = !$user->exists;
        $user->save();

        // Wipe plaintext variables from memory
        unset($password, $confirmation);

        // Record audit event without exposing credentials
        AuditLogger::log('admin.password.cli_set', [
            'user_id' => $user->id,
            'email' => $user->email,
            'action' => $isNewUser ? 'created' : 'password_updated',
        ], $user);

        $this->newLine();
        $this->info("✓ Administrator password for [{$user->email}] has been securely configured.");
        $this->line('You can now log in at: http://localhost:5173/admin/login');

        return self::SUCCESS;
    }
}
