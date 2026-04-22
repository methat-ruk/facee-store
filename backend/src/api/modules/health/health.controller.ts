import { Controller, Get } from '@nestjs/common';
import { APP_CONSTANTS } from '../../../config/app.constants';
import { HealthResponseDto } from './dto/health-response.dto';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: APP_CONSTANTS.serviceName,
      timestamp: new Date().toISOString(),
    };
  }
}
