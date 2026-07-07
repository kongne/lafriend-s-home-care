import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe, Settings2, FileImage, MessageSquare, Search, Shield, Zap,
  BarChart3, Link, Database, RefreshCw, Save, Mail, Phone, MapPin,
  Clock, Palette, Upload, Eye, Lock, Bell, ChevronRight,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SettingsState {
  general: { siteName: string; tagline: string; contactEmail: string; contactPhone: string; address: string; language: string };
  website: { maintenanceMode: boolean; customCss: string; analyticsId: string; favicon: string };
  content: { defaultThumbnail: string; maxImageSize: string; allowedTypes: string };
  media: { compressionLevel: string; autoOptimize: boolean; maxUploadWidth: string };
  communication: { emailSender: string; whatsappNumber: string; defaultMessage: string };
  seo: { defaultMetaDesc: string; ogImage: string; enableJsonLd: boolean };
  security: { recaptchaKey: string; rateLimitMax: string; sessionTimeout: string };
  performance: { imageQuality: string; enableCdn: boolean; lazyLoad: boolean };
  analytics: { googleId: string; facebookPixel: string; enableTracking: boolean };
  integrations: { googleOAuth: string; facebookOAuth: string; webhookUrl: string };
  backups: { autoBackup: boolean; retentionDays: string; lastBackup: string };
}

const DEFAULTS: SettingsState = {
  general: { siteName: "LaFriend's Services", tagline: "Services de Nettoyage Professionnels", contactEmail: "lafriendsservices@gmail.com", contactPhone: "+237 693 13 82 92", address: "Bafoussam, Cameroun", language: "fr" },
  website: { maintenanceMode: false, customCss: "", analyticsId: "", favicon: "" },
  content: { defaultThumbnail: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400", maxImageSize: "2", allowedTypes: "jpeg,png,webp" },
  media: { compressionLevel: "high", autoOptimize: true, maxUploadWidth: "1920" },
  communication: { emailSender: "noreply@lafriends.cm", whatsappNumber: "+237693138292", defaultMessage: "Bonjour! Je vous contacte depuis votre site web." },
  seo: { defaultMetaDesc: "Services de nettoyage professionnels à Bafoussam, Cameroun.", ogImage: "", enableJsonLd: true },
  security: { recaptchaKey: "", rateLimitMax: "50", sessionTimeout: "30" },
  performance: { imageQuality: "80", enableCdn: true, lazyLoad: true },
  analytics: { googleId: "", facebookPixel: "", enableTracking: false },
  integrations: { googleOAuth: "", facebookOAuth: "", webhookUrl: "" },
  backups: { autoBackup: false, retentionDays: "30", lastBackup: "Jamais" },
};

const STORAGE_KEY = "lafriends_settings";

const loadSettings = (): SettingsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULTS, ...parsed, general: { ...DEFAULTS.general, ...parsed.general }, website: { ...DEFAULTS.website, ...parsed.website }, content: { ...DEFAULTS.content, ...parsed.content }, media: { ...DEFAULTS.media, ...parsed.media }, communication: { ...DEFAULTS.communication, ...parsed.communication }, seo: { ...DEFAULTS.seo, ...parsed.seo }, security: { ...DEFAULTS.security, ...parsed.security }, performance: { ...DEFAULTS.performance, ...parsed.performance }, analytics: { ...DEFAULTS.analytics, ...parsed.analytics }, integrations: { ...DEFAULTS.integrations, ...parsed.integrations }, backups: { ...DEFAULTS.backups, ...parsed.backups } };
    }
  } catch { }
  return DEFAULTS;
};

const SectionCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Card className="card-elevated">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const Field = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
    {children}
  </div>
);

