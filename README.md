# Rethen · Peiner Straße · V20 Gesamtpaket

**Ein zusammenhängender 3D-Rundgang** durch den bisher erstellten Abschnitt der Peiner Straße in Rethen (Laatzen). Grundlage ist das originale **V19-Projekt**, das vollständig übernommen wurde. Die bisherigen Architekturmodelle, Straßen, Gehwege, Nachtbeleuchtung und Korrekturen bleiben erhalten.

## Enthaltene Bereiche

1. Peiner Straße 9B – Original-Außenmodell `assets/models/Haus-Aussenmodell.glb`.
2. Haus 12 – gegenüberliegendes Haus mit Dach und Einfriedung.
3. Straßenabschnitt – ungefähr 200 m lange, gekrümmte Fahrbahn mit beidseitigen Gehwegen und Bordsteinen.
4. Einmündung in Richtung Bachstraße – asphaltierter Anschluss, abgerundete Gehweg-/Bordsteinführung (geometrisch angenähert).
5. Kiosk Singh – Fachwerkgiebel, Beschilderung, Verkaufsfenster, Vordach, Lieferwagen und Beleuchtung.
6. Haus 8 – blauer Eingangsvorbau, Vorgarten und Zaun.
7. Haus 10 – vereinfachte Straßenfront.
8. Haus 7 – Garagen, Mittelaufgang, Gitter, Zufahrt, Carport, Rinne und zwei Schachtdeckel; die in V19 entfernte Mauer/Latte und der rechte Ausleger bleiben entfernt.
9. Klinkerhaus mit grünen Toren und rotes Klinkerhaus.
10. Weiße Giebelhäuser sowie der Fußweg mit Pollern.

Alle Bereiche liegen **in einer einzigen 3D-Szene** und können zu Fuß erreicht werden. Es werden keine separaten Levels geladen.

## Neu in V20

- Gemeinsame, übersichtliche **Bereichsauswahl** mit zwölf Ansichten für die bereits vorhandenen Modelle; Kamerawechsel bleiben innerhalb derselben Welt.
- Aufgeräumte, fingerfreundliche Bedienoberfläche für iPhone (Hoch- und Querformat), inklusive Safe-Area-Abständen.
- Weiterhin die verbindlichen **Farben**: öffentlicher Gehweg hellbeige, Fahrbahn graublau. Private Zufahrten bleiben unterscheidbar.
- Korrektur einer überlappenden Asphaltfläche an der Einmündung: minimaler Höhenversatz zur Verringerung von Flimmern.
- Zuverlässigeres Loslassen der Bewegungssteuerung bei unterbrochenem Touch und beim Wechsel aus dem Browser.
- Quellcode, lokales Three.js, das GLB-Haus und alle erforderlichen Dateien im Paket, **ohne CDN**.

## Installation auf GitHub Pages

1. ZIP-Datei entpacken.
2. **Den Inhalt** des entpackten Ordners in das Root-Verzeichnis deines GitHub-Repositories kopieren. Nicht nur die ZIP-Datei hochladen und keinen zusätzlichen Unterordner zwischen `index.html` und Repository-Root erstellen.
3. In **Settings → Pages** die Veröffentlichung über **Deploy from a branch**, den richtigen Branch und `/(root)` auswählen.
4. Die GitHub-Pages-Adresse öffnen. Auf iPhone/Safari funktioniert die Steuerung über die eingeblendeten Richtungstasten und Wischbewegungen über die Szene.

Lokal: im Ordner `python3 -m http.server 8000` starten, dann `http://localhost:8000` öffnen. Direktes Öffnen von `index.html` als Datei kann wegen Browser-Sicherheitsregeln die Module/GLB-Datei blockieren.

## Steuerung

- **Desktop:** WASD oder Pfeiltasten zum Gehen, mit gedrückter Maus umsehen.
- **iPhone:** Richtungstasten zum Gehen, Finger über die 3D-Szene ziehen zum Umsehen.
- **Bereich auswählen:** Sprung zur gewählten Perspektive. Der gesamte Straßenraum bleibt zusammenhängend begehbar.
- **Start:** Ausgangsperspektive bei Haus 9B.
- **Nacht/Tag:** Tageszeitansicht und Straßenbeleuchtung umschalten.

## Präzision und Grenzen

Die bisherige Straßenachse wurde aus einer bereitgestellten Luftaufnahme angenähert; Fassaden/Grundstücke stammen teils aus Nutzerfotos, teils aus generischer Platzhalterbebauung. **Dies ist keine vermessene, zentimetergenaue Rekonstruktion Rethens.** Positionen, Höhen, Dachformen und rückwärtige Seiten ohne ausreichendes Referenzmaterial bleiben geschätzt. V20 konsolidiert den vorhandenen Entwicklungsstand, ohne eine 1:1-Übereinstimmung vorzutäuschen.

## Prüfung

Prüfung des Paketaufbaus, der Javascript-Syntax, der referenzierten Dateipfade, des GLB-Headers und der Navigationselemente. Ein vollständiger interaktiver Grafik-/Safari-Test auf einem realen iPhone kann nicht allein durch diese statischen Kontrollen ersetzt werden.

Quelle: `Rethen-Peiner-Strasse-V19.zip` (Originalstand, 19.11.2026). Darauf aufbauend V20.
