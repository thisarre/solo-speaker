import { PricingPage } from "@/modules/pricing/components/pricing-page";
import { getUser } from "@/modules/auth/queries";
import { getPricingReturnHref } from "@/modules/pricing/navigation";

export default async function PricingRoute() {
  const user = await getUser();
  return <PricingPage returnHref={getPricingReturnHref(Boolean(user))} />;
}
