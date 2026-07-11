import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get('blog')
  list() {
    return this.blog.list();
  }

  @Public()
  @Get('blog/:slug')
  findOne(@Param('slug') slug: string) {
    return this.blog.findBySlug(slug);
  }

  // ---------------- Admin ----------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/blog')
  adminList() {
    return this.blog.adminList();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/blog')
  create(@Body() dto: CreateBlogPostDto) {
    return this.blog.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/blog/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blog.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/blog/:id')
  remove(@Param('id') id: string) {
    return this.blog.remove(id);
  }
}
