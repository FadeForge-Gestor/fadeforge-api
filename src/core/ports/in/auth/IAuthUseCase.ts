import { LoginInput, LoginOutput } from '@core/domain/auth/auth.entity';

export interface IAuthUseCase {
    login(input: LoginInput): Promise<LoginOutput>;
}
