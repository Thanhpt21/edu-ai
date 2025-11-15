import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/roles.module';
import { PermissionsModule } from './modules/permission/permissions.module';
import { RolePermissionsModule } from './modules/role-permission/role-permissions.module';
import { PaymentMethodsModule } from './modules/payment-method/payment-methods.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { PayoutsModule } from './modules/payout/payouts.module';
import { ConfigsModule } from './modules/config/config.module';
import { BlogModule } from './modules/blog/blog.module';
import { ContactModule } from './modules/contact/contact.module';
import { ChatModule } from './modules/chat/chat.module';
import { RedisModule } from './core/redis/redis.module';
import { PromptAIModule } from './modules/promtpAI/promptAI.module';
import { AvatarsModule } from './modules/heygen/avatar/avatar.module';
import { VoicesModule } from './modules/heygen/voice/voice.module';
import { VideosModule } from './modules/heygen/video/video.module';
import { AssetsModule } from './modules/heygen/assets/assets.module';
import { TemplatesModule } from './modules/heygen/templates/templates.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CategoriesModule } from './modules/category/category.module';
import { TagsModule } from './modules/tag/tags.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CoursePrerequisitesModule } from './modules/course-prerequisites/course-prerequisites.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollment/enrollments.module';
import { UserRoleModule } from './modules/user-role/user-role.module';
import { AvatarIVVideoModule } from './modules/heygen/avatarIV/avatar-iv-video.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    RoleModule,
    PermissionsModule,
    RolePermissionsModule,
    PaymentMethodsModule,
    AuditLogModule,
    PayoutsModule,
    ConfigsModule,
    BlogModule,
    ContactModule,
    ChatModule,
    RedisModule,
    PromptAIModule,
    AvatarsModule,
    VoicesModule,
    VideosModule,
    AvatarIVVideoModule,
    AssetsModule,
    TemplatesModule,
    CategoriesModule,
    TagsModule,
    CoursesModule,
    CoursePrerequisitesModule,
    LessonsModule,
    EnrollmentsModule,
    UserRoleModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
