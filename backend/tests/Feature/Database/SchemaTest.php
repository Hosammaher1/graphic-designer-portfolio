<?php

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaTest extends TestCase
{
    /**
     * Safety check: Verify test suite strictly connects to isolated portfolio_testing database.
     */
    public function test_tests_run_against_isolated_testing_database(): void
    {
        $currentDb = DB::connection()->getDatabaseName();
        $configuredDb = config('database.connections.mysql.database');

        $this->assertEquals(
            'portfolio_testing',
            $configuredDb,
            'Safety assertion failed: Configured database is not portfolio_testing!'
        );

        $this->assertEquals(
            'portfolio_testing',
            $currentDb,
            'Safety assertion failed: Active database connection is not portfolio_testing!'
        );

        $this->assertNotEquals('portfolio_dev', $currentDb);
        $this->assertNotEquals('production', config('app.env'));
    }

    /**
     * Verify migration up, schema structure, and constraints on disposable DB.
     */
    public function test_schema_constraints_and_tables_exist(): void
    {
        // Run fresh migrations on disposable test database
        $this->artisan('migrate:fresh')->assertSuccessful();

        // Verify core baseline tables exist
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('password_reset_tokens'));
        $this->assertTrue(Schema::hasTable('sessions'));
        $this->assertTrue(Schema::hasTable('cache'));
        $this->assertTrue(Schema::hasTable('jobs'));
        $this->assertTrue(Schema::hasTable('failed_jobs'));

        // Verify users columns
        $this->assertTrue(Schema::hasColumns('users', [
            'id', 'name', 'email', 'email_verified_at', 'password', 'remember_token', 'created_at', 'updated_at'
        ]));

        // Verify uniqueness constraint on users.email
        DB::table('users')->insert([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->expectException(QueryException::class);
        DB::table('users')->insert([
            'name' => 'Duplicate Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('anothersecret'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Test migration rollback (down) and re-run (up) cycle on disposable DB.
     */
    public function test_migration_up_down_cycle_on_disposable_database(): void
    {
        // Ensure migrated
        $this->artisan('migrate')->assertSuccessful();
        $this->assertTrue(Schema::hasTable('users'));

        // Rollback all migrations
        $this->artisan('migrate:reset')->assertSuccessful();
        $this->assertFalse(Schema::hasTable('users'));
        $this->assertFalse(Schema::hasTable('jobs'));

        // Re-run migrations
        $this->artisan('migrate')->assertSuccessful();
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('jobs'));
    }
}
