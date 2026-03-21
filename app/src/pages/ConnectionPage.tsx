import { WifiOff, QrCode, Check, Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export function ConnectionPage() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const qrCode = useAppStore((s) => s.qrCode);

  const handleConnect = async () => {
    try { await api.post("/api/connect", {}); } catch (_) {}
  };

  const handleDisconnect = async () => {
    try { await api.post("/api/disconnect", {}); } catch (_) {}
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background">
      <motion.div
        key={connectionStatus}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border p-8 w-full max-w-md text-center space-y-6"
      >
        {connectionStatus === "disconnected" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <WifiOff size={28} className="text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">WhatsApp Desconectado</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Conecte seu WhatsApp para começar a disparar mensagens.
              </p>
            </div>
            <button
              onClick={handleConnect}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
            >
              <QrCode size={16} className="inline mr-2 -mt-0.5" />
              Gerar QR Code
            </button>
          </>
        )}

        {connectionStatus === "qr" && (
          <>
            <div className="w-48 h-48 mx-auto bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {qrCode ? (
                <img src={qrCode} className="w-full h-full object-contain" alt="QR Code" />
              ) : (
                <QrCode size={100} className="text-foreground/20" />
              )}
            </div>
            <div className="space-y-2 text-left">
              {["Abra o WhatsApp no celular", "Toque em Mais opções > Aparelhos conectados", "Escaneie o QR Code acima"].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {connectionStatus === "connecting" && (
          <>
            <Loader2 size={40} className={cn("text-primary mx-auto", "animate-spin-slow")} />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Conectando...</h2>
              <p className="text-sm text-muted-foreground mt-1">Aguarde enquanto estabelecemos a conexão.</p>
            </div>
          </>
        )}

        {connectionStatus === "connected" && (
          <>
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
              <Check size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">WhatsApp Conectado!</h2>
              <p className="text-sm text-muted-foreground mt-1">Tudo pronto para disparar mensagens.</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="border border-destructive/30 text-destructive px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/5 transition-colors"
            >
              Desconectar
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
