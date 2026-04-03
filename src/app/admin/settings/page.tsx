import { getPlatformSettings, getPayoutRules } from "@/lib/queries/admin";
import { AdminSettingsClient } from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const [settings, payoutRules] = await Promise.all([
    getPlatformSettings(),
    getPayoutRules()
  ]);
  
  return (
    <AdminSettingsClient 
      settings={settings}
      payoutRules={payoutRules}
    />
  );
}
