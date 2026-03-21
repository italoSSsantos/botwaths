import { AppSidebar } from "@/components/AppSidebar";
import { RecipientsPanel } from "@/components/RecipientsPanel";
import { ComposerPanel } from "@/components/ComposerPanel";
import { ConnectionPage } from "@/pages/ConnectionPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useAppStore } from "@/stores/appStore";

export default function Index() {
  const activePage = useAppStore((s) => s.activePage);

  return (
    <div className="h-screen flex overflow-hidden">
      <AppSidebar />
      {activePage === "send" && (
        <>
          <RecipientsPanel />
          <ComposerPanel />
        </>
      )}
      {activePage === "connection" && <ConnectionPage />}
      {activePage === "settings" && <SettingsPage />}
    </div>
  );
}
