import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Eye, Activity, Loader2 } from "lucide-react";

const AnalyticsOverview = () => {
  const [days, setDays] = useState(7);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ga-report", days],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = (await supabase.auth.getSession()).data.session;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/ga-report?days=${days}`,
        {
          headers: {
            "Authorization": `Bearer ${session?.access_token ?? anonKey}`,
            "apikey": anonKey,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
        {
          headers: {
            "Authorization": `Bearer ${session?.access_token ?? anonKey}`,
            "apikey": anonKey,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d} dagar
            </Button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Hämtar data från Google Analytics…</span>
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Kunde inte hämta GA-data: {(error as Error).message}</p>
            <p className="text-xs text-muted-foreground mt-1">Kontrollera att Service Account-nyckeln och Property ID är korrekt konfigurerade.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sidvisningar</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.pageViews.toLocaleString("sv-SE")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aktiva användare</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.activeUsers.toLocaleString("sv-SE")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sessioner</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.sessions.toLocaleString("sv-SE")}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Populäraste sidorna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sida</TableHead>
                    <TableHead className="text-right">Visningar</TableHead>
                    <TableHead className="text-right">Användare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPages.map((page: any) => (
                    <TableRow key={page.path}>
                      <TableCell className="font-mono text-sm">{page.path}</TableCell>
                      <TableCell className="text-right">{page.views.toLocaleString("sv-SE")}</TableCell>
                      <TableCell className="text-right">{page.users.toLocaleString("sv-SE")}</TableCell>
                    </TableRow>
                  ))}
                  {data.topPages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">Ingen data för perioden</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsOverview;
