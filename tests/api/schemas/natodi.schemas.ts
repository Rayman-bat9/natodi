import { z } from 'zod';

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
    employees: z.array(employeeSchema),
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

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      limit: z.number(),
      offset: z.number(),
      total: z.number(),
    }),
  });
