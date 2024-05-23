import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TestSchema } from 'src/common/schemas/test.schema';
import { HttpService } from 'src/common/services/http.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Test', schema: TestSchema }])],
  providers: [TestService, HttpService],
  exports: [TestService],
})
export class TestModule {}
