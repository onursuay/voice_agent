'use client';

import { MetaConnectWizard } from '@/components/integrations/MetaConnectWizard';

/**
 * /dashboard/meta-connect
 * Wizard entry point — starts at Step 1 (Welcome).
 */
export default function MetaConnectPage() {
  return <MetaConnectWizard initialStep={1} />;
}
