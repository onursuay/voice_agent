'use client';

import { MetaConnectWizard } from '@/components/integrations/MetaConnectWizard';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * /dashboard/meta-select
 * Redirects from Meta OAuth callback — renders wizard at Step 3 (processing).
 */
export default function MetaSelectPage() {
  // Pass step=3 via URL so the wizard starts at processing step
  return <MetaConnectWizard initialStep={3} />;
}
