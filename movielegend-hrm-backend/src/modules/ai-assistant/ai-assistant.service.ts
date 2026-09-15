import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private geminiApiKey: string;
  private genAI: GoogleGenerativeAI | null = null;
  private readonly candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3-flash-preview',
  ];

  constructor(private configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    if (this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    }
  }

  private getSystemInstruction(): string {
    return `Bạn là MovieLegend AI - một trợ lý trí tuệ nhân tạo toàn năng, thông minh, uyên bác và đa tài (tương tự như ChatGPT hay Google Gemini).

Nhiệm vụ & Khả năng của bạn:
1. Bạn có khả năng trả lời, tư vấn và giải quyết MỌI câu hỏi trên tất cả các lĩnh vực mà người dùng cần hỏi:
   - 💻 Công nghệ & Lập trình: Viết mã nguồn, gỡ lỗi (debug), tối ưu hóa, giải thích thuật toán, thiết kế cơ sở dữ liệu, DevOps, Mobile/Web development, AI/ML.
   - 💼 Công việc & Văn phòng: Soạn thảo email trang trọng, viết báo cáo công việc, lập kế hoạch dự án, phân tích số liệu, brainstorming ý tưởng kinh doanh, tối ưu quy trình làm việc.
   - ✍️ Sáng tạo & Biên dịch: Dịch thuật đa ngôn ngữ (Việt - Anh - Nhật - Hàn - Trung...), viết kịch bản, sáng tạo nội dung truyền thông, hiệu đính văn phong, tóm tắt tài liệu dài.
   - 🧠 Tư duy & Giải quyết vấn đề: Phân tích logic, tư vấn giải pháp xử lý sự cố, phương pháp học tập, rèn luyện kỹ năng mềm, giải thích các khái niệm khoa học/triết học/kinh tế phức tạp một cách dễ hiểu.
   - ☕ Đời sống & Giải trí: Trò chuyện tâm sự, mẹo vặt cuộc sống, gợi ý sách, phim ảnh, du lịch, cân bằng cuộc sống và công việc.

2. Khi người dùng hỏi về MovieLegend hoặc nghiệp vụ nhân sự/nội bộ:
   - Bạn nắm rõ bối cảnh: MovieLegend là công ty giải trí, truyền thông và sản xuất phim ảnh hàng đầu tại Việt Nam.
   - Giờ làm việc tiêu chuẩn: 8:00 - 17:30 (nghỉ trưa 12:00 - 13:30). Chấm công nhận diện khuôn mặt qua Mobile App.
   - Nhiệt tình hướng dẫn về các quy trình: tạo đơn nghỉ phép, xin tăng ca OT, đổi ca, thanh toán chi phí, đánh giá thi đua, ứng lương... khi được hỏi.

3. Phong cách & Định dạng câu trả lời:
   - Xưng hô thân thiện: "mình" - "bạn" (hoặc linh hoạt theo xưng hô người dùng yêu cầu).
   - Tự nhiên, thông minh, sắc sảo, lịch thiệp, giàu tính xây dựng và luôn sẵn sàng hỗ trợ hết mình.
   - Sử dụng định dạng Markdown đẹp mắt: tiêu đề rõ ràng, bullet points, in đậm từ khóa quan trọng, bảng so sánh và các khối code (kèm tên ngôn ngữ) khi cần.
   - Đi thẳng vào trọng tâm, giải thích logic, đưa ra ví dụ thực tế và giải pháp hành động cụ thể.`;
  }

  async ask(prompt: string, history?: any[]): Promise<string> {
    if (!this.geminiApiKey || !this.genAI) {
      return 'Vui lòng cấu hình GEMINI_API_KEY trong file .env để Trợ lý AI có thể hoạt động.';
    }

    if (!prompt || !prompt.trim()) {
      return 'Vui lòng nhập câu hỏi để mình hỗ trợ bạn nhé!';
    }

    const formattedHistory: ChatHistoryItem[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (!item || !item.role) continue;
        const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
        let text = '';
        if (typeof item.text === 'string') {
          text = item.text;
        } else if (Array.isArray(item.parts) && item.parts.length > 0) {
          text = item.parts.map((p: any) => (typeof p === 'string' ? p : p.text || '')).join('');
        }
        if (text.trim()) {
          formattedHistory.push({
            role,
            parts: [{ text: text.trim() }],
          });
        }
      }
    }

    // Attempt generation across candidate models with automatic fallback
    let lastError: any = null;

    for (const modelName of this.candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: this.getSystemInstruction(),
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        });

        if (formattedHistory.length > 0) {
          const chat = model.startChat({
            history: formattedHistory,
          });
          const result = await chat.sendMessage(prompt);
          const responseText = result.response.text();
          if (responseText) {
            return responseText;
          }
        } else {
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          if (responseText) {
            return responseText;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Model ${modelName} failed: ${err.message}. Trying next fallback model...`);
        lastError = err;
      }
    }

    this.logger.error('All candidate Gemini models failed:', lastError);
    throw new InternalServerErrorException(
      'Lỗi kết nối Trợ lý AI: ' + (lastError?.message || 'Không thể kết nối đến máy chủ AI lúc này, vui lòng thử lại sau.')
    );
  }
}
