import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/stores/appStore";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function SSEProvider() {
  const setConnectionStatus = useAppStore((s) => s.setConnectionStatus);
  const setQrCode = useAppStore((s) => s.setQrCode);
  const setSendProgress = useAppStore((s) => s.setSendProgress);
  const setActiveCampaignId = useAppStore((s) => s.setActiveCampaignId);

  useEffect(() => {
    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource(`${BASE}/api/events`);

      es.addEventListener("status", (e: MessageEvent) => {
        const d = JSON.parse(e.data);
        const map: Record<string, "disconnected" | "qr" | "connecting" | "connected"> = {
          disconnected: "disconnected",
          qr: "qr",
          connecting: "connecting",
          ready: "connected",
        };
        setConnectionStatus(map[d.status] ?? "disconnected");
        if (d.status !== "qr") setQrCode(null);
      });

      es.addEventListener("qr", (e: MessageEvent) => {
        const d = JSON.parse(e.data);
        setConnectionStatus("qr");
        setQrCode(d.qr);
      });

      es.addEventListener("campaign_progress", (e: MessageEvent) => {
        const d = JSON.parse(e.data);
        const activeCampaignId = useAppStore.getState().activeCampaignId;
        if (!activeCampaignId || d.campaignId !== activeCampaignId) return;
        setSendProgress({
          active: d.status === "running" || d.status === "paused",
          paused: d.status === "paused",
          current: d.currentName ?? "",
          sent: d.success,
          failed: d.fail,
          total: d.total,
        });
        if (d.status === "completed" || d.status === "cancelled") {
          setActiveCampaignId(null);
        }
      });

      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimer);
    };
  }, [setConnectionStatus, setQrCode, setSendProgress, setActiveCampaignId]);

  return null;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SSEProvider />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
