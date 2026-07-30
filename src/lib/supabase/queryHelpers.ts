import { PostgrestError } from '@supabase/supabase-js';

/** PostgREST error code returned when `.single()` matches no rows. */
export const NO_ROWS_ERROR_CODE = 'PGRST116';

export interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

export function isNoRowsError(error: PostgrestError | null): boolean {
  return error?.code === NO_ROWS_ERROR_CODE;
}

/**
 * Return the row from a query, throwing on any error.
 */
export async function requireRow<T>(query: PromiseLike<QueryResult<T>>): Promise<T> {
  const { data, error } = await query;
  if (error) throw error;
  return data as T;
}

/**
 * Return the row from a `.single()` query, or null when no row matched.
 */
export async function maybeRow<T>(query: PromiseLike<QueryResult<T>>): Promise<T | null> {
  const { data, error } = await query;
  if (error) {
    if (isNoRowsError(error)) return null;
    throw error;
  }
  return data;
}

/**
 * Return whether a `.single()` query matched a row.
 */
export async function rowExists<T>(query: PromiseLike<QueryResult<T>>): Promise<boolean> {
  return (await maybeRow(query)) !== null;
}

/**
 * Return the rows from a query, defaulting to an empty list.
 */
export async function requireRows<T>(query: PromiseLike<QueryResult<T[]>>): Promise<T[]> {
  return (await requireRow(query)) || [];
}

/**
 * Run a query for its side effect, throwing on any error.
 */
export async function runQuery<T>(query: PromiseLike<QueryResult<T>>): Promise<void> {
  const { error } = await query;
  if (error) throw error;
}
