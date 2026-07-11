import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

/**
 * Storage abstraction. Cloudinary today; swap the body of these methods for
 * S3 later without touching callers. Store only the returned `url` + `publicId`.
 */
export interface StoredImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  /** Upload from a local file path (used by the migration script). */
  async uploadFromPath(path: string, folder = 'rosynx/products'): Promise<StoredImage> {
    const res = await cloudinary.uploader.upload(path, {
      folder,
      resource_type: 'image',
    });
    return this.toStored(res);
  }

  /** Upload from an in-memory buffer (used by the HTTP upload endpoint). */
  uploadFromBuffer(buffer: Buffer, folder = 'rosynx/products'): Promise<StoredImage> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (err, res) => {
          if (err || !res) return reject(err);
          resolve(this.toStored(res));
        },
      );
      stream.end(buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  /** Quick connectivity/credentials check. */
  async ping(): Promise<boolean> {
    try {
      await cloudinary.api.ping();
      return true;
    } catch (e) {
      this.logger.error('Cloudinary ping failed', e as Error);
      return false;
    }
  }

  private toStored(res: UploadApiResponse): StoredImage {
    return {
      url: res.secure_url,
      publicId: res.public_id,
      width: res.width,
      height: res.height,
    };
  }
}
