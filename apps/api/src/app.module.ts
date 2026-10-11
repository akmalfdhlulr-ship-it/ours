import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { EmailModule } from './infrastructure/email/email.module';
import { PlacesModule as InfraPlacesModule } from './infrastructure/places/places.module';
import { NotificationsModule } from './infrastructure/notifications/notifications.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { HomeModule } from './modules/home/home.module';
import { PlacesModule } from './modules/places/places.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { DatesModule } from './modules/dates/dates.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { VisitsModule } from './modules/visits/visits.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { MediaModule } from './modules/media/media.module';
import { MemoriesModule } from './modules/memories/memories.module';
import { MemoryMapModule } from './modules/memory-map/memory-map.module';
import { LettersModule } from './modules/letters/letters.module';
import { TimeCapsulesModule } from './modules/time-capsules/time-capsules.module';
import { GoalsModule } from './modules/goals/goals.module';
import { DecisionsModule } from './modules/decisions/decisions.module';
import { GamesModule } from './modules/games/games.module';
import { SurprisesModule } from './modules/surprises/surprises.module';
import { WrappedModule } from './modules/wrapped/wrapped.module';
import { AiModule } from './modules/ai/ai.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    StorageModule,
    EmailModule,
    InfraPlacesModule,
    NotificationsModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SpacesModule,
    HomeModule,
    PlacesModule,
    WishlistModule,
    DatesModule,
    CalendarModule,
    VisitsModule,
    ReviewsModule,
    ExpensesModule,
    MediaModule,
    MemoriesModule,
    MemoryMapModule,
    LettersModule,
    TimeCapsulesModule,
    GoalsModule,
    DecisionsModule,
    GamesModule,
    SurprisesModule,
    WrappedModule,
    AiModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('{*path}');
  }
}
