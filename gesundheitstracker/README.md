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
- Basis ist die funktionierende Version 1.0.74


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


## Änderungen in 1.0.31

- Obere Symbole in ein kompaktes Drei-Punkte-Menü zusammengefasst
- Menü enthält Auswertung, Export, Dark Mode und Backup
- Export kann jetzt Alle Daten oder Nur ausgewählte Symptome exportieren
- Exportfunktion bleibt eigener Menüpunkt, aber die Topbar ist wieder aufgeräumt


## Änderungen in 1.0.32

- Export-Kategorien frei auswählbar
- Unterstützt: Temperatur, Flüssigkeit, Symptome, Stimmung, Medikamente, Essen, Schlaf, Windel/Toilette und Notizen
- Option „Alle Kategorien“ ergänzt
- Symptomfilter bleibt zusätzlich verfügbar, wenn Symptome exportiert werden
- Exportdatei enthält nur die ausgewählten Kategorien


## Änderungen in 1.0.33

- Theme-Auswahl aus dem Profil entfernt und in das Drei-Punkte-Menü verschoben
- Profil-Button oben nutzt jetzt ein Profil/Kopf-Symbol
- Theme-Auswahl im Menü synchronisiert weiterhin mit der bestehenden Theme-Logik


## Änderungen in 1.0.34

- Theme ist im Drei-Punkte-Menü jetzt nur noch ein Menüpunkt
- Die eigentliche Theme-Auswahl öffnet sich in einem eigenen Popup
- Direkte Theme-Auswahl im Drei-Punkte-Menü entfernt


## Änderungen in 1.0.35

- Hauptschrift der Tageskacheln vergrößert
- Kachellabel und Hauptwert sind besser lesbar
- Kleine Statuszeile unten bleibt klein
- Nur CSS geändert


## Änderungen in 1.0.36

- Tageskacheln werden jetzt immer angezeigt, auch wenn noch kein Eintrag vorhanden ist
- Die leere Platzhalteransicht „Noch nichts eingetragen“ wurde entfernt
- Kacheln zeigen bei leeren Tagen weiterhin „Keine“ bzw. „Nicht eingetragen“


## Änderungen in 1.0.37

- Globale Swipe-Geste zum Tageswechsel ergänzt
- Nach links wischen: nächster Tag
- Nach rechts wischen: vorheriger Tag
- In Eingabefeldern, Popups, Menüs und Buttons wird Swipe ignoriert, damit nichts versehentlich springt


## Änderungen in 1.0.38

- Swipe-Geste für die Home-Assistant-App robuster gemacht
- Erkennung läuft jetzt primär auf der Tagesansicht statt nur global auf document
- Pointer-Events und Touch-Events werden parallel unterstützt
- Zusätzlicher Fallback für iOS/WebView ergänzt
- Swipe bleibt in Popups, Menüs und Eingabefeldern deaktiviert


## Änderungen in 1.0.39

- Swipe-Gestensteuerung vollständig entfernt
- Zugehörige Touch-/Pointer-Event-Listener entfernt
- Zugehörige Swipe-CSS-Regeln entfernt
- Tageswechsel erfolgt wieder nur über die Pfeile bzw. Datumsauswahl


## Änderungen in 1.0.42

- Hybrid-Testversion: Kategorien bleiben erhalten
- Pro Kategorie werden standardmäßig nur die letzten 3 Einträge angezeigt
- Je Kategorie gibt es bei Bedarf einen „Weitere anzeigen“-Button
- Historie- und Bearbeiten-Buttons bleiben pro Eintrag erhalten
- Basis ist wieder 1.0.39, nicht 1.0.40 oder 1.0.41


## Änderungen in 1.0.43

- Kategorie-Testansicht repariert
- Weitere-Einträge werden jetzt wirklich ausgeblendet
- „Weitere anzeigen“ funktioniert jetzt pro Kategorie
- Zeitspalte in der Übersicht wieder sauber ausgerichtet


## Änderungen in 1.0.44

- Uhrzeit-Badge in der Kategorieansicht korrigiert
- Hintergrund deckt die Uhrzeit jetzt vollständig ab
- Zeitspalte etwas breiter und sauber zentriert
- Nur CSS geändert


## Änderungen in 1.0.45

- Neue moderne dunkle Themes ergänzt
- Midnight, Graphite, Nord Night, Moss Dark, Mocha Dark und Aubergine hinzugefügt
- Farben bewusst gedämpft und weniger grell gehalten
- Theme-Auswahl im Theme-Popup erweitert


## Änderungen in 1.0.46

