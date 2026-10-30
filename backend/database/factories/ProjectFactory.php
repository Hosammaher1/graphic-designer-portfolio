<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug(3),
            'status' => $this->faker->randomElement(['draft', 'published', 'archived']),
            'is_featured' => false,
            'published_at' => null,
            'year' => $this->faker->numberBetween(2020, 2026),
            'client' => $this->faker->optional()->company(),
            'cover_media_id' => null,
            'view_count' => 0,
            'published_snapshot' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => 'draft']);
    }

    public function published(): static
    {
        return $this->state([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function featured(): static
    {
        return $this->state(['is_featured' => true]);
    }
}
