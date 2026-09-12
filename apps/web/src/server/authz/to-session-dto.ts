import type { SessionDto } from "@saas-frota/shared";
import type { SessionContext } from "./session";

export function toSessionDto(session: SessionContext): SessionDto {
  return {
    user_id: session.userId,
    tenant_id: session.tenantId,
    tenant_slug: session.tenantSlug,
    surface: session.surface,
    saas_role: session.saasRole,
    account_owner: session.accountOwner,
    is_customer: session.isCustomer,
    subscription_status: session.subscriptionStatus,
    document_type: session.documentType,
  };
}
