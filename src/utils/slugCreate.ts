
/**
 * @param data string
 * @returns string
 */
export function slugCreate(data: string): string {
  return data.trim().toLowerCase().replace(/\s+/g, "-");
}

