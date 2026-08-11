export interface PaginationMeta {
  total: number;
  skip: number;
  take: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;

  /**
   * Campos legados mantidos temporariamente para compatibilidade.
   * O contrato padrao novo deve consumir `meta`.
   */
  total: number;
  skip: number;
  take: number;
  page: number;
  limit: number;
  hasMore: boolean;

  constructor(data: T[], total: number, skip: number, take: number) {
    const safeSkip = Number.isFinite(skip) ? skip : 0;
    const safeTake = Number.isFinite(take) ? take : data.length;
    const page = safeTake > 0 ? Math.floor(safeSkip / safeTake) + 1 : 1;
    const hasMore = safeTake > 0 && safeSkip + safeTake < total;

    this.data = data;
    this.meta = {
      total,
      skip: safeSkip,
      take: safeTake,
      page,
      limit: safeTake,
      hasMore,
    };

    this.total = total;
    this.skip = safeSkip;
    this.take = safeTake;
    this.page = page;
    this.limit = safeTake;
    this.hasMore = hasMore;
  }

  static fromArray<T>(data: T[]) {
    return new PaginatedResponse(data, data.length, 0, data.length);
  }
}
