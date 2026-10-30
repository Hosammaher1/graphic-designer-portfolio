<?php

namespace Database\Factories;

use App\Models\MediaAsset;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaAssetFactory extends Factory
{
    protected $model = MediaAsset::class;

    public function definition(): array
    {
        $width = $this->faker->numberBetween(800, 3840);
        $height = $this->faker->numberBetween(600, 2160);

        return [
            'provider' => 'local',
            'provider_id' => $this->faker->optional()->uuid(),
            'file_name' => $this->faker->slug(2) . '.jpg',
            'mime_type' => $this->faker->randomElement(['image/jpeg', 'image/png', 'image/webp']),
            'bytes' => $this->faker->numberBetween(10240, 5242880),
            'width' => $width,
            'height' => $height,
            'original_url' => null,
            'variants' => null,
            'has_watermark' => false,
            'reference_count' => 0,
        ];
    }

    public function cloudinary(): static
    {
        return $this->state([
            'provider' => 'cloudinary',
            'provider_id' => 'portfolio/' . $this->faker->uuid(),
        ]);
    }
}
