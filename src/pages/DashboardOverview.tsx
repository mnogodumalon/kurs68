import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Dozenten, Raeume, Teilnehmer, Kurse, Anmeldungen } from '@/types/app';
import { GraduationCap, Users, BookOpen, DoorOpen, ClipboardList, TrendingUp, Euro, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DashboardOverview() {
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [d, r, t, k, a] = await Promise.all([
          LivingAppsService.getDozenten(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);
        setDozenten(d);
        setRaeume(r);
        setTeilnehmer(t);
        setKurse(k);
        setAnmeldungen(a);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const today = startOfDay(new Date());

  const aktivKurse = kurse.filter(k => {
    if (!k.fields.startdatum || !k.fields.enddatum) return false;
    const start = parseISO(k.fields.startdatum);
    const end = parseISO(k.fields.enddatum);
    return !isAfter(start, today) && !isBefore(end, today);
  });

  const kommendeKurse = kurse.filter(k => {
    if (!k.fields.startdatum) return false;
    return isAfter(parseISO(k.fields.startdatum), today);
  });

  const bezahltCount = anmeldungen.filter(a => a.fields.bezahlt).length;
  const offenCount = anmeldungen.length - bezahltCount;

  const gesamtUmsatz = anmeldungen.reduce((sum, a) => {
    if (!a.fields.bezahlt || !a.fields.kurs) return sum;
    const kursId = extractRecordId(a.fields.kurs);
    const kurs = kurse.find(k => k.record_id === kursId);
    return sum + (kurs?.fields.preis || 0);
  }, 0);

  const gesamtKapazitaet = raeume.reduce((sum, r) => sum + (r.fields.kapazitaet || 0), 0);

  const kurseProDozent = dozenten.map(d => {
    const count = kurse.filter(k => extractRecordId(k.fields.dozent) === d.record_id).length;
    return { name: d.fields.name?.split(' ')[0] || 'N/A', kurse: count };
  }).filter(d => d.kurse > 0).slice(0, 6);

  const zahlungsData = [
    { name: 'Bezahlt', value: bezahltCount, color: 'oklch(0.65 0.18 155)' },
    { name: 'Offen', value: offenCount, color: 'oklch(0.75 0.16 75)' },
  ];

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 w-24 rounded bg-muted"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Willkommen zurück</h1>
            <p className="mt-2 text-white/80 max-w-lg">
              Verwalten Sie Ihre Kurse, Dozenten, Teilnehmer und Räume an einem zentralen Ort.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/20">
            <div className="text-right">
              <p className="text-white/70 text-sm">Gesamtumsatz</p>
              <p className="text-2xl font-bold">{loading ? '...' : `${gesamtUmsatz.toLocaleString('de-DE')} €`}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Euro className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dozenten</p>
              <p className="text-3xl font-bold tracking-tight mt-1">
                {loading ? <LoadingSkeleton /> : dozenten.length}
              </p>
            </div>
            <div className="kpi-icon kpi-icon-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Aktive Lehrende</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teilnehmer</p>
              <p className="text-3xl font-bold tracking-tight mt-1">
                {loading ? <LoadingSkeleton /> : teilnehmer.length}
              </p>
            </div>
            <div className="kpi-icon kpi-icon-success">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Registrierte Lernende</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kurse</p>
              <p className="text-3xl font-bold tracking-tight mt-1">
                {loading ? <LoadingSkeleton /> : kurse.length}
              </p>
            </div>
            <div className="kpi-icon kpi-icon-warning">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{aktivKurse.length} aktiv, {kommendeKurse.length} geplant</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Räume</p>
              <p className="text-3xl font-bold tracking-tight mt-1">
                {loading ? <LoadingSkeleton /> : raeume.length}
              </p>
            </div>
            <div className="kpi-icon kpi-icon-info">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{gesamtKapazitaet} Plätze gesamt</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Anmeldungen</p>
              <p className="text-3xl font-bold tracking-tight mt-1">
                {loading ? <LoadingSkeleton /> : anmeldungen.length}
              </p>
            </div>
            <div className="kpi-icon kpi-icon-accent">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{bezahltCount} bezahlt, {offenCount} offen</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Kurse pro Dozent */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="kpi-icon kpi-icon-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Kurse pro Dozent</h3>
              <p className="text-sm text-muted-foreground">Übersicht der Kursverteilung</p>
            </div>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Laden...</div>
          ) : kurseProDozent.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Keine Daten verfügbar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={kurseProDozent} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.015 200)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 240)" />
                <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 240)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'oklch(1 0 0)',
                    border: '1px solid oklch(0.91 0.015 200)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px -4px oklch(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="kurse" fill="oklch(0.52 0.14 195)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Zahlungsstatus */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="kpi-icon kpi-icon-success">
              <Euro className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Zahlungsstatus</h3>
              <p className="text-sm text-muted-foreground">Anmeldungen nach Bezahlstatus</p>
            </div>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Laden...</div>
          ) : anmeldungen.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Keine Anmeldungen vorhanden
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={zahlungsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {zahlungsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.91 0.015 200)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {zahlungsData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xl font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Kurse */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="kpi-icon kpi-icon-warning">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Aktuelle Kurse</h3>
            <p className="text-sm text-muted-foreground">Die neuesten Kursangebote</p>
          </div>
        </div>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">Laden...</div>
        ) : kurse.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Noch keine Kurse angelegt
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Kurs</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Dozent</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Zeitraum</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">Preis</th>
                </tr>
              </thead>
              <tbody>
                {kurse.slice(0, 5).map(kurs => {
                  const dozentId = extractRecordId(kurs.fields.dozent);
                  const dozent = dozenten.find(d => d.record_id === dozentId);
                  return (
                    <tr key={kurs.record_id} className="border-b border-muted/50 last:border-0">
                      <td className="py-3 px-2">
                        <p className="font-medium">{kurs.fields.titel || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {dozent?.fields.name || 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">
                        {kurs.fields.startdatum && kurs.fields.enddatum ? (
                          <>
                            {format(parseISO(kurs.fields.startdatum), 'dd.MM.yy', { locale: de })} - {format(parseISO(kurs.fields.enddatum), 'dd.MM.yy', { locale: de })}
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold">
                        {kurs.fields.preis?.toLocaleString('de-DE')} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
