// upload.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UploadService {
  private supabase;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key is missing in environment variables');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Thay đổi tên bucket từ 'avatars' thành 'images'
  private get bucketName(): string {
    return this.configService.get<string>('SUPABASE_BUCKET_NAME', 'images'); // Đổi thành 'images'
  }

  async uploadLocalImage(file: Express.Multer.File): Promise<string> {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = `uploads/${fileName}`;

    // Upload file
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new BadRequestException('Không thể tải lên ảnh: ' + error.message);
    }

    // Lấy public URL - API mới không có error return
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl; // Trả về publicUrl
  }

  // Hàm xóa file từ Supabase Storage
  async deleteLocalImage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      return;
    }

    try {
      // Xử lý cả URL đầy đủ và relative path
      let filePath: string;

      if (imageUrl.startsWith('http')) {
        // URL đầy đủ từ Supabase: https://xxx.supabase.co/storage/v1/object/public/images/uploads/abc.jpg
        const bucketPath = `/storage/v1/object/public/${this.bucketName}/`;
        
        if (!imageUrl.includes(bucketPath)) {
          console.log('⚠️ URL không phải từ Supabase bucket, bỏ qua xóa:', imageUrl);
          return;
        }

        const parts = imageUrl.split(bucketPath);
        if (parts.length < 2 || !parts[1]) {
          console.log('⚠️ Không thể parse URL, bỏ qua xóa:', imageUrl);
          return;
        }
        
        filePath = parts[1];
      } else {
        // Relative path: uploads/abc.jpg
        filePath = imageUrl.replace(/^\/+/, ''); // Xóa dấu / đầu nếu có
      }

      console.log('🗑️ Đang xóa file:', filePath);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('❌ Lỗi xóa file:', error.message);
        // Không throw error để không làm gián đoạn việc update
        // throw new BadRequestException('Không thể xóa ảnh: ' + error.message);
      } else {
        console.log('✅ Xóa file thành công:', filePath);
      }
    } catch (error) {
      console.error('❌ Lỗi khi xóa ảnh:', error);
      // Không throw để không làm gián đoạn việc update
    }
  }
}
