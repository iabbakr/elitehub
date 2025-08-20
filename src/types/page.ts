// src/types/page.ts
export type PageProps<T extends Record<string, string> = {}> = {
  params: Promise<T>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};
