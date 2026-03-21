import { useState, useEffect } from "react";
import { WifiOff, QrCode, Check, Loader2, Wifi } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export function ConnectionPage() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const qrCode = useAppStore((s) => s.qrCode);
  const [loading, setLoading] = useState(false);

  // Limpa o loading quando o status mudar
  useEffect(() => {
    if (connectionStatus !== "disconnected") {
      setLoading(false);
    }
  }, [connectionStatus]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await api.post("/api/connect", {});
    } catch (_) {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post("/api/disconnect", {});
    } catch (_) {}
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={connectionStatus + String(loading)}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-2xl border p-8 w-full max-w-md text-center space-y-6"
        >
          {/* Desconectado */}
          {connectionStatus === "disconnected" && !loading && (
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

          {/* Aguardando QR (loading após clicar) */}
          {connectionStatus === "disconnected" && loading && (
            <>
              <div className="relative w-16 h-16 mx-auto">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 size={28} className="text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Iniciando...</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Preparando o QR Code, aguarde alguns segundos.
                </p>
              </div>
            </>
          )}

          {/* QR Code pronto para escanear */}
          {connectionStatus === "qr" && (
            <>
              <div className="relative mx-auto w-48 h-48">
                <motion.div
                  className="absolute -inset-1 rounded-xl bg-primary/30"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative w-full h-full bg-white rounded-xl border-2 border-primary/40 flex items-center justify-center overflow-hidden">
                  {qrCode ? (
                    <img src={qrCode} className="w-full h-full object-contain p-2" alt="QR Code" />
                  ) : (
                    <Loader2 size={32} className="text-primary animate-spin" />
                  )}
                </div>
              </div>
              <div className="space-y-2 text-left">
                {[
                  "Abra o WhatsApp no celular",
                  "Toque em Mais opções > Aparelhos conectados",
                  "Escaneie o QR Code acima",
                ].map((step, i) => (
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

          {/* Conectando (após escanear) */}
          {connectionStatus === "connecting" && (
            <>
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-4 border-primary/40"
                  animate={{ scale: [1, 1.15, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                />
                <Loader2 size={32} className={cn("text-primary animate-spin-slow")} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Conectando...</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  QR Code escaneado! Estabelecendo conexão com o WhatsApp.
                </p>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Conectado */}
          {connectionStatus === "connected" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto"
              >
                <Check size={28} className="text-primary" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">WhatsApp Conectado!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tudo pronto para disparar mensagens.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium">
                <Wifi size={14} />
                Sessão ativa
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
      </AnimatePresence>
    </div>
  );
}
