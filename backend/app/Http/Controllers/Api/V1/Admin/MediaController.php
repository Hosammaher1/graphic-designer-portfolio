<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Services\Media\MediaStorageInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    private const ALLOWED_MIMES = 'jpeg,png,jpg,webp';
    private const MAX_KILOBYTES = 15360; // 15MB

    public function index(): JsonResponse
    {
        $assets = MediaAsset::latest()->paginate(30);

        return response()->json([
            'status' => 'success',
            'data'   => ['assets' => $assets],
        ]);
    }

    public function upload(Request $request, MediaStorageInterface $storage): JsonResponse
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:' . self::ALLOWED_MIMES,
                'max:' . self::MAX_KILOBYTES,
            ],
        ]);

        $uploaded = $storage->upload($request->file('file'));

        $asset = MediaAsset::create($uploaded);

        return response()->json([
            'status' => 'success',
            'data'   => ['asset' => $asset],
        ], 201);
    }

    public function uploadBatch(Request $request, MediaStorageInterface $storage): JsonResponse
    {
        $request->validate([
            'files'   => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => [
                'required',
                'file',
                'mimes:' . self::ALLOWED_MIMES,
                'max:' . self::MAX_KILOBYTES,
            ],
        ]);

        $createdAssets = [];

        foreach ($request->file('files') as $file) {
            $uploaded = $storage->upload($file);
            $createdAssets[] = MediaAsset::create($uploaded);
        }

        return response()->json([
            'status' => 'success',
            'data'   => ['assets' => $createdAssets],
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
}
