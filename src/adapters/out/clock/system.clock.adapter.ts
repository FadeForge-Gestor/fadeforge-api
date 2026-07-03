import { IClockPort } from '@core/ports/out/clock/IClockPort';

export class SystemClockAdapter implements IClockPort {
    now(): Date {
        return new Date();
    }
}
