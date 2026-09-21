export interface ApiResponse<T> {
  data: T;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export interface BranchService {
  id: string;
  title: string;
  duration: number;
  price: number;
}

export interface BranchMetadata {
  id: string;
  slug: string;
  title: string;
  company_id: string;
  employees: Employee[];
  services: BranchService[];
}

export interface Category {
  id: string;
  title: string;
}

export interface Service {
  id: string;
  title: string;
  active: boolean;
  category_id: string;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