- Neue dunkle Themes repariert
- `body.dark` hat die neuen Themes vorher teilweise überschrieben
- Neue Themes haben jetzt eigene `body.dark[data-theme=...]` Regeln mit `!important`
- Themes unterscheiden sich jetzt sichtbar stärker, bleiben aber gedämpft


## Änderungen in 1.0.47

- Speichern der neuen Themes repariert
- Neue Theme-Namen in der JavaScript-Whitelist ergänzt
- Theme-Popup wird nach Auswahl korrekt synchronisiert
- Ursache: `applyTheme()` hat unbekannte Themes bisher automatisch auf `babyblue` zurückgesetzt


## Änderungen in 1.0.48

- HTML-Druckansicht für Export ergänzt
- Export-Popup hat jetzt TXT exportieren und Druckansicht / PDF
- Druckansicht erzeugt einen formatierten Bericht ohne zusätzliche Python-Pakete
- Über Drucken / als PDF speichern kann daraus eine PDF erstellt werden


## Änderungen in 1.0.49

- iPhone/Home-Assistant-App: direkte Print-Funktion entfernt, weil WebView sie blockieren kann
- Stattdessen gibt es eine Bericht-Ansicht und einen Button „Bericht kopieren“
- TXT-Export und Bericht-Ansicht sind jetzt nach Kategorien gruppiert
- Innerhalb jeder Kategorie sind die Einträge nach Datum und Uhrzeit sortiert
- Export ist nicht mehr nur chronologisch gemischt


## Änderungen in 1.0.50

- iPhone-sicherer Kopier-Fallback für die Berichtansicht ergänzt
- Automatische Clipboard-API entfernt, da sie in der Home-Assistant-App/WebView blockiert werden kann
- Button „Text zum Kopieren markieren“ zeigt ein auswählbares Textfeld und markiert den Bericht
- Bericht bleibt weiterhin nach Kategorien gruppiert


## Änderungen in 1.0.51

- Separate Bericht-Seite für Safari/PDF ergänzt
- Export-Popup hat jetzt „Bericht-Seite öffnen“
- Bericht wird als eigenständige HTML-Seite erzeugt
- Die Seite enthält einen eigenen Drucken/PDF-Button und ist für iPhone/Safari optimiert
- Falls Popups blockiert werden, wird die HTML-Datei als Download geöffnet


## Änderungen in 1.0.52

- Kachel-Beschriftungen werden jetzt auch bei leeren Tagen zuverlässig angezeigt
- In den Kacheln steht weiterhin der Name wie Flüssigkeit, Essen, Fieber usw.
- Hauptwert kann weiterhin „Keine“ anzeigen
- Kleine Statuszeile unten bleibt klein
- Nur CSS geändert


## Änderungen in 1.0.53

- Kachel-Überschrift größer und dominanter gemacht
- Hauptwert wie „Keine“ kleiner und dezenter darunter gesetzt
- Statuszeile unten bleibt klein
- Nur CSS geändert


## Änderungen in 1.0.56-test

- Symptom-Foto-Testversion sauber neu auf Basis von 1.0.53 aufgebaut
- Kein `python-multipart`, kein FormData-Upload, dadurch weniger Build-/Runtime-Risiko in HA OS
- Upload läuft über JSON/Base64 an `/api/uploads/json`
- Foto-Button im normalen Symptome-Bereich und in der Symptome-Schnelleingabe
- Heutige Einträge sollten wieder normal geladen werden, da die Version auf der stabilen 1.0.53 basiert
- Bilder werden unter `/data/uploads` gespeichert und in `symptom_images` referenziert


## Änderungen in 1.0.57-test

- Symptom-Fotos öffnen jetzt in einem App-internen Popup
- Klick auf Bild öffnet nicht mehr Safari/externen Tab
- Großansicht mit dunklem Hintergrund und Schließen-Button ergänzt


## Änderungen in 1.0.58-test

- Historie- und Bearbeiten-Buttons bleiben bei Symptom-Einträgen mit Bildern rechts in der Aktionsspalte
- Bildvorschau bleibt links unter dem Symptomtext
- Layout der Kategorie-Zeilen mit Bildern korrigiert
- Nur CSS geändert


## Änderungen in 1.0.59-test

- Bildlayout in der Tagesübersicht überarbeitet
- Statt großem Bildstreifen wird jetzt eine kompakte Foto-Zeile angezeigt
- Miniaturbild plus „1 Foto“ bzw. „x Fotos“
- Historie- und Bearbeiten-Buttons bleiben rechts
- Detailansicht zeigt weiterhin die größeren Bildvorschauen


