'use client';

import { MetaConnectWizard } from '@/components/integrations/MetaConnectWizard';

/**
 * /dashboard/meta-select
 * Called after Meta OAuth callback — starts wizard at Step 3 (auto-processing pages).
 */
export default function MetaSelectPage() {
  return <MetaConnectWizard initialStep={3} />;
}
