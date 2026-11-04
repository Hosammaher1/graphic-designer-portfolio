<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\App\Models\User::updateOrCreate(
    ['email' => 'e2e-runner@portfolio.test'],
    [
        'name' => 'E2E Runner',
        'password' => \Illuminate\Support\Facades\Hash::make('SuperE2ETestPass123!'),
        'is_admin' => true,
        'email_verified_at' => now(),
    ]
);
echo "E2E_USER_READY\n";
