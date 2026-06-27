export function getPricingReturnHref(isAuthenticated: boolean) {
  return isAuthenticated ? "/dashboard" : "/";
}
