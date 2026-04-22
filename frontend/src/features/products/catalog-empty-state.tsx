type CatalogEmptyStateProps = {
  categoryLabel?: string;
};

export function CatalogEmptyState({ categoryLabel }: CatalogEmptyStateProps) {
  return (
    <div className="rounded-4xl border border-dashed border-border bg-white/70 px-6 py-14 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">
        No Products Found
      </p>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">
        The catalog is empty for this selection.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
        {categoryLabel
          ? `There are no published products in ${categoryLabel} right now. Try another category or reset the filters.`
          : 'There are no published products yet. Seed the database or publish items from the admin side later.'}
      </p>
    </div>
  );
}
