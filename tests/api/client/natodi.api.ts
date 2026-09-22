import type { APIRequestContext } from '@playwright/test';
import { API_BASE_URL, BRANCH_SLUG } from '../../config/test-env';
import { requireFirst } from '../../utils/assertions';
import {
  branchMetadataSchema,
  categoryListSchema,
  serviceListSchema,
  type BranchMetadata,
  type BranchMetadataResponse,
  type CategoryList,
  type ServiceList,
} from '../schemas/natodi.schemas';
import { expectSuccess, toResult, type ApiResult } from './api-result';

/** Client for the endpoints the public booking widget calls; no authentication needed. */
export class NatodiApi {
  private cachedBranch?: BranchMetadata;

  constructor(private readonly request: APIRequestContext) {}

  async getBranchMetadata(slug: string = BRANCH_SLUG): Promise<ApiResult<BranchMetadataResponse>> {
    const response = await this.request.get(`${API_BASE_URL}/branches/${slug}/slug`);
    return toResult(response, branchMetadataSchema);
  }

  async getActiveCategories(): Promise<ApiResult<CategoryList>> {
    const branch = await this.requireBranch();
    const response = await this.request.get(`${API_BASE_URL}/categories/`, {
      params: {
        company_id: branch.company_id,
        branch_id: branch.id,
        employee_ids: requireFirst(branch.employees, 'branch employee').id,
        active: 'true',
        available_from_widget: 'true',
      },
    });
    return toResult(response, categoryListSchema);
  }

  async getActiveServices(categoryId: string): Promise<ApiResult<ServiceList>> {
    const branch = await this.requireBranch();
    const response = await this.request.get(`${API_BASE_URL}/services/`, {
      params: {
        company_id: branch.company_id,
        employee_ids: requireFirst(branch.employees, 'branch employee').id,
        active: 'true',
        available_from_widget: 'true',
        branch_id: branch.id,
        category_id: categoryId,
        limit: '15',
        offset: '0',
      },
    });
    return toResult(response, serviceListSchema);
  }

  /** Branch metadata every other endpoint needs; resolved once per client instance. */
  private async requireBranch(): Promise<BranchMetadata> {
    this.cachedBranch ??= expectSuccess(await this.getBranchMetadata()).data;
    return this.cachedBranch;
  }
}
