import { useState, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, Check, X, Users, Upload } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Recipient } from "@/types/whatsapp";

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

const COLOR_PALETTE = [
  "hsl(162, 100%, 33%)",
  "hsl(200, 80%, 45%)",
  "hsl(270, 60%, 55%)",
  "hsl(25, 90%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(190, 70%, 45%)",
];

function getColor(name: string): string {
  return COLOR_PALETTE[name.charCodeAt(0) % COLOR_PALETTE.length];
}

function parseCSV(text: string): Recipient[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const nameIdx = headers.findIndex((h) => ["name", "nome", "contato"].includes(h));
  const phoneIdx = headers.findIndex((h) => ["phone", "telefone", "numero", "number", "fone", "celular", "whatsapp"].includes(h));

  if (phoneIdx === -1) return [];

  const recipients: Recipient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;]/).map((c) => c.trim().replace(/['"]/g, ""));
    const rawPhone = cols[phoneIdx] ?? "";
    const phone = rawPhone.replace(/\D/g, "");
    if (!phone) continue;
    const name = nameIdx !== -1 ? (cols[nameIdx] ?? phone) : phone;
    const id = `${phone}@c.us`;
    recipients.push({
      type: "contact",
      id,
      name,
      phone,
      initials: getInitials(name),
      color: getColor(name),
    });
  }
  return recipients;
}

export function RecipientsPanel() {
  const {
    contacts,
    groups,
    selectedRecipients,
    connectionStatus,
    setContacts,
    setGroups,
    toggleRecipient,
    selectAllContacts,
    selectAllGroups,
    clearSelection,
  } = useAppStore();
  const [tab, setTab] = useState<"contacts" | "groups">("contacts");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const imported = parseCSV(text);
      if (!imported.length) {
        toast.error("Nenhum contato encontrado. Verifique as colunas do CSV (nome, telefone).");
        return;
      }
      imported.forEach((r) => toggleRecipient(r));
      toast.success(`${imported.length} contatos importados do CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const loadData = useCallback(async () => {
    if (connectionStatus !== "connected") return;
    setLoading(true);
    try {
      const [contactsData, groupsData] = await Promise.all([
        api.get("/api/contacts"),
        api.get("/api/groups"),
      ]);
      setContacts(
        (contactsData as Array<{ id: string; name: string; number: string; isMyContact: boolean }>).map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.number,
          initials: getInitials(c.name),
          color: getColor(c.name),
        }))
      );
      setGroups(
        (groupsData as Array<{ id: string; name: string; participants: number }>).map((g) => ({
          id: g.id,
          name: g.name,
          participantCount: g.participants,
          initials: getInitials(g.name),
          color: getColor(g.name),
        }))
      );
    } catch (_) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [connectionStatus, setContacts, setGroups]);

  useEffect(() => {
    loadData();
  }, [connectionStatus, loadData]);

  const isSelected = (id: string) => selectedRecipients.some((r) => r.id === id);
  const selectedCount = selectedRecipients.length;

  const filteredContacts = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-[300px] bg-card border-r flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Destinatários</h2>
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {selectedCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
            <button
              onClick={() => csvInputRef.current?.click()}
              title="Importar CSV"
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-0.5">
          {(["contacts", "groups"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "contacts" ? "Contatos" : "Grupos"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-muted rounded-full pl-8 pr-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      {/* Select All */}
      <div className="px-3 pb-1">
        <button
          onClick={tab === "contacts" ? selectAllContacts : selectAllGroups}
          className="text-[11px] text-primary font-medium hover:underline"
        >
          Selecionar todos
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1">
        {connectionStatus !== "connected" ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-xs text-center px-4">Conecte o WhatsApp para ver seus contatos e grupos.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <RefreshCw size={16} className="animate-spin" />
          </div>
        ) : tab === "contacts" ? (
          filteredContacts.map((c) => (
            <RecipientItem
              key={c.id}
              name={c.name}
              subtitle={c.phone}
              initials={c.initials}
              color={c.color}
              selected={isSelected(c.id)}
              onToggle={() => toggleRecipient({ ...c, type: "contact" })}
            />
          ))
        ) : (
          filteredGroups.map((g) => (
            <RecipientItem
              key={g.id}
              name={g.name}
              subtitle={`${g.participantCount} participantes`}
              initials={g.initials}
              color={g.color}
              selected={isSelected(g.id)}
              onToggle={() => toggleRecipient({ ...g, type: "group" })}
              isGroup
            />
          ))
        )}
      </div>

      {/* Footer */}
      {selectedCount > 0 && (
        <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-medium">{selectedCount} selecionado(s)</span>
          <button onClick={clearSelection} className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100">
            <X size={12} />
            Limpar
          </button>
        </div>
      )}
    </div>
  );
}

function RecipientItem({
  name,
  subtitle,
  initials,
  color,
  selected,
  onToggle,
  isGroup,
}: {
  name: string;
  subtitle: string;
  initials: string;
  color: string;
  selected: boolean;
  onToggle: () => void;
  isGroup?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left",
        selected ? "bg-accent" : "hover:bg-muted/60"
      )}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
        style={{ backgroundColor: color, color: "#fff" }}
      >
        {isGroup ? <Users size={14} /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
      </div>
      {selected && (
        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check size={12} className="text-primary-foreground" />
        </span>
      )}
    </button>
  );
}
