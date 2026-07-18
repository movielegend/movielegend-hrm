import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiAssistantService } from './ai-assistant.service';

@ApiTags('Ai Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Hỏi Trợ lý AI' })
  async ask(@Body('prompt') prompt: string) {
    if (!prompt) {
      return { success: false, message: 'Vui lòng nhập câu hỏi.' };
    }
    
    const reply = await this.aiAssistantService.ask(prompt);
    
    return {
      success: true,
      reply,
    };
  }
}
