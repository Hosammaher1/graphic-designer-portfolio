<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectTranslation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectTranslationFactory extends Factory
{
    protected $model = ProjectTranslation::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'locale' => $this->faker->randomElement(['ar', 'en']),
            'title' => $this->faker->sentence(4),
            'summary' => $this->faker->sentence(12),
            'description' => $this->faker->paragraphs(3, true),
            'seo_title' => $this->faker->sentence(5),
            'seo_description' => $this->faker->sentence(15),
        ];
    }
}
