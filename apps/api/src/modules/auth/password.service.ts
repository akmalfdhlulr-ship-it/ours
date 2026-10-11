import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AUTH_CONFIG } from '@ours/core';

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