export const AdminSettingsCenter = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const update = (section: keyof SettingsState, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast({ title: "Paramètres enregistrés", description: "Tous les changements ont été sauvegardés." });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'enregistrer les paramètres.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetSection = (section: keyof SettingsState) => {
    setSettings((prev) => ({ ...prev, [section]: { ...DEFAULTS[section] } }));
  };

  const tabs = [
    { value: "general", label: "Général", icon: Settings2 },
    { value: "website", label: "Site Web", icon: Globe },
    { value: "content", label: "Contenu", icon: FileImage },
    { value: "media", label: "Médias", icon: Upload },
    { value: "communication", label: "Communication", icon: MessageSquare },
    { value: "seo", label: "SEO", icon: Search },
    { value: "security", label: "Sécurité", icon: Shield },
    { value: "performance", label: "Performance", icon: Zap },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "integrations", label: "Intégrations", icon: Link },
    { value: "backups", label: "Sauvegardes", icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Centre de Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">Gérez tous les paramètres de votre plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setSettings(loadSettings()); }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
              <tab.icon className="h-4 w-4" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {/* General */}
          <TabsContent value="general" className="space-y-6">
            <SectionCard title="Général" description="Informations de base de l'entreprise">
              <Field label="Nom du site"><Input value={settings.general.siteName} onChange={(e) => update("general", "siteName", e.target.value)} /></Field>
              <Field label="Slogan"><Input value={settings.general.tagline} onChange={(e) => update("general", "tagline", e.target.value)} /></Field>
              <Field label="Email de contact"><Input type="email" value={settings.general.contactEmail} onChange={(e) => update("general", "contactEmail", e.target.value)} /></Field>
              <Field label="Téléphone"><Input value={settings.general.contactPhone} onChange={(e) => update("general", "contactPhone", e.target.value)} /></Field>
              <Field label="Adresse"><Input value={settings.general.address} onChange={(e) => update("general", "address", e.target.value)} /></Field>
              <Field label="Langue par défaut">
                <Select value={settings.general.language} onValueChange={(v) => update("general", "language", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("general")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Website */}
          <TabsContent value="website" className="space-y-6">
            <SectionCard title="Site Web" description="Configuration générale du site">
              <Field label="Mode maintenance">
                <div className="flex items-center gap-2">
                  <Switch checked={settings.website.maintenanceMode} onCheckedChange={(v) => update("website", "maintenanceMode", v)} />
                  <span className="text-sm text-muted-foreground">{settings.website.maintenanceMode ? "Activé" : "Désactivé"}</span>
                </div>
              </Field>
              <Field label="CSS personnalisé" description="Styles supplémentaires pour le site"><Textarea value={settings.website.customCss} onChange={(e) => update("website", "customCss", e.target.value)} rows={4} /></Field>
              <Field label="ID Analytics"><Input value={settings.website.analyticsId} onChange={(e) => update("website", "analyticsId", e.target.value)} /></Field>
              <Field label="Favicon URL"><Input value={settings.website.favicon} onChange={(e) => update("website", "favicon", e.target.value)} /></Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("website")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Content */}
          <TabsContent value="content" className="space-y-6">
            <SectionCard title="Contenu" description="Configuration du contenu">
              <Field label="Vignette par défaut"><Input value={settings.content.defaultThumbnail} onChange={(e) => update("content", "defaultThumbnail", e.target.value)} /></Field>
              <Field label="Taille max image (MB)">
                <Select value={settings.content.maxImageSize} onValueChange={(v) => update("content", "maxImageSize", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 MB</SelectItem>
                    <SelectItem value="2">2 MB</SelectItem>
                    <SelectItem value="5">5 MB</SelectItem>
                    <SelectItem value="10">10 MB</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Types de fichiers autorisés"><Input value={settings.content.allowedTypes} onChange={(e) => update("content", "allowedTypes", e.target.value)} /></Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("content")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Media */}
          <TabsContent value="media" className="space-y-6">
            <SectionCard title="Médias" description="Configuration de la médiathèque">
              <Field label="Niveau de compression">
                <Select value={settings.media.compressionLevel} onValueChange={(v) => update("media", "compressionLevel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Optimisation automatique">
                <div className="flex items-center gap-2">
                  <Switch checked={settings.media.autoOptimize} onCheckedChange={(v) => update("media", "autoOptimize", v)} />
                  <span className="text-sm text-muted-foreground">{settings.media.autoOptimize ? "Activé" : "Désactivé"}</span>
                </div>
              </Field>
              <Field label="Largeur max d'upload (px)"><Input type="number" value={settings.media.maxUploadWidth} onChange={(e) => update("media", "maxUploadWidth", e.target.value)} /></Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("media")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Communication */}
          <TabsContent value="communication" className="space-y-6">
            <SectionCard title="Communication" description="Paramètres de communication">
              <Field label="Email d'expédition"><Input type="email" value={settings.communication.emailSender} onChange={(e) => update("communication", "emailSender", e.target.value)} /></Field>
              <Field label="Numéro WhatsApp"><Input value={settings.communication.whatsappNumber} onChange={(e) => update("communication", "whatsappNumber", e.target.value)} /></Field>
              <Field label="Message WhatsApp par défaut"><Textarea value={settings.communication.defaultMessage} onChange={(e) => update("communication", "defaultMessage", e.target.value)} rows={3} /></Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("communication")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* SEO */}
          <TabsContent value="seo" className="space-y-6">
            <SectionCard title="SEO" description="Optimisation pour les moteurs de recherche">
              <Field label="Meta description par défaut"><Textarea value={settings.seo.defaultMetaDesc} onChange={(e) => update("seo", "defaultMetaDesc", e.target.value)} rows={2} /></Field>
              <Field label="Image OG par défaut"><Input value={settings.seo.ogImage} onChange={(e) => update("seo", "ogImage", e.target.value)} /></Field>
              <Field label="Données structurées (JSON-LD)">
                <div className="flex items-center gap-2">
                  <Switch checked={settings.seo.enableJsonLd} onCheckedChange={(v) => update("seo", "enableJsonLd", v)} />
                  <span className="text-sm text-muted-foreground">{settings.seo.enableJsonLd ? "Activé" : "Désactivé"}</span>
                </div>
              </Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("seo")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <SectionCard title="Sécurité" description="Paramètres de sécurité">
              <Field label="Clé reCAPTCHA"><Input value={settings.security.recaptchaKey} onChange={(e) => update("security", "recaptchaKey", e.target.value)} /></Field>
              <Field label="Limite de requêtes (par minute)"><Input type="number" value={settings.security.rateLimitMax} onChange={(e) => update("security", "rateLimitMax", e.target.value)} /></Field>
              <Field label="Délai d'inactivité (minutes)"><Input type="number" value={settings.security.sessionTimeout} onChange={(e) => update("security", "sessionTimeout", e.target.value)} /></Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("security")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6">
            <SectionCard title="Performance" description="Optimisation des performances">
              <Field label="Qualité des images (1-100)">
                <Select value={settings.performance.imageQuality} onValueChange={(v) => update("performance", "imageQuality", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 (Faible)</SelectItem>
                    <SelectItem value="80">80 (Moyen)</SelectItem>
                    <SelectItem value="90">90 (Élevé)</SelectItem>
                    <SelectItem value="100">100 (Original)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="CDN">
                <div className="flex items-center gap-2">
                  <Switch checked={settings.performance.enableCdn} onCheckedChange={(v) => update("performance", "enableCdn", v)} />
                  <span className="text-sm text-muted-foreground">{settings.performance.enableCdn ? "Activé" : "Désactivé"}</span>
                </div>
              </Field>
              <Field label="Chargement différé (lazy load)">
                <div className="flex items-center gap-2">
                  <Switch checked={settings.performance.lazyLoad} onCheckedChange={(v) => update("performance", "lazyLoad", v)} />
                  <span className="text-sm text-muted-foreground">{settings.performance.lazyLoad ? "Activé" : "Désactivé"}</span>
                </div>
              </Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("performance")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <SectionCard title="Analytics" description="Configuration du suivi">
              <Field label="Google Analytics ID"><Input value={settings.analytics.googleId} onChange={(e) => update("analytics", "googleId", e.target.value)} /></Field>
              <Field label="Facebook Pixel ID"><Input value={settings.analytics.facebookPixel} onChange={(e) => update("analytics", "facebookPixel", e.target.value)} /></Field>
              <Field label="Activer le suivi">
                <div className="flex items-center gap-2">
                  <Switch checked={settings.analytics.enableTracking} onCheckedChange={(v) => update("analytics", "enableTracking", v)} />
                  <span className="text-sm text-muted-foreground">{settings.analytics.enableTracking ? "Activé" : "Désactivé"}</span>
                </div>
              </Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("analytics")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <SectionCard title="Intégrations" description="Configuration des services tiers">
              <Field label="Google OAuth Client ID"><Input value={settings.integrations.googleOAuth} onChange={(e) => update("integrations", "googleOAuth", e.target.value)} /></Field>
              <Field label="Facebook OAuth App ID"><Input value={settings.integrations.facebookOAuth} onChange={(e) => update("integrations", "facebookOAuth", e.target.value)} /></Field>
              <Field label="Webhook URL" description="URL pour les notifications externes"><Input value={settings.integrations.webhookUrl} onChange={(e) => update("integrations", "webhookUrl", e.target.value)} /></Field>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("integrations")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>

          {/* Backups */}
          <TabsContent value="backups" className="space-y-6">
            <SectionCard title="Sauvegardes" description="Gestion des sauvegardes">
              <Field label="Sauvegarde automatique">
                <div className="flex items-center gap-2">
                  <Switch checked={settings.backups.autoBackup} onCheckedChange={(v) => update("backups", "autoBackup", v)} />
                  <span className="text-sm text-muted-foreground">{settings.backups.autoBackup ? "Activé" : "Désactivé"}</span>
                </div>
              </Field>
              <Field label="Jours de rétention">
                <Select value={settings.backups.retentionDays} onValueChange={(v) => update("backups", "retentionDays", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="14">14 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Dernière sauvegarde</p>
                  <p className="text-xs text-muted-foreground">{settings.backups.lastBackup}</p>
                </div>
                <Button variant="outline" size="sm" disabled>Sauvegarder maintenant</Button>
              </div>
            </SectionCard>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => resetSection("backups")}>Réinitialiser cette section</Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminSettingsCenter;
