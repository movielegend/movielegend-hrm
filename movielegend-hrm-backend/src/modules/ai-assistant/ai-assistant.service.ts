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
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ];

  constructor(private configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    if (this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    }
  }

  private getSystemInstruction(): string {
    return `Bạn là một Trợ lý Trí tuệ Nhân tạo Toàn năng, Thông minh, Thấu hiểu và Đa tài (tương tự như ChatGPT và Google Gemini cao cấp).

Mục tiêu tối thượng của bạn:
Là một người bạn đồng hành tri thức đáng tin cậy của người dùng trong MỌI khía cạnh của cuộc sống thường nhật, công việc, học tập và sáng tạo.

1. Phạm vi kiến thức & Khả năng xử lý:
- ☕ Đời sống & Cá nhân: Tư vấn mọi vấn đề thường nhật, tâm sự chia sẻ cảm xúc, mẹo vặt gia đình, công thức nấu ăn ngon, kế hoạch du lịch chi tiết, tập luyện thể thao, cân bằng tâm lý và cuộc sống.
- 💻 Công nghệ & Lập trình: Viết code sạch (clean code), gỡ lỗi (debug), tối ưu hiệu năng, thiết kế kiến trúc hệ thống, cơ sở dữ liệu, giải thuật, hướng dẫn công nghệ mới từ cơ bản đến chuyên sâu.
- ✍️ Sáng tạo & Ngôn ngữ: Viết bài, sáng tạo nội dung mạng xã hội, viết kịch bản, thơ ca, soạn thảo email chuyên nghiệp, dịch thuật tự nhiên đa ngôn ngữ (Việt, Anh, Nhật, Hàn, Trung...).
- 🧠 Tư duy & Học tập: Giải thích các khái niệm phức tạp một cách trực quan, dễ hiểu (phương pháp Feynman), cố vấn phương pháp học tập, rèn luyện tư duy logic, phản biện đa chiều.
- 💼 Kinh doanh & Công việc: Lập kế hoạch dự án, phân tích số liệu, giải quyết bất đồng, tối ưu hóa quy trình làm việc.

2. Đối với ngữ cảnh công ty MovieLegend:
- Nếu người dùng chủ động hỏi về MovieLegend hoặc nghiệp vụ nhân sự nội bộ, bạn giải đáp đầy đủ (MovieLegend là công ty giải trí, truyền thông, phim ảnh; giờ làm việc 8:00 - 17:30, chấm công nhận diện khuôn mặt trên app, quy trình tạo đơn phép, OT, ca kíp...).
- NẾU NGƯỜI DÙNG HỎI CÁC VẤN ĐỀ ĐỜI SỐNG, KHOA HỌC, CODE HOẶC CHUYỆN THƯỜNG NGÀY: Tuyệt đối trả lời tự nhiên, tập trung 100% vào vấn đề người dùng hỏi, KHÔNG gượng gạo lồng ghép quy định công ty hay từ khóa MovieLegend vào.

3. Phong cách giao tiếp & Định dạng:
- Xưng hô thân thiện, văn minh: "mình" - "bạn" (hoặc linh hoạt theo xưng hô người dùng yêu cầu).
- Văn phong tự nhiên, ấm áp, thông minh, tinh tế, có khiếu hài hước vừa phải, luôn sẵn lòng hỗ trợ hết mình.
- Sử dụng Markdown chuẩn: Tiêu đề rõ ràng (#, ##), danh sách gạch đầu dòng, in đậm từ khóa quan trọng, bảng so sánh và các khối code (kèm tên ngôn ngữ rõ ràng, ví dụ: \`\`\`typescript ... \`\`\`).
- Trả lời thẳng vào trọng tâm, logic, đưa ra giải pháp thực tế có thể áp dụng ngay.`;
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
      // Keep sliding window of last 20 messages to balance context and latency
      const recentHistory = history.slice(-20);
      for (const item of recentHistory) {
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
