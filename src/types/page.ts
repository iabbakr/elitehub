// Defines the common props that Next.js pages receive.
// T is a generic that allows specifying the shape of the `params` object.
export type PageProps<T = {}> = {
  params: T;
  searchParams: {[key: string]: string | string[] | undefined};
};
