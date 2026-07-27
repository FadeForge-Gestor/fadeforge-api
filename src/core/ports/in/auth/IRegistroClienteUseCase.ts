import { RegistroClienteInput, RegistroClienteOutput } from '@core/domain/auth/auth.entity';

export interface IRegistroClienteUseCase {
    registrar(input: RegistroClienteInput): Promise<RegistroClienteOutput>;
}
