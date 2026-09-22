import { z } from 'zod';

/**
 * Runtime contracts for the endpoints the booking widget itself calls. Types are
 * inferred from the schemas below, so the validation and the types cannot drift.
 */

export const employeeSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
});

export const branchServiceSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  duration: z.number(),
  price: z.number(),
});

export const branchMetadataSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    company_id: z.string().uuid(),
    // The widget cannot compose a single catalogue request without an employee id,
    // so an empty list is a contract violation rather than an empty result.
    employees: z.array(employeeSchema).min(1),
    services: z.array(branchServiceSchema),
  }),
});

export const categorySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});

export const serviceSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  active: z.boolean(),
  category_id: z.string().uuid(),
});

export const paginationSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: paginationSchema,
  });

/** What the widget's own booking request returns once a slot is taken. */
export const widgetAppointmentSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    status: z.string(),
    payment_status: z.string(),
    start_at: z.string(),
    end_at: z.string().nullable(),
  }),
});

export const categoryListSchema = paginatedResponseSchema(categorySchema);
export const serviceListSchema = paginatedResponseSchema(serviceSchema);

export type Employee = z.infer<typeof employeeSchema>;
export type BranchService = z.infer<typeof branchServiceSchema>;
export type BranchMetadataResponse = z.infer<typeof branchMetadataSchema>;
export type BranchMetadata = BranchMetadataResponse['data'];
export type Category = z.infer<typeof categorySchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type WidgetAppointment = z.infer<typeof widgetAppointmentSchema>;
export type CategoryList = z.infer<typeof categoryListSchema>;
export type ServiceList = z.infer<typeof serviceListSchema>;
