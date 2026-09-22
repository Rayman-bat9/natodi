import type { APIRequestContext } from '@playwright/test';
import { PUBLIC_API_BASE_URL } from '../../config/test-env';
import {
  appointmentResponseSchema,
  branchListSchema,
  bookTimesSchema,
  identitySchema,
  type AppointmentResponse,
  type BookTimes,
  type BranchList,
  type Identity,
} from '../schemas/natodi.public.schemas';
import { toResult, type ApiResult } from './api-result';

/**
 * Client for the documented Partner API (`/api/public/v1`).
 *
 * The suite uses it for two things the widget cannot do: reading availability
 * straight from the source, and cancelling an appointment a UI test created.
 * Cancelling is a write, and it is deliberate - it is the compensating action that
 * keeps a test run from leaving live bookings behind. Nothing else here mutates.
 *
 * The caller supplies a context carrying `X-API-Key`; see `publicApi` in the
 * fixtures for why that context is never a browser one.
 */
export class NatodiPublicApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Which company the key is bound to. */
  async getIdentity(): Promise<ApiResult<Identity>> {
    const response = await this.request.get(`${PUBLIC_API_BASE_URL}/me`);
    return toResult(response, identitySchema);
  }

  async getBranches(): Promise<ApiResult<BranchList>> {
    const response = await this.request.get(`${PUBLIC_API_BASE_URL}/branches`);
    return toResult(response, branchListSchema);
  }

  /** Free start times on one day, in the branch's local time. */
  async getBookTimes(params: {
    branchId: string;
    bookDate: string;
    serviceId?: string;
  }): Promise<ApiResult<BookTimes>> {
    const response = await this.request.get(`${PUBLIC_API_BASE_URL}/book_times`, {
      params: {
        branch_id: params.branchId,
        book_date: params.bookDate,
        ...(params.serviceId ? { services: params.serviceId } : {}),
      },
    });
    return toResult(response, bookTimesSchema);
  }

  async getAppointment(appointmentId: string): Promise<ApiResult<AppointmentResponse>> {
    const response = await this.request.get(`${PUBLIC_API_BASE_URL}/appointments/${appointmentId}`);
    return toResult(response, appointmentResponseSchema);
  }

  /**
   * Cancels an appointment. This is the only write the suite performs: it undoes a
   * booking a UI test created, and it is what keeps repeated runs from piling up
   * live appointments in the salon's calendar.
   */
  async cancelAppointment(appointmentId: string): Promise<ApiResult<AppointmentResponse>> {
    const response = await this.request.post(
      `${PUBLIC_API_BASE_URL}/appointments/${appointmentId}/cancel`,
    );
    return toResult(response, appointmentResponseSchema);
  }
}
