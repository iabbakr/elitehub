// src/types/page.ts
export type AppPageProps<T extends Record<string, string> = {}> = {
  params: T;
  searchParams?: { [key: string]: string | string[] | undefined };
};
