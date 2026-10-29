<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Administrator Bootstrap Credentials
    |--------------------------------------------------------------------------
    |
    | Initial credentials used by AdminUserSeeder.
    | In production, set ADMIN_EMAIL and ADMIN_PASSWORD in your environment.
    | Never commit plaintext production credentials.
    |
    */
    'admin_email' => env('ADMIN_EMAIL', 'admin@mohammed-portfolio.test'),
    'admin_name' => env('ADMIN_NAME', 'Mohammed Maher'),
    'admin_password' => env('ADMIN_PASSWORD'),
];
