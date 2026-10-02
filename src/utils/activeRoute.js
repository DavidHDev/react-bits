export const getActiveRoute = pathname => {
  const parts = pathname.split('/');
  const offset = parts[1] === 'c' ? 2 : 1;
  const category = parts[offset] || null;
  const subcategory = parts[offset + 1] || null;

  if (!category || !subcategory) return { category: null, subcategory: null, isCategoryRoute: false };

  return { category, subcategory, isCategoryRoute: true };
};
