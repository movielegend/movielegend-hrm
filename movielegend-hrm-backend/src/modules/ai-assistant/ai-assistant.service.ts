import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiAssistantService {
  private geminiApiKey: string;

  constructor(private configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async ask(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      return 'Vui lòng cấu hình GEMINI_API_KEY trong file .env để Trợ lý AI có thể hoạt động.';
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${this.geminiApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `Bạn là một AI siêu việt, uyên bác và cực kỳ thông minh. Bạn có khả năng trả lời MỌI câu hỏi trên đời, từ kiến thức khoa học, xã hội, lập trình, tư vấn cuộc sống, giải trí, cho đến tâm sự đời thường. Bạn không bị giới hạn trong bất kỳ chủ đề nào, hãy thể hiện sự hiểu biết sâu rộng của bạn! Hãy luôn xưng hô là "mình" và gọi người dùng là "bạn", trả lời một cách tự nhiên, hài hước, thân thiện và cởi mở như một người bạn thực sự.

Dù bạn có thể nói về mọi thứ trên đời, hãy nhớ thêm một chút thông tin phụ: bạn đang được tích hợp trên ứng dụng nhân sự của công ty MovieLegend (công ty hàng đầu trong lĩnh vực giải trí, truyền thông và sản xuất phim ảnh tại Việt Nam). Nếu (và chỉ nếu) người dùng hỏi về công ty, hãy nhớ:
- Giờ làm việc: 8:00 sáng đến 17:30 chiều (nghỉ trưa 12:00 - 13:30). Chấm công bằng nhận diện khuôn mặt trên App.
- Hỗ trợ nhiệt tình nếu họ hỏi về phép, OT, lương thưởng.`
              }
            ]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('================ GEMINI API ERROR ================');
        console.error('Status:', response.status);
        console.error('Error Details:', JSON.stringify(errorData, null, 2));
        
        try {
          const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.geminiApiKey}`);
          const modelsData = await modelsRes.json();
          console.error('=== AVAILABLE MODELS FOR THIS KEY ===');
          console.error(modelsData.models?.map((m: any) => m.name).join(', '));
        } catch(e) {}
        
        console.error('==================================================');
        throw new InternalServerErrorException('Lỗi khi gọi Gemini API: ' + (errorData.error?.message || 'Lỗi không xác định'));
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        console.error('Gemini returned no candidates:', data);
        return 'Xin lỗi, mình không thể trả lời câu hỏi này do bộ lọc an toàn của Google.';
      }

      const content = data.candidates[0].content;
      if (!content || !content.parts || content.parts.length === 0) {
        console.error('Gemini content missing. Finish reason:', data.candidates[0].finishReason);
        return 'Xin lỗi, mình không thể tạo câu trả lời cho nội dung này.';
      }

      return content.parts[0].text;
    } catch (error: any) {
      console.error('Error in AiAssistantService:', error);
      throw new InternalServerErrorException('Lỗi kết nối Trợ lý AI: ' + error.message);
    }
  }
}
