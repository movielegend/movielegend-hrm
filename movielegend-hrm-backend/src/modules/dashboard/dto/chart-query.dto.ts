import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum ChartGroupBy {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export class ChartQueryDto {
  @ApiProperty({ type: Date, description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ type: Date, description: 'End date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({ enum: ChartGroupBy, description: 'Group by interval', required: false })
  @IsEnum(ChartGroupBy)
  @IsOptional()
  groupBy?: ChartGroupBy;
}
