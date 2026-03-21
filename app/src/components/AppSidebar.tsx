import { Send, Smartphone, Settings } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "send" as const, label: "Disparar", icon: Send },
  { id: "connection" as const, label: "Conexão", icon: Smartphone },
  { id: "settings" as const, label: "Config", icon: Settings },
];

export function AppSidebar() {
  const { activePage, setActivePage, connectionStatus } = useAppStore();

  return (
    <aside className="w-[70px] bg-card border-r flex flex-col items-center py-4 shrink-0">
      <div className="mb-4">
        <img src="/universal.ico" alt="Logo" className="w-9 h-9 rounded-lg object-contain" />
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const active = activePage === item.id;
          const showBadge = item.id === "connection" && connectionStatus !== "connected";
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-colors relative group",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-badge-danger rounded-full border-2 border-card" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-1 pt-3 border-t border-border w-full px-2">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            connectionStatus === "connected" ? "bg-primary animate-pulse-dot" : "bg-muted-foreground/40"
          )}
        />
        <span className="text-[9px] text-muted-foreground font-medium">
          {connectionStatus === "connected" ? "Conectado" : "Desconectado"}
        </span>
      </div>
      <span className="text-[8px] text-muted-foreground/50 mt-3 text-center leading-tight">
        criado por<br />Ítalo
      </span>
    </aside>
  );
}
