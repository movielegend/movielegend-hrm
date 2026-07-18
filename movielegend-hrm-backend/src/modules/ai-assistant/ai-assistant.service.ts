import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiAssistantService {
  private groqApiKey: string;

  constructor(private configService: ConfigService) {
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY') || '';
  }

  async ask(prompt: string): Promise<string> {
    if (!this.groqApiKey) {
      return 'Vui lòng cấu hình GROQ_API_KEY trong file .env để Trợ lý AI có thể hoạt động.';
    }

    try {
      // Groq API sử dụng chuẩn chung của OpenAI nên cực kỳ dễ dùng
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Bạn là một trợ lý AI siêu việt, am hiểu mọi lĩnh vực và có thể trả lời bất kỳ câu hỏi nào của người dùng (từ kiến thức chung, lập trình, tư vấn cuộc sống, đến giải trí). Hãy luôn xưng hô là "mình" và gọi người dùng là "bạn", trả lời một cách thân thiện, cởi mở và thông minh.

Bên cạnh đó, do bạn đang được tích hợp trên ứng dụng nhân sự của công ty MovieLegend, nếu người dùng có hỏi về công ty thì hãy nhớ:
- MovieLegend là một công ty hàng đầu trong lĩnh vực giải trí, truyền thông và sản xuất phim ảnh tại Việt Nam.
- Giờ làm việc: 8:00 sáng đến 17:30 chiều (nghỉ trưa 12:00 - 13:30). Chấm công bằng nhận diện khuôn mặt trên App.
- Hướng dẫn nhân viên dùng App nếu họ hỏi về phép, OT, lương.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Groq API Error:', errorData);
        throw new InternalServerErrorException('Lỗi khi gọi Groq API');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in AiAssistantService:', error);
      throw new InternalServerErrorException('Không thể kết nối đến Trợ lý AI.');
    }
  }
}
