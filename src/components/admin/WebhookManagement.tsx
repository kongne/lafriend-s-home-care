import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Eye,
  RotateCcw,
  Activity,
  Zap,
  Globe,
} from "lucide-react";
import {
  type WebhookEndpoint,
  type WebhookEvent,
  type WebhookDeliveryWithDetails,
  type WebhookEventType,
  ALL_WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  fetchWebhookEndpoints,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  fetchWebhookEvents,
  fetchWebhookDeliveries,
  sendTestWebhook,
  retryWebhookDelivery,
  generateWebhookSecret,
  getWebhookStats,
} from "@/lib/webhooks";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  success: "bg-green-500/10 text-green-600 border-green-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
  retrying: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs ${statusColors[status] ?? ""}`}>
      {status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
      {status === "pending" && <RefreshCw className="w-3 h-3 mr-1" />}
      {status}
    </Badge>
  );
}

export function WebhookManagement() {
  const [tab, setTab] = useState("endpoints");
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryWithDetails[]>([]);
  const [eventsCount, setEventsCount] = useState(0);
  const [deliveriesCount, setDeliveriesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailItem, setDetailItem] = useState<WebhookEvent | WebhookDeliveryWithDetails | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEndpoints: 0,
    activeEndpoints: 0,
    totalEvents: 0,
    pendingEvents: 0,
    failedEvents: 0,
    totalDeliveries: 0,
    successRate: 100,
  });

  const [eventPage, setEventPage] = useState(0);
  const [deliveryPage, setDeliveryPage] = useState(0);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");

  const { toast } = useToast();
  const PAGE_SIZE = 15;

  const loadEndpoints = useCallback(async () => {
    try {
      const data = await fetchWebhookEndpoints();
      setEndpoints(data);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger les endpoints.", variant: "destructive" });
    }
  }, [toast]);

  const loadEvents = useCallback(async () => {
    try {
      const { data, count } = await fetchWebhookEvents({
        event_type: eventFilter === "all" ? undefined : eventFilter,
        limit: PAGE_SIZE,
        offset: eventPage * PAGE_SIZE,
      });
      setEvents(data);
      setEventsCount(count);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger les événements.", variant: "destructive" });
    }
  }, [eventFilter, eventPage, toast]);

  const loadDeliveries = useCallback(async () => {
    try {
      const { data, count } = await fetchWebhookDeliveries({
        status: deliveryFilter === "all" ? undefined : deliveryFilter,
        limit: PAGE_SIZE,
        offset: deliveryPage * PAGE_SIZE,
      });
      setDeliveries(data);
      setDeliveriesCount(count);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger les livraisons.", variant: "destructive" });
    }
  }, [deliveryFilter, deliveryPage, toast]);

  const loadStats = useCallback(async () => {
    try {
      const s = await getWebhookStats();
      setStats(s);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadEndpoints(), loadEvents(), loadDeliveries(), loadStats()]);
      setLoading(false);
    };
    load();
  }, [loadEndpoints, loadEvents, loadDeliveries, loadStats]);

  useEffect(() => { loadEvents(); setEventPage(0); }, [eventFilter, loadEvents]);
  useEffect(() => { loadDeliveries(); setDeliveryPage(0); }, [deliveryFilter, loadDeliveries]);

  const handleTest = async (endpointId: string) => {
    setTestingId(endpointId);
    const result = await sendTestWebhook(endpointId, "booking.created");
    setTestingId(null);
    toast({
      title: result.success ? "Test réussi" : "Test échoué",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const handleRetry = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    try {
      await retryWebhookDelivery(deliveryId);
      toast({ title: "Relance créée", description: "La livraison a été relancée." });
      await loadDeliveries();
      await loadEvents();
    } catch {
      toast({ title: "Erreur", description: "Impossible de relancer.", variant: "destructive" });
    }
    setRetryingId(null);
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(secret);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const eventTotalPages = Math.ceil(eventsCount / PAGE_SIZE);
  const deliveryTotalPages = Math.ceil(deliveriesCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Webhooks
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez les webhooks sortants et suivez les livraisons.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Globe className="h-4 w-4" /> Endpoints
          </div>
          <div className="text-2xl font-bold">{stats.activeEndpoints}/{stats.totalEndpoints}</div>
          <p className="text-xs text-muted-foreground">actifs / total</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Activity className="h-4 w-4" /> Événements
          </div>
          <div className="text-2xl font-bold">{stats.totalEvents}</div>
          <p className="text-xs text-muted-foreground">{stats.pendingEvents} en attente, {stats.failedEvents} échoués</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Send className="h-4 w-4" /> Livraisons
          </div>
          <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
          <p className="text-xs text-muted-foreground">total</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckCircle2 className="h-4 w-4" /> Taux de réussite
          </div>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
          <p className="text-xs text-muted-foreground">des livraisons</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints ({endpoints.length})</TabsTrigger>
          <TabsTrigger value="events">Événements ({eventsCount})</TabsTrigger>
          <TabsTrigger value="deliveries">Livraisons ({deliveriesCount})</TabsTrigger>
        </TabsList>

        {/* ─── ENDPOINTS TAB ─── */}
        <TabsContent value="endpoints" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter un endpoint
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : endpoints.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun endpoint configuré.</p>
              <p className="text-sm mt-1">Ajoutez un endpoint pour commencer à recevoir des webhooks.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Événements</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell>
                        <div className="font-mono text-sm max-w-[300px] truncate">{ep.url}</div>
                        {ep.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{ep.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {ep.events.map((ev) => (
                            <Badge key={ev} variant="secondary" className="text-[10px]">
                              {WEBHOOK_EVENT_LABELS[ev as WebhookEventType] ?? ev}
                            </Badge>
                          ))}
                          {ep.events.includes("*") && (
                            <Badge variant="secondary" className="text-[10px]">Tous</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={ep.is_active}
                          onCheckedChange={async (checked) => {
                            await updateWebhookEndpoint(ep.id, { is_active: checked });
                            await loadEndpoints();
                            await loadStats();
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ep.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Tester"
                            onClick={() => handleTest(ep.id)}
                            disabled={testingId === ep.id || !ep.is_active}
                          >
                            {testingId === ep.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Copier le secret"
                            onClick={() => handleCopySecret(ep.secret)}
                          >
                            {copiedSecret === ep.secret ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            title="Supprimer"
                            onClick={async () => {
                              if (!confirm("Supprimer cet endpoint ?")) return;
                              await deleteWebhookEndpoint(ep.id);
                              await loadEndpoints();
                              await loadStats();
                              toast({ title: "Endpoint supprimé" });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── EVENTS TAB ─── */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {ALL_WEBHOOK_EVENTS.map((ev) => (
                  <SelectItem key={ev} value={ev}>{WEBHOOK_EVENT_LABELS[ev]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun événement enregistré.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Créé</TableHead>
                      <TableHead>Traité</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {WEBHOOK_EVENT_LABELS[ev.event_type as WebhookEventType] ?? ev.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ev.source}</TableCell>
                        <TableCell><StatusBadge status={ev.status} /></TableCell>
                        <TableCell className="text-sm">{ev.retry_count}/{ev.max_retries}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ev.created_at).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ev.processed_at ? new Date(ev.processed_at).toLocaleString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Voir détails"
                            onClick={() => { setDetailItem(ev); setShowDetailDialog(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {eventTotalPages > 1 && (
                <Pagination
                  page={eventPage}
                  totalPages={eventTotalPages}
                  onPageChange={setEventPage}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* ─── DELIVERIES TAB ─── */}
        <TabsContent value="deliveries" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="retrying">Relance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {deliveries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune livraison enregistrée.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Événement</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>HTTP</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Tentative</TableHead>
                      <TableHead>Créé</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((del) => (
                      <TableRow key={del.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {WEBHOOK_EVENT_LABELS[
                              (del.webhook_events?.event_type ?? "") as WebhookEventType
                            ] ?? del.webhook_events?.event_type ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {del.webhook_endpoints?.url ?? "—"}
                        </TableCell>
                        <TableCell><StatusBadge status={del.status} /></TableCell>
                        <TableCell className="text-sm">{del.http_status ?? "—"}</TableCell>
                        <TableCell className="text-sm">{del.duration_ms ? `${del.duration_ms}ms` : "—"}</TableCell>
                        <TableCell className="text-sm">#{del.attempt_number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(del.created_at).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Voir détails"
                              onClick={() => { setDetailItem(del); setShowDetailDialog(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(del.status === "failed" || del.status === "retrying") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Relancer"
                                onClick={() => handleRetry(del.id)}
                                disabled={retryingId === del.id}
                              >
                                {retryingId === del.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {deliveryTotalPages > 1 && (
                <Pagination
                  page={deliveryPage}
                  totalPages={deliveryTotalPages}
                  onPageChange={setDeliveryPage}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── ADD ENDPOINT DIALOG ─── */}
      <AddEndpointDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCreated={async () => {
          await loadEndpoints();
          await loadStats();
          setShowAddDialog(false);
        }}
      />

      {/* ─── DETAIL DIALOG ─── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(detailItem, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page + 1} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </Button>
    </div>
  );
}

function AddEndpointDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setUrl("");
      setSecret(generateWebhookSecret());
      setDescription("");
      setSelectedEvents([]);
      setSelectAll(false);
    }
  }, [open]);

  const toggleEvent = (ev: string) => {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(["*"]);
    }
    setSelectAll(!selectAll);
  };

  const handleSave = async () => {
    if (!url) {
      toast({ title: "Erreur", description: "L'URL est requise.", variant: "destructive" });
      return;
    }
    if (selectedEvents.length === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins un événement.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await createWebhookEndpoint({
        url,
        secret,
        description: description || null,
        events: selectedEvents,
        is_active: true,
      });
      toast({ title: "Endpoint créé" });
      onCreated();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur inconnue",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un endpoint webhook</DialogTitle>
          <DialogDescription>
            Configurez l'URL qui recevra les notifications webhook.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>URL du endpoint</Label>
            <Input
              placeholder="https://example.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Secret HMAC (auto-généré)</Label>
            <div className="flex gap-2">
              <Input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSecret(generateWebhookSecret())}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisé pour signer les payloads avec HMAC-SHA256.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Input
              placeholder="Description de l'endpoint"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Événements</Label>
            <div className="flex items-center gap-2 mb-2">
              <Switch checked={selectAll} onCheckedChange={toggleSelectAll} id="select-all-events" />
              <Label htmlFor="select-all-events" className="text-sm">Tous les événements (*)</Label>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
              {ALL_WEBHOOK_EVENTS.map((ev) => (
                <div key={ev} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev) || selectedEvents.includes("*")}
                    onChange={() => toggleEvent(ev)}
                    id={`ev-${ev}`}
                    className="rounded"
                    disabled={selectAll}
                  />
                  <Label htmlFor={`ev-${ev}`} className="text-sm cursor-pointer">
                    {WEBHOOK_EVENT_LABELS[ev]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
