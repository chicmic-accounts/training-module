import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request?.headers?.usermeta) {
      throw new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED);
    }
    const headers = JSON.parse(request?.headers?.usermeta);
    request['user'] = {
      userId: headers?.user._id,
      role: headers?.user.role,
    };
    if (headers?.user && headers?.user._id) {
      return true;
    } else {
      throw new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED);
    }
  }
}
