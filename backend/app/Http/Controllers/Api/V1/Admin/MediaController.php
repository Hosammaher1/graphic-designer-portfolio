<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Services\Media\MediaStorageInterface;
use App\Services\Security\FileUploadSecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    private const ALLOWED_MIMES = 'jpeg,png,jpg,webp,avif,svg,pdf';
    private const MAX_KILOBYTES = 15360; // 15MB

    public function index(): JsonResponse
    {
        $assets = MediaAsset::latest()->paginate(30);

        return response()->json([
            'status' => 'success',
            'data'   => ['assets' => $assets],
        ]);
    }

    public function upload(Request $request, MediaStorageInterface $storage, FileUploadSecurityService $securityService): JsonResponse
    {
        if (app()->environment('production') && ! config('services.cloudinary.cloud_name')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Production uploads are disabled until persistent external storage (Cloudinary Free) is configured. Please provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment settings.',
            ], 503);
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:' . self::MAX_KILOBYTES,
            ],
        ]);

        $file = $request->file('file');
        $securityService->validateFile($file);

        try {
            $uploaded = $storage->upload($file);
        } catch (\InvalidArgumentException $e) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'file' => [$e->getMessage()],
            ]);
        } catch (\RuntimeException $e) {
            Log::error('Media storage upload failure: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }

        $asset = MediaAsset::create($uploaded);

        return response()->json([
            'status' => 'success',
            'data'   => ['asset' => $asset],
        ], 201);
    }

    public function uploadBatch(Request $request, MediaStorageInterface $storage, FileUploadSecurityService $securityService): JsonResponse
    {
        if (app()->environment('production') && ! config('services.cloudinary.cloud_name')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Production uploads are disabled until persistent external storage (Cloudinary Free) is configured. Please provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment settings.',
            ], 503);
        }

        $request->validate([
            'files'   => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => [
                'required',
                'file',
                'max:' . self::MAX_KILOBYTES,
            ],
        ]);

        $createdAssets = [];

        foreach ($request->file('files') as $file) {
            $securityService->validateFile($file);
            try {
                $uploaded = $storage->upload($file);
            } catch (\InvalidArgumentException $e) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'files' => [$e->getMessage()],
                ]);
            } catch (\RuntimeException $e) {
                Log::error('Media storage batch upload failure: ' . $e->getMessage());
                return response()->json([
                    'status'  => 'error',
                    'message' => $e->getMessage(),
                ], 422);
            }
            $createdAssets[] = MediaAsset::create($uploaded);
        }

        return response()->json([
            'status' => 'success',
            'data'   => ['assets' => $createdAssets],
        ]);
    }

    public function signUpload(Request $request, FileUploadSecurityService $securityService): JsonResponse
    {
        $params = $request->validate([
            'folder'    => ['nullable', 'string', 'max:100'],
            'public_id' => ['nullable', 'string', 'max:100'],
            'tags'      => ['nullable', 'string', 'max:255'],
        ]);

        $signedData = $securityService->signUpload(array_filter($params));

        return response()->json([
            'status' => 'success',
            'data'   => $signedData,
        ]);
    }

    public function destroy(int $id, MediaStorageInterface $storage): JsonResponse
    {
        $asset = MediaAsset::find($id);

        if (! $asset) {
            return response()->json(['status' => 'error', 'message' => 'Media asset not found.'], 404);
        }

        if ($asset->provider_id) {
            $storage->delete($asset->provider_id);
        }

        $asset->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Media asset deleted successfully.',
        ]);
    }

    public function toggleWatermark(Request $request, int $id): JsonResponse
    {
        $asset = MediaAsset::find($id);

        if (! $asset) {
            return response()->json(['status' => 'error', 'message' => 'Media asset not found.'], 404);
        }

        $request->validate([
            'has_watermark' => ['required', 'boolean'],
        ]);

        $asset->update([
            'has_watermark' => $request->boolean('has_watermark'),
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => ['asset' => $asset],
        ]);
    }
}
