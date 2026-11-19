# Rethen · Peiner Straße · V1

Begehbarer erster Abschnitt mit 200 Metern Fahrbahn, beidseitigen Gehwegen,
Bordsteinen und dem unveränderten Hausmodell an der Peiner Straße 9B.
Die Startposition liegt gegenüber der Fassade.

## Auf GitHub Pages starten

1. ZIP entpacken und den gesamten Inhalt in das neue Repository übernehmen.
   `index.html`, `world.js`, `assets` und `vendor` liegen auf derselben Ebene.
2. In GitHub unter **Settings → Pages** den Branch mit diesen Dateien und
   den Ordner **/(root)** als Quelle wählen.
3. Die dort angezeigte Pages-Adresse öffnen. Alle Dateien werden aus dem
   eigenen Repository geladen.

Lokal im entpackten Verzeichnis `python3 -m http.server 8000` ausführen
und `http://localhost:8000` öffnen.

## Steuerung

- Desktop: WASD oder Pfeiltasten zum Laufen, mit gedrückter Maus umsehen.
- Handy: Pfeiltasten auf dem Bildschirm zum Laufen, über die Szene wischen
  zum Umsehen.
- **Zum Haus** setzt die Startansicht wieder her.

## Genauigkeit

Die Straßenachse ist aus der bereitgestellten Luftaufnahme angenähert.
Der Abschnitt misst 200 Meter entlang der modellierten Achse. Die Anschlussbereiche
jenseits des sichtbaren Luftbildausschnitts, Breiten, Höhen und Gebäudeabstände
sind geschätzt. Die Nachbarhäuser zeigen angelehnte Grundformen mit vorläufigen
Fassaden. Die Innenräume sind außerhalb des Umfangs dieser Version.
Das Originalhaus liegt unter `assets/models/Haus-Aussenmodell.glb`.
