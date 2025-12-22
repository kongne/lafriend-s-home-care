Résumé des changements (diff simplifié)
====================================

Les blocs suivants présentent un diff simplifié "avant / après" des fichiers modifiés par la PR.

1) `src/lib/logger.ts` (nouveau)

```ts
export const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false);

export const log = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

export const info = (...args: unknown[]) => {
  if (isDev) console.info(...args);
};

export const warn = (...args: unknown[]) => {
  if (isDev) console.warn(...args);
};

export const error = (...args: unknown[]) => {
  if (isDev) console.error(...args);
};
```

2) `src/main.tsx` (extrait clé)

```diff
@@ -1,3 +1,4 @@
 import "./index.css";
+import { info, error as logError } from "@/lib/logger";
 
 // Other code...
 
      .then((registration) => {
        info('SW registered:', registration.scope);
      })
      .catch((err) => {
        logError('SW registration failed:', err);
      });
```

3) `src/pages/NotFound.tsx`

```diff
@@ -1,3 +1,4 @@
 import { useEffect } from "react";
 import { error as logError } from "@/lib/logger";
 
  useEffect(() => {
    logError("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);
```

4) `src/pages/AdminSettings.tsx` (normalisation des catch)

```diff
@@ -1,7 +1,7 @@
     } catch (error: any) {
       const msg = error instanceof Error ? error.message : String(error);
       toast({
         title: "Error",
         description: msg,
         variant: "destructive",
       });
     } finally {
     } catch (err) {
       const msg = err instanceof Error ? err.message : String(err);
       toast({
         title: "Error",
         description: msg,
         variant: "destructive",
       });
     } finally {
```

5) `src/pages/Admin.tsx` (extraits)

```diff
@@ -1,3 +1,4 @@
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { error as logError } from "@/lib/logger";
 
     } catch (error) {
       logError("Error checking admin role:", err);
       navigate("/");
     } finally {
```

6) `src/components/Contact.tsx` (extraits)

```diff
@@ -1,3 +1,4 @@
     } catch (notifError) {
       warn("Notification email skipped:", notifError);
     }
 
     } catch (error) {
       logError("Contact error:", err);
```

7) `src/components/ChatWidget.tsx` & `src/components/BookingForm.tsx`

Remplacement de `console.error` par `logError("...", err)` et ajout de l'import `error as logError` depuis `@/lib/logger`.

8) `src/lib/exportPdf.ts`

```diff
@@ -1,7 +1,7 @@
 export const exportToPDF = (
   data: any[],
   filename: string,
   columns: Column[],
   title: string = "Rapport"
 ): void => {
   const tableRows = data
     .map((item) => {
       const rowItem = item as Record<string, unknown>;
       const cells = columns
         .map((col) => `<td style="padding: 8px; border: 1px solid #ddd;">${rowItem[col.key] ?? ""}</td>`)
         .join("");
       return `<tr>${cells}</tr>`;
     })
     .join("");
```

9) `src/lib/exportCsv.ts`

```diff
@@ -1,3 +1,4 @@
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 import { warn } from "@/lib/logger";
 
   if (data.length === 0) {
     warn("No data to export");
     return;
   }
```

10) `src/integrations/supabase/client.ts`

```diff
@@ -1,6 +1,6 @@
   auth: {
     storage: localStorage,
     persistSession: true,
     autoRefreshToken: true,
   }
   auth: {
     // Only provide a storage implementation in the browser environment
     // to avoid errors during SSR or tooling that runs in Node.
     ...(typeof window !== 'undefined' ? { storage: localStorage } : {}),
     persistSession: true,
     autoRefreshToken: true,
   }
```

Fin du diff simplifié.

Note: ceci est un résumé formaté pour une PR. Pour un patch unifié `git diff` exact, exécutez localement `git diff main...HEAD` après avoir créé la branche et appliqué les commits.