## Änderungen in 1.0.60-test

- Fotoanzeige in der Tagesübersicht weiter beruhigt
- Statt Miniaturbild gibt es jetzt einen dezenten Anhang-Chip „📷 1 Foto ansehen“ bzw. „x Fotos ansehen“
- Historie- und Bearbeiten-Buttons bleiben rechts
- Große Bildvorschau bleibt in Detailansicht und Popup erhalten


## Änderungen in 1.0.61-test

- Foto-Chip in der Tagesübersicht repariert
- „1 Foto ansehen“ bleibt jetzt einzeilig
- Umbruch im Foto-Chip verhindert
- Spaltenabstand der Symptom-Zeile mit Foto angepasst
- Nur CSS geändert


## Änderungen in 1.0.62-test

- Mehr Abstand zwischen Uhrzeit und Symptomtext bei Einträgen mit Foto
- Uhrzeit-Spalte leicht verbreitert
- Foto-Chip bleibt einzeilig
- Nur CSS geändert


## Änderungen in 1.0.63-test

- Fotos können jetzt auch beim nachträglichen Bearbeiten eines Symptom-Eintrags hinzugefügt werden
- Vorhandene Symptom-Fotos werden im Bearbeiten-Popup angezeigt
- Fotos können dort entfernt oder ergänzt werden
- Speichern aktualisiert `symptom_images` am bestehenden Eintrag


## Änderungen in 1.0.64-test

- Untere Statuszeile in den Tageskacheln entfernt
- Hinweise wie „Keine Angabe“, „Nicht eingetragen“ usw. werden dort nicht mehr angezeigt
- Kacheln zeigen nur noch Icon, Überschrift und Hauptwert
- Nur CSS geändert


## Änderungen in 1.0.65-test

- Abstand zwischen Uhrzeit und Text jetzt für alle Kategorie-Einträge vergrößert
- Vorher war der bessere Abstand nur bei Einträgen mit Foto aktiv
- Uhrzeit-Spalte allgemein leicht verbreitert
- Foto-Chip bleibt unverändert einzeilig
- Nur CSS geändert


## Änderungen in 1.0.66-test

- Hinweis „1 Foto“ bzw. „x Fotos“ aus dem Symptomtext entfernt
- Foto-Anhang bleibt weiterhin als eigener Chip darunter sichtbar
- Bild-Popup bleibt unverändert
- Nur JavaScript minimal geändert


## Änderungen in 1.0.67-test

- Backup erweitert auf ZIP-Backup
- ZIP enthält `diary.json`, `backup-info.json` und den kompletten Ordner `uploads/` mit Symptom-Bildern
- Backup-Button nutzt jetzt `/api/backup`
- Restore kann neue ZIP-Backups mit Bildern importieren
- Alte JSON-Backups bleiben weiterhin importierbar


## Änderungen in 1.0.68-test

- Beim Löschen eines Eintrags werden zugehörige Symptom-Bilddateien aus `/data/uploads` entfernt
- Beim Bearbeiten werden entfernte Bilder ebenfalls physisch gelöscht
- Der gelöschte Eintrag bleibt weiterhin als Historien-Snapshot erhalten, aber ohne die Bilddateien auf der Platte zu behalten


## Änderungen in 1.0.70-test

- Defekte 1.0.69 repariert, neu auf Basis der funktionierenden 1.0.68 aufgebaut
- `renderCompactSymptomImages` bleibt korrekt definiert
- Bild-Popup als Galerie mit Vor/Zurück und Miniaturleiste ergänzt
- Teilen-Button ergänzt


## Änderungen in 1.0.73-test

- Defekte 1.0.72 verworfen und sauber auf Basis der funktionierenden 1.0.70 neu aufgebaut
- Teilen-Button aus der Bildgalerie entfernt
- Galerie bleibt erhalten: Vor/Zurück, Miniaturleiste und Zähler
- `renderCompactSymptomImages` bleibt korrekt definiert
- Mehr Abstand innerhalb der Tageskacheln zwischen Icon, Überschrift und Hauptwert


## Änderungen in 1.0.74-test

- Neuer Menüpunkt `Speicherbelegung`
- Backend-Endpunkt `/api/storage` ergänzt
- Anzeige von Gesamtgröße, Datenbankgröße, Bildergröße und sonstigen Dateien
- Anzeige von Anzahl Einträge, Bild-Verweisen und Upload-Dateien
- Button zum Aktualisieren und Backup erstellen ergänzt
