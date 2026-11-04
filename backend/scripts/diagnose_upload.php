<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use App\Services\Security\FileUploadSecurityService;
use App\Services\Media\FakeMediaStorage;
use App\Models\MediaAsset;

echo "=== PHP ENVIRONMENT & UPLOAD LIMITS ===\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n";

echo "\n=== MEDIA_ASSETS TABLE COLUMNS ===\n";
$columns = DB::select('DESCRIBE media_assets');
foreach ($columns as $col) {
    echo "  {$col->Field} ({$col->Type}) Null: {$col->Null}, Key: {$col->Key}, Default: " . var_export($col->Default, true) . "\n";
}

echo "\n=== TESTING REAL IMAGE VALIDATION & UPLOAD ===\n";
$realImagePath = base_path('../frontend/public/logo/logo.png');
echo "Testing with real image: $realImagePath\n";
echo "Size: " . filesize($realImagePath) . " bytes\n";
$imageInfo = @getimagesize($realImagePath);
echo "Dimensions: " . ($imageInfo ? "{$imageInfo[0]} x {$imageInfo[1]} ({$imageInfo['mime']})" : "FAILED") . "\n";

$tempCopy = tempnam(sys_get_temp_dir(), 'real_img_') . '.png';
copy($realImagePath, $tempCopy);
$uploadedFile = new UploadedFile($tempCopy, 'test-real-logo.png', 'image/png', null, true);

$securityService = app(FileUploadSecurityService::class);
try {
    $securityService->validateFile($uploadedFile);
    echo "FileUploadSecurityService: VALIDATION PASSED!\n";
} catch (\Throwable $e) {
    echo "FileUploadSecurityService: VALIDATION FAILED! Error: " . $e->getMessage() . "\n";
}

$storage = app(FakeMediaStorage::class);
try {
    $uploadResult = $storage->upload($uploadedFile);
    echo "FakeMediaStorage: UPLOAD PASSED!\n";
    print_r($uploadResult);
    
    // Test MediaAsset creation
    $asset = MediaAsset::create($uploadResult);
    echo "MediaAsset created with ID: {$asset->id}\n";
    print_r($asset->toArray());

    // Check physical file on disk
    $expectedDiskPath = storage_path('app/public/media/' . $uploadResult['file_name']);
    echo "Checking disk path: $expectedDiskPath\n";
    if (file_exists($expectedDiskPath)) {
        echo "File EXISTS on disk! Size: " . filesize($expectedDiskPath) . " bytes\n";
    } else {
        echo "File DOES NOT EXIST on disk!\n";
    }

    // Check HTTP URL
    $testUrl = 'http://127.0.0.1:8001' . $uploadResult['original_url'];
    echo "Checking HTTP GET: $testUrl\n";
    $ctx = stream_context_create(['http' => ['ignore_errors' => true]]);
    $content = @file_get_contents($testUrl, false, $ctx);
    echo "HTTP response length: " . strlen((string)$content) . " bytes\n";
    echo "Headers: \n" . implode("\n", $http_response_header ?? []) . "\n";

    // Clean up
    $asset->delete();
    @unlink($expectedDiskPath);
    echo "Cleaned up test asset and file.\n";
} catch (\Throwable $e) {
    echo "FakeMediaStorage: UPLOAD FAILED! Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

@unlink($tempCopy);
echo "\n=== END DIAGNOSIS ===\n";
