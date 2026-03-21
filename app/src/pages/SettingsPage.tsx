import { useAppStore } from "@/stores/appStore";
import { Settings, Terminal, AlertTriangle } from "lucide-react";

function Warning({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 mt-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <AlertTriangle size={13} className="shrink-0" />
      <p className="text-[11px] font-medium">{message}</p>
    </div>
  );
}

export function SettingsPage() {
  const { sendSettings, setSendSettings } = useAppStore();

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Send Settings */}
        <div className="bg-card rounded-2xl border p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings size={18} className="text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Configurações de Envio</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Intervalo entre mensagens (segundos)</label>
              <input
                type="number"
                value={sendSettings.interval}
                onChange={(e) => setSendSettings({ interval: Number(e.target.value) })}
                className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {sendSettings.interval < 10 && (
                <Warning message="Intervalo muito baixo! Valores abaixo de 10s aumentam o risco de bloqueio pelo WhatsApp." />
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Pausar a cada N mensagens</label>
              <input
                type="number"
                value={sendSettings.pauseEvery}
                onChange={(e) => setSendSettings({ pauseEvery: Number(e.target.value) })}
                className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {sendSettings.pauseEvery > 15 && (
                <Warning message="Pausar a cada mais de 15 mensagens pode aumentar o risco de bloqueio. Recomendamos no máximo 15." />
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Duração da pausa (segundos)</label>
              <input
                type="number"
                value={sendSettings.pauseDuration}
                onChange={(e) => setSendSettings({ pauseDuration: Number(e.target.value) })}
                className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {sendSettings.pauseDuration > 30 && (
                <Warning message="Pausa muito longa! Acima de 30s a sessão pode ficar instável durante o disparo." />
              )}
            </div>
          </div>

          <div className="bg-accent rounded-lg p-4">
            <p className="text-xs text-accent-foreground font-medium mb-1">Resumo atual</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Enviar uma mensagem a cada <strong>{sendSettings.interval}s</strong>,
              pausar por <strong>{sendSettings.pauseDuration}s</strong> a cada{" "}
              <strong>{sendSettings.pauseEvery}</strong> mensagens.
            </p>
          </div>
        </div>

        {/* Backend instructions */}
        <div className="bg-card rounded-2xl border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Terminal size={18} className="text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Iniciar o Backend</h2>
          </div>

          <div className="space-y-3">
            {[
              "Clone o repositório do backend",
              "Execute npm install para instalar dependências",
              "Configure as variáveis de ambiente (.env)",
              "Execute npm start para iniciar o servidor",
              "Volte aqui e conecte seu WhatsApp",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
