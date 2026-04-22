type CatalogErrorStateProps = {
  message: string;
};

export function CatalogErrorState({ message }: CatalogErrorStateProps) {
  return (
    <div className="rounded-4xl border border-red-200 bg-red-50/80 px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-500">
        Catalog Error
      </p>
      <p className="mt-4 text-sm leading-7 text-red-700">{message}</p>
    </div>
  );
}
