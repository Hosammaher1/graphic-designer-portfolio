<?php

namespace Database\Factories;

use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectMediaFactory extends Factory
{
    protected $model = ProjectMedia::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'media_asset_id' => MediaAsset::factory(),
            'sort_order' => $this->faker->numberBetween(0, 50),
            'is_cover' => false,
            'caption_ar' => $this->faker->optional()->sentence(4),
            'caption_en' => $this->faker->optional()->sentence(4),
        ];
    }

    public function cover(): static
    {
        return $this->state(['is_cover' => true, 'sort_order' => 0]);
    }
}
