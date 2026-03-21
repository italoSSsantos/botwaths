import { useState, useRef } from "react";
import {
  Send,
  X,
  Image,
  Video,
  Mic,
  FileText,
  Paperclip,
  ChevronDown,
  Pause,
  Square,
  Wifi,
  WifiOff,
  Loader2,
  Play,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function ComposerPanel() {
  const {
    selectedRecipients,
    connectionStatus,
    message,
    setMessage,
    attachment,
    setAttachment,
    sendSettings,
    setSendSettings,
    sendProgress,
    setSendProgress,
    activeCampaignId,
    setActiveCampaignId,
  } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const count = selectedRecipients.length;
  const connected = connectionStatus === "connected";

  const handleSend = async () => {
    const id = generateId();
    setActiveCampaignId(id);
    const recipients = selectedRecipients.map((r) => ({ id: r.id, name: r.name }));
    setSendProgress({
      active: true,
      paused: false,
      current: recipients[0]?.name || "",
      sent: 0,
      failed: 0,
      total: recipients.length,
    });
    try {
      await api.post("/api/campaign", {
        id,
        recipients,
        text: message.trim() || undefined,
        mediaBase64: attachment?.base64,
        mediaMime: attachment?.mime,
        mediaName: attachment?.name,
        intervalSeconds: sendSettings.interval,
        pauseEvery: sendSettings.pauseEvery,
        pauseDurationSeconds: sendSettings.pauseDuration,
      });
    } catch (_) {}
  };

  const handlePause = async () => {
    if (!activeCampaignId) return;
    try { await api.post(`/api/campaign/${activeCampaignId}/pause`, {}); } catch (_) {}
    setSendProgress({ paused: true, active: true });
  };

  const handleResume = async () => {
    if (!activeCampaignId) return;
    try { await api.post(`/api/campaign/${activeCampaignId}/resume`, {}); } catch (_) {}
    setSendProgress({ paused: false, active: true });
  };

  const handleCancel = async () => {
    if (!activeCampaignId) return;
    try { await api.post(`/api/campaign/${activeCampaignId}/cancel`, {}); } catch (_) {}
    setSendProgress({ active: false, paused: false, current: "", sent: 0, failed: 0, total: 0 });
    setActiveCampaignId(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAttachment({
        name: file.name,
        mime: file.type,
        base64: result.split(",")[1],
        preview: file.type.startsWith("image/") ? result : undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex-1 bg-card flex flex-col min-w-0">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Disparar mensagem</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {count > 0 ? `${count} destinatário(s) selecionado(s)` : "Nenhum destinatário selecionado"}
            </p>
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full",
              connected
                ? "bg-accent text-accent-foreground"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Recipients chips */}
        {count > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Para:</p>
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {selectedRecipients.slice(0, 12).map((r) => (
                  <motion.span
                    key={r.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 bg-muted text-foreground text-[11px] font-medium pl-2.5 pr-1 py-1 rounded-full"
                  >
                    {r.name}
                    <button
                      onClick={() => useAppStore.getState().toggleRecipient(r)}
                      className="p-0.5 rounded-full hover:bg-foreground/10"
                    >
                      <X size={10} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {count > 12 && (
                <span className="text-[11px] text-muted-foreground py-1">+{count - 12} mais</span>
              )}
            </div>
          </div>
        )}

        {/* Attachment preview */}
        {attachment && (
          <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
            {attachment.mime.startsWith("image") ? (
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
                {attachment.preview ? (
                  <img src={attachment.preview} className="w-full h-full object-cover" alt={attachment.name} />
                ) : (
                  <Image size={20} className="text-primary" />
                )}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted-foreground/10 flex items-center justify-center">
                <FileText size={20} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-xs text-foreground flex-1 truncate">{attachment.name}</span>
            <button onClick={() => setAttachment(null)} className="p-1 hover:bg-foreground/10 rounded">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Message */}
        <div>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={6}
              className="w-full bg-muted rounded-lg p-4 pb-12 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 border-t border-border/50">
              <div className="flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 rounded hover:bg-foreground/5 transition-colors"
                >
                  <Image size={12} />
                  Foto
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 rounded hover:bg-foreground/5 transition-colors"
                >
                  <Video size={12} />
                  Vídeo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 rounded hover:bg-foreground/5 transition-colors"
                >
                  <Mic size={12} />
                  Áudio
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 rounded hover:bg-foreground/5 transition-colors"
                >
                  <FileText size={12} />
                  Doc
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 rounded hover:bg-foreground/5 transition-colors"
                >
                  <Paperclip size={12} />
                  Outro
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground">{message.length}</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
          />
        </div>

        {/* Send Settings Accordion */}
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Configurações de envio
            <ChevronDown
              size={14}
              className={cn("transition-transform text-muted-foreground", settingsOpen && "rotate-180")}
            />
          </button>
          <AnimatePresence>
            {settingsOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Intervalo (s)", key: "interval" as const, value: sendSettings.interval },
                    { label: "Pausar a cada", key: "pauseEvery" as const, value: sendSettings.pauseEvery },
                    { label: "Pausa (s)", key: "pauseDuration" as const, value: sendSettings.pauseDuration },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-[10px] text-muted-foreground block mb-1">{f.label}</label>
                      <input
                        type="number"
                        value={f.value}
                        onChange={(e) => setSendSettings({ [f.key]: Number(e.target.value) })}
                        className="w-full bg-muted rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        {sendProgress.active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2
                  size={14}
                  className={cn("text-primary", !sendProgress.paused && "animate-spin-slow")}
                />
                <span className="text-xs text-foreground font-medium">{sendProgress.current}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-primary font-medium">{sendProgress.sent} enviados</span>
                <span className="text-destructive font-medium">{sendProgress.failed} falhou</span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{
                  width: `${
                    sendProgress.total > 0
                      ? ((sendProgress.sent + sendProgress.failed) / sendProgress.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={sendProgress.paused ? handleResume : handlePause}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-md border hover:bg-muted transition-colors"
              >
                {sendProgress.paused ? <Play size={12} /> : <Pause size={12} />}
                {sendProgress.paused ? "Retomar" : "Pausar"}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Square size={12} />
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Send button */}
      <div className="px-6 py-4 border-t">
        <button
          disabled={count === 0 || !connected || (!message.trim() && !attachment) || sendProgress.active}
          onClick={handleSend}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all",
            count > 0 && connected && (message.trim() || attachment) && !sendProgress.active
              ? "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.99]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send size={16} />
          {count > 0 ? `Disparar para ${count} contato(s)` : "Selecione destinatários"}
        </button>
      </div>
    </div>
  );
}
