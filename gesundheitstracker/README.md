# Gesundheitstracker

Ein Home-Assistant-Add-on für ein lokales Gesundheitstagebuch.

## Struktur

Dieses Add-on liegt im Ordner `gesundheitstracker`.

Technischer Slug:

```txt
gesundheitstracker
```

Sichtbarer Name:

```txt
Gesundheitstracker
```

## Version

1.0.1

## Hinweise

Die Daten werden im Add-on-Datenbereich gespeichert.


## Änderungen in 1.0.2

- Dark Mode wieder ergänzt
- Dark-Mode-Schalter im Profil/Einstellungen-Popup
- `dark_mode` wieder in `config.yaml` ergänzt
- Dark Mode wird zusätzlich lokal im Browser gespeichert


## Änderungen in 1.0.3

- Dark-Mode-Schalter im Profil/Einstellungen-Popup repariert
- Listener war in 1.0.2 versehentlich in den Theme-Listener gerutscht
- In-App-Dark-Mode greift jetzt sofort und bleibt lokal im Browser gespeichert
- Add-on-Einstellung `dark_mode` funktioniert weiterhin als Standardwert


## Änderungen in 1.0.4

- Symptome können wieder direkt aus der Tagesübersicht bearbeitet werden
- Symptom-Einträge erscheinen als eigene Liste mit Historie- und Bearbeiten-Button
- Im kleinen Bearbeiten-Popup kann jetzt die Uhrzeit des jeweiligen Eintrags geändert werden
- Gilt für Flüssigkeit, Temperatur, Stimmung, Symptome, Medikamente, Essen, Schlaf, Windel/Toilette und Notizen


## Änderungen in 1.0.5

- Temperatur/Fieber-Kachel zeigt jetzt immer die zeitlich letzte Messung des Tages
- Sortierung erfolgt anhand der gespeicherten Uhrzeit


## Änderungen in 1.0.6

- Temperatur/Fieber-Kachel zeigt die letzte Messung jetzt über einen robusten Datum-Uhrzeit-Vergleich
- Uhrzeiten wie `9:00`, `09:00`, `9.00` oder `0900` werden korrekt einsortiert
- Bei gleicher Uhrzeit gewinnt der zuletzt gespeicherte Eintrag


## Änderungen in 1.0.7

- Kacheln neu sortiert: Flüssigkeit, Essen, Fieber, Schlaf, Symptome, Stimmung, Medis, Notizen
- Dark-Mode-Schalter aus den Einstellungen nach oben in die Topbar verschoben
- Dark-Mode-Button sitzt links neben dem Backup-Button
- Symbol wechselt zwischen 🌙 und ☀️


## Änderungen in 1.0.9

- Rollback auf den letzten stabilen Stand vor 1.0.8
- Die Heute-Button-Änderung aus 1.0.8 wurde entfernt
- Basis ist die funktionierende Version 1.0.30


## Änderungen in 1.0.10

- Heute-Button sicher aus der Topbar in die Datumsnavigation verschoben
- JavaScript wurde bewusst nicht geändert
- Die ID `todayButton` bleibt erhalten, damit die bestehende funktionierende Logik nicht bricht


## Änderungen in 1.0.11

- Smartphone-Layout der Datumsnavigation korrigiert
- Vorheriger- und Nächster-Tag-Pfeil bleiben wieder auf gleicher Höhe
- Heute-Button sitzt auf Smartphone darunter mittig
- JavaScript wurde nicht geändert


## Änderungen in 1.0.12

- Datumsleiste vertikal kompakter gemacht
- Weniger Padding und geringere Abstände
- Heute-Button auf Smartphone niedriger gemacht
- Pfeile bleiben weiterhin auf gleicher Höhe
- JavaScript wurde nicht geändert


## Änderungen in 1.0.13

- Text „Einträge an diesem Tag“/Tageszusammenfassung aus der Datumsleiste optisch entfernt
- Datumsleiste dadurch kompakter gemacht
- Unterer breiter „Neuer Eintrag“-Button durch kleinen schwebenden Plus-Button rechts unten ersetzt
- Die bestehende Button-ID bleibt erhalten, damit die vorhandene JavaScript-Logik nicht bricht


## Änderungen in 1.0.14

- Neuer-Eintrag-Button endgültig als kleiner schwebender Plus-Button erzwungen
- Alte `.bottom-add-button` CSS-Regeln werden jetzt am Ende der CSS überschrieben
- Sichtbarer Text wurde zuverlässig durch `+` ersetzt, Button-ID bleibt erhalten


## Korrektur in 1.0.14

- Tatsächlicher Button `#openEntry` wird jetzt ebenfalls als Plus-FAB überschrieben


## Änderungen in 1.0.15

- Plus-Button auf iPhone etwas weiter nach links und unten verschoben
- Schwarzer/komischer Hintergrund am Speichern-Button im Neuer-Eintrag-Popup entfernt
- Nur CSS geändert, JavaScript bleibt unverändert


## Änderungen in 1.0.16

