<?php

namespace Database\Factories;

use App\Models\Tool;
use Illuminate\Database\Eloquent\Factories\Factory;

class ToolFactory extends Factory
{
    protected $model = Tool::class;

    private static array $tools = [
        ['name' => 'Adobe Illustrator', 'slug' => 'adobe-illustrator'],
        ['name' => 'Adobe Photoshop', 'slug' => 'adobe-photoshop'],
        ['name' => 'Adobe InDesign', 'slug' => 'adobe-indesign'],
        ['name' => 'Figma', 'slug' => 'figma'],
        ['name' => 'Affinity Designer', 'slug' => 'affinity-designer'],
        ['name' => 'Procreate', 'slug' => 'procreate'],
        ['name' => 'Cinema 4D', 'slug' => 'cinema-4d'],
        ['name' => 'After Effects', 'slug' => 'after-effects'],
    ];

    public function definition(): array
    {
        $tool = $this->faker->unique()->randomElement(self::$tools);

        return [
            'name' => $tool['name'],
            'slug' => $tool['slug'] . '-' . $this->faker->unique()->numberBetween(1, 9999),
            'icon_url' => null,
        ];
    }
}
