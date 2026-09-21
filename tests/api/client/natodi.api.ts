import type { APIRequestContext } from '@playwright/test';
import {
  branchMetadataSchema,
  categorySchema,
  paginatedResponseSchema,
  serviceSchema,
} from '../schemas/natodi.schemas';
import type {
  ApiResponse,
  BranchMetadata,
  Category,
  PaginatedResponse,
  Service,
} from '../models/natodi.models';

const apiBaseUrl = 'https://api.natodi.com/api/v1';

export class NatodiApi {
  private branchMetadata?: ApiResponse<BranchMetadata>;

  constructor(private readonly request: APIRequestContext) {}

  async getBranchMetadata(): Promise<ApiResponse<BranchMetadata>> {
    if (this.branchMetadata) return this.branchMetadata;

    const response = await this.request.get(`${apiBaseUrl}/branches/ooo-oooo/slug`);
    this.branchMetadata = branchMetadataSchema.parse(await this.readResponse(response));
    return this.branchMetadata;
  }

  async getActiveCategories(): Promise<PaginatedResponse<Category>> {
    const branch = await this.getBranchMetadata();
    const response = await this.request.get(`${apiBaseUrl}/categories/`, {
      params: {
        company_id: branch.data.company_id,
        branch_id: branch.data.id,
        employee_ids: branch.data.employees[0].id,
        active: 'true',
        available_from_widget: 'true',
      },
    });
    return paginatedResponseSchema(categorySchema).parse(await this.readResponse(response));
  }

  async getActiveServices(): Promise<PaginatedResponse<Service>> {
    const branch = await this.getBranchMetadata();
    const categories = await this.getActiveCategories();
    const makeupCategory = categories.data.find(({ title }) => title === 'Макіяж та догляд');
    if (!makeupCategory) throw new Error('Makeup category was not returned by Natodi API');

    const response = await this.request.get(`${apiBaseUrl}/services/`, {
      params: {
        company_id: branch.data.company_id,
        employee_ids: branch.data.employees[0].id,
        active: 'true',
        available_from_widget: 'true',
        branch_id: branch.data.id,
        category_id: makeupCategory.id,
        limit: '15',
        offset: '0',
      },
    });
    return paginatedResponseSchema(serviceSchema).parse(await this.readResponse(response));
  }

  private async readResponse(response: {
    ok(): boolean;
    status(): number;
    text(): Promise<string>;
  }): Promise<unknown> {
    if (!response.ok()) {
      throw new Error(`Natodi API request failed with status ${response.status()}`);
    }
    return JSON.parse(await response.text());
  }
}