- Speichern-Button im Neuer-Eintrag-Popup stärker bereinigt
- Alte Overlay-/Glass-Regeln auf Button, Wrapper, Kind-Elementen und Pseudo-Elementen werden jetzt überschrieben
- Nur CSS geändert, JavaScript bleibt unverändert


## Änderungen in 1.0.17

- Neue Kachel „Windel / Toilette“ oben ergänzt
- Die Kachel sitzt vor der Medis-Kachel
- Klick auf die Kachel öffnet eine eigene Schnelleingabe für Windel / Toilette
- Desktop-Grid auf 9 Kacheln angepasst


## Änderungen in 1.0.18

- Kompakte Symptom-Anzeige direkt unter den Kacheln entfernt
- Die detaillierte Symptom-Liste weiter unten bleibt erhalten
- Historie- und Bearbeiten-Buttons für Symptome bleiben erhalten


## Änderungen in 1.0.19

- Stift-Symbol in den Bearbeiten-Buttons größer gemacht
- Button-Größe selbst bleibt unverändert
- Nur CSS geändert


## Änderungen in 1.0.20

- Stift-Symbol in den Bearbeiten-Buttons nochmals größer gemacht
- Button-Größe selbst bleibt unverändert
- Nur CSS geändert


## Änderungen in 1.0.21

- Tageskacheln etwas kompakter gemacht
- Geringere Höhe, weniger Padding und kleinere Abstände
- Icons/Text leicht verkleinert, aber lesbar gehalten
- Nur CSS geändert


## Änderungen in 1.0.22

- Historie-Button und Bearbeiten-Button optisch angeglichen
- Gleiche Umrandung, gleicher Hintergrund und gleicher Hover-Stil
- Button-Größe bleibt gleich
- Nur CSS geändert


## Änderungen in 1.0.23

- Auswertungs-/Suchfunktion ergänzt
- Neues Suchsymbol oben in der Leiste
- Zeitraumfilter Von/Bis
- Kategorie-Filter für Temperatur, Flüssigkeit, Symptome, Stimmung, Medikamente, Essen, Schlaf, Windel/Toilette, Notizen und Alle Einträge
- Temperaturauswertung mit Anzahl, Minimum, Maximum, Durchschnitt, Werte ab 38,5 °C und Werte ab 39,0 °C


## Änderungen in 1.0.24

- Such-/Auswertungsergebnisse werden jetzt nach Tagen gebündelt
- Jeder Tag bekommt eine eigene Überschrift mit Trefferanzahl
- Innerhalb eines Tages werden die Einträge nach Uhrzeit sortiert


## Änderungen in 1.0.25

- Schlaf kann optional mit Von/Bis-Zeit eingetragen werden
- Schlafdauer wird automatisch berechnet und im Schlaftext gespeichert
- Schlaf-Schnelleingabe unterstützt ebenfalls Von/Bis-Zeit
- Auswertung Kategorie Symptome zeigt zusätzlich einen Symptom-Verlauf nach Tagen


## Änderungen in 1.0.26

- Schlaf-Bearbeiten-Popup hat jetzt ebenfalls Von/Bis-Zeitfelder
- Schlafdauer wird beim Bearbeiten automatisch neu berechnet
- Bereits automatisch erzeugter Von/Bis-Text wird beim Bearbeiten aus dem Textfeld entfernt, damit er nicht doppelt gespeichert wird


## Änderungen in 1.0.27

- Schlaf über Mitternacht wird erkannt
- Beispiel: Von 20:30 bis 06:45 wird als 10 h 15 min, bis nächster Tag gespeichert
- Am Folgetag wird der Schlaf zusätzlich als Nachtschlaf von gestern angezeigt
- Der Eintrag wird nicht dupliziert, Bearbeiten/Historie bleiben beim Originaleintrag
- Beim Bearbeiten werden Von/Bis-Zeiten aus bestehendem Schlaftext wieder in die Felder übernommen


## Änderungen in 1.0.28

- Schlaf-Bearbeiten-Popup an die Schlaf-Neueingabe angeglichen
- Von/Bis-Felder setzen den Doppelpunkt jetzt zuverlässig automatisch
- Berechnete Schlafdauer wird beim Bearbeiten sichtbar angezeigt
- Optik der Schlaf-Zeitfelder im Bearbeiten-Popup verbessert


## Änderungen in 1.0.29

- Exportfunktion in der Auswertung ergänzt
- Export nach Zeitraum Von/Bis
- Symptome können für den Export gezielt ausgewählt werden
- Export wird als Textdatei heruntergeladen
- Export enthält passende Symptome plus relevante Zusatzinfos wie Temperatur, Medikamente, Flüssigkeit, Stimmung, Essen, Schlaf und Notizen


## Änderungen in 1.0.30

- Exportfunktion aus der Auswertung entfernt
- Export ist jetzt ein eigener Menüpunkt oben mit eigenem Symbol 📤
- Eigenes Export-Popup mit Von/Bis und Symptomauswahl
- Auswertung bleibt nur noch für Analyse/Suche zuständig
