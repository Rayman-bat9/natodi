import { z } from 'zod';
import { paginationSchema } from './natodi.schemas';

/**
 * Runtime contracts for the documented Partner API (`/api/public/v1`), mirroring its
 * published OpenAPI schema. Only the parts the suite relies on are modelled.
 */

export const appointmentStatusSchema = z.enum([
  'created',
  'confirmed',
  'client_arrived',
  'in_progress',
  'completed',
  'canceled',
  'non_appearance',
]);

export const paymentStatusSchema = z.enum(['unpaid', 'cash', 'card', 'terminal']);

/** Documented reasons an availability answer can come back empty. */
export const noAvailabilityReasonSchema = z.enum([
  'no_bookable_master',
  'master_unavailable',
  'no_schedule',
  'day_not_scheduled',
  'no_free_slot',
  'day_fully_booked',
]);

export const noAvailabilitySchema = z
  .object({
    reason: noAvailabilityReasonSchema,
    message: z.string(),
  })
  .nullable();

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  branch_id: z.string().uuid(),
  client_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  status: appointmentStatusSchema,
  payment_status: paymentStatusSchema,
  start_at: z.string(),
  price: z.number(),
  duration: z.number(),
  end_at: z.string().nullable(),
});

export const appointmentResponseSchema = z.object({ data: appointmentSchema });

export const branchSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  is_active: z.boolean(),
});

export const branchListSchema = z.object({
  data: z.array(branchSchema),
  pagination: paginationSchema,
});

export const bookTimesSchema = z.object({
  // Documented as ISO times, e.g. "10:00:00".
  data: z.array(z.string()),
  no_availability: noAvailabilitySchema,
});

export const identitySchema = z.object({
  data: z.object({
    company_id: z.string().uuid(),
    company_title: z.string(),
    key_prefix: z.string(),
  }),
});

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type NoAvailabilityReason = z.infer<typeof noAvailabilityReasonSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;
export type Branch = z.infer<typeof branchSchema>;
export type BranchList = z.infer<typeof branchListSchema>;
export type BookTimes = z.infer<typeof bookTimesSchema>;
export type Identity = z.infer<typeof identitySchema>;
