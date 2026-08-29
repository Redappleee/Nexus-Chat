import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { getApiPublicUrl } from '../config/passport';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function uploadToCloudinary(
  filePath: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
) {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `${uuid()}${path.extname(filePath)}`;
    const dest = path.join(uploadsDir, filename);
    fs.copyFileSync(filePath, dest);
    return { url: `${getApiPublicUrl()}/uploads/${filename}`, publicId: filename };
  }

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: resourceType,
    folder: 'nexus-chat',
  });
  return { url: result.secure_url, publicId: result.public_id, thumbnail: result.eager?.[0]?.secure_url };
}
