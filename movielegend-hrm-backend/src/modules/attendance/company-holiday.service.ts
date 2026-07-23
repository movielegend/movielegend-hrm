import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyHolidayDto, UpdateCompanyHolidayDto } from './dto/company-holiday.dto';

@Injectable()
export class CompanyHolidayService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.companyHoliday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async findByCompanyId(companyId: string) {
    return this.prisma.companyHoliday.findMany({
      where: { companyId },
      orderBy: { date: 'asc' },
    });
  }

  async create(dto: CreateCompanyHolidayDto) {
    return this.prisma.companyHoliday.create({
      data: {
        companyId: dto.companyId,
        date: new Date(dto.date),
        name: dto.name,
      },
    });
  }

  async update(id: string, dto: UpdateCompanyHolidayDto) {
    return this.prisma.companyHoliday.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.name && { name: dto.name }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.companyHoliday.delete({
      where: { id },
    });
  }
}
