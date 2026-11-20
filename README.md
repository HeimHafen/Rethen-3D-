# Rethen · Peiner Straße · V21 Referenzabgleich

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

## Verbesserungen aus V20 und V21

- Gemeinsame, übersichtliche **Bereichsauswahl** mit zwölf Ansichten für die bereits vorhandenen Modelle; Kamerawechsel bleiben innerhalb derselben Welt.
- Aufgeräumte, fingerfreundliche Bedienoberfläche für iPhone (Hoch- und Querformat), inklusive Safe-Area-Abständen.
- Weiterhin die verbindlichen **Farben**: öffentlicher Gehweg hellbeige, Fahrbahn graublau. Private Zufahrten bleiben unterscheidbar.
- Korrektur einer überlappenden Asphaltfläche an der Einmündung: minimaler Höhenversatz zur Verringerung von Flimmern.
- Zuverlässigeres Loslassen der Bewegungssteuerung bei unterbrochenem Touch und beim Wechsel aus dem Browser.
- Quellcode, lokales Three.js, das GLB-Haus und alle erforderlichen Dateien im Paket, **ohne CDN**.

## NEU in V21: Foto-/Videoabgleich

Der Benutzer hat sechs Live-Screenshots der V20-Szene sowie sieben Straßenansicht-Videos
(19./20. November 2026) bereitgestellt. V21 verbessert gezielt die wichtigsten
beobachtbaren Abweichungen, ohne die bestehende Szene oder das Modell von Haus 9B zu ersetzen.

- **Haus 8**: Die in V20 nicht passende rote Mauer mit den übergroßen Kugelhecken wurde entfernt.
  Stattdessen gibt es einen verwitterten Holzzaun mit durchlässigem Kreuzgitter unten und
  waagerechten Brettern oben. Pflanzen stehen niedriger und weiter hinter dem Zaun.
- **Haus 8, Material**: hellgrau verwitterte Fassadenverkleidung, blau gestrichener Eingangsvorbau,
  abgedunkelte Dachziegeltextur, Dachrinne und Fallrohr. Die genaue Dimensionierung bleibt annähernd.
- **Haus 7**: Garagenfront an die im Video sichtbare Anordnung mit zwei Toren links,
  einem Tor rechts und einem zentralen Treppenaufgang angenähert; dunklere Garagentore,
  weniger auffällige Rahmen sowie ziegelartig strukturierte Dachoberflächen.
- **Vegetation**: Unregelmäßigere, kleinere Baumkronen- und Buschformen anstelle
  besonders grober gleichförmiger Kugelkonturen.
- **Straßenraum**: Asphaltfeinkörnung reduziert; schmale, helle Pflasterabschlüsse ergänzt.
  Die vorgegebenen Grundfarben (graublau/beige) bleiben bestehen.
- **iPhone**: Kopfzeile und Standortauswahl auf volle Breite zusammengeführt; Bedienelemente
  kompakter; Kamerapositionen für Haus 8, Haus 7 und Kiosk so angepasst, dass mehr
  vom zugehörigen Bereich sichtbar ist.

**Bewusst nicht als 1:1 verifiziert**: Straßenmittelachse, Gebäudeabstände, rückwärtige
Gebäudeseiten, Dächer ohne passende Detailaufnahme, Vermessung, exakte Materialfarbwerte
und Nebengebäude. Einige Gebäude sind weiterhin vereinfachte Platzhalter.

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

Die bisherige Straßenachse wurde aus einer bereitgestellten Luftaufnahme angenähert; Fassaden/Grundstücke stammen teils aus Nutzerfotos, teils aus generischer Platzhalterbebauung. **Dies ist keine vermessene, zentimetergenaue Rekonstruktion Rethens.** Positionen, Höhen, Dachformen und rückwärtige Seiten ohne ausreichendes Referenzmaterial bleiben geschätzt. V21 konsolidiert und überarbeitet konkrete, in den sieben Straßenansicht-Videos erkennbare Details des vorhandenen Entwicklungsstands, ohne eine 1:1-Übereinstimmung vorzutäuschen.

## Prüfung

Prüfung des Paketaufbaus, der Javascript-Syntax, der referenzierten Dateipfade, des GLB-Headers und der Navigationselemente. Zusätzlich unter Chromium/Linux in einem echten WebGL-Kontext getestet (390 × 844 px): alle zwölf Kamerabereiche, Tag/Nacht, Original-GLB sowie die Steueroberfläche; keine JavaScript-/Konsolenfehler. Ein Safari-Test auf einem realen iPhone bleibt ausstehend.

Quellenbasis: `Rethen-Peiner-Strasse-V19.zip`, danach V20; sieben Videoreferenzen plus sechs Live-Screenshots vom 19.–20.11.2026. V21 baut direkt auf V20 auf.
