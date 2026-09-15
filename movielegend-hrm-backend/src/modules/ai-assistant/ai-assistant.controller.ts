import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiAssistantService } from './ai-assistant.service';

export interface AskChatbotDto {
  prompt: string;
  history?: Array<{
    role: 'user' | 'model' | 'assistant';
    text?: string;
    parts?: any;
  }>;
}

@ApiTags('Ai Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Hỏi Trợ lý AI' })
  async ask(@Body() dto: AskChatbotDto) {
    const prompt = dto?.prompt;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return { success: false, message: 'Vui lòng nhập câu hỏi.' };
    }

    const reply = await this.aiAssistantService.ask(prompt.trim(), dto?.history);

    return {
      success: true,
      reply,
    };
  }
}
