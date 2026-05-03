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
- Basis ist die funktionierende Version 1.1.12


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


## Änderungen in 1.0.75-test

- Menüpunkt von `Speicherbelegung` auf `Speicher` gekürzt
- Icon im Menü auf Kreisdiagramm-Symbol geändert
- Backup-erstellen Button aus der Speicheransicht entfernt
- Klick auf `Bilder` in der Speicheransicht öffnet eine Galerie aller gespeicherten Upload-Bilder
- Bilder aus der Speicher-Galerie öffnen in der bestehenden Bild-Galerie


## Änderungen in 1.0.76-test

- Klick auf `Bilder` in der Speicheransicht öffnet jetzt ein eigenes Bilderverwaltungs-Popup
- Bilder können dort markiert werden
- Markierte Bilder können gelöscht werden
- Beim Löschen werden die Dateien aus `/data/uploads` entfernt und Bild-Verweise aus Einträgen bereinigt
- Großansicht der Bilder läuft weiterhin über die bestehende Galerie


## Änderungen in 1.0.77-test

- Löschen von Bildern über `Speicher → Bilder` repariert
- Bild-Verweise werden robuster aus aktiven Einträgen und gelöschten Historien-Einträgen entfernt
- Nach dem Löschen werden App-Daten und Speicheransicht neu geladen
- Foto-Chip zeigt danach die korrekte Anzahl, z. B. 2 statt 3 Fotos
- Gelöschte Bilder sollten nicht mehr als kaputte Vorschau/Fragezeichen erscheinen


## Änderungen in 1.0.78-test

- Icon des Menüpunktes `Speicher` auf 📊 geändert
- Sonst keine funktionalen Änderungen


## Änderungen in 1.0.79-test

- Markieren-Feld in der Bilderverwaltung als Overlay oben rechts auf das Bild gesetzt
- Separate Markieren-Zeile unter dem Bild entfernt
- Markierte Bilder bekommen eine dezente Umrandung
- Sonst keine funktionalen Änderungen


## Änderungen in 1.0.80-test

- Neuer Menüpunkt `Infekt`
- Infekt-Zeitraum starten, beenden und zurücksetzen
- Infekt-Status mit Statistik: Einträge, Maximaltemperatur, Symptome, Bilder
- Arztbericht aus dem Infekt-Zeitraum erstellen
- Arztbericht als Text markieren oder als TXT speichern
- Bestehende Einträge werden nicht verändert; der Infekt-Zeitraum wird lokal in der App gespeichert


## Änderungen in 1.0.81-test

- Infekt-Steuerung auf einen einzigen Button umgebaut
- Wenn kein Infekt läuft: `Infekt starten`
- Wenn ein Infekt läuft: roter Button `Infekt stoppen`
- Stop-Logik repariert: aktiver Infekt wird sauber beendet und der Zeitraum bleibt für den Arztbericht in den Feldern stehen
- Alte Buttons `Infekt beenden` und `Zurücksetzen` entfernt


## Änderungen in 1.0.82-test

- Infekt-Status wird jetzt serverseitig in `diary.json` gespeichert
- Aktiver Infekt ist nach Home-Assistant-Neustart weiterhin vorhanden
- Aktiver Infekt ist auf allen Geräten sichtbar
- Infekt-Status ist im Backup enthalten
- Gestoppte Infekte werden in `illness_history` gespeichert
- Browser-`localStorage` ist für den laufenden Infekt nicht mehr maßgeblich


## Änderungen in 1.0.83-test

- Infekt-Modus konzeptionell verbessert
- Sichtbarer Infekt-Banner auf der Hauptseite ergänzt
- Neue Einträge bekommen automatisch eine `illness_id`, wenn ein aktiver Infekt läuft
- Backend ordnet Einträge zusätzlich serverseitig dem aktiven Infekt zu
- Infekt-Übersicht mit Tagesverlauf, Maximaltemperatur, Medikamenten und Bildern ergänzt
- Arztbericht mit verständlicher Kurz-Zusammenfassung verbessert


## Änderungen in 1.0.84-test

- Infekt-Liste in der Infekt-Ansicht ergänzt
- Aktive und abgeschlossene Infekte werden angezeigt
- Infekte können ausgewählt werden, um die Übersicht umzuschalten
- Infekte können bearbeitet werden: Titel, Startdatum, Enddatum
- Bericht kann direkt aus der Liste oder aus dem Bearbeiten-Popup erzeugt werden
- Backend-Endpunkt `PUT /api/illness/{illness_id}` ergänzt


## Änderungen in 1.0.85-test

- Direkter Infekt-Button `🩺` oben in der Kopfzeile ergänzt
- Infekt-Menü ist nicht mehr nur über das Drei-Punkt-Menü erreichbar
- Infekt-Liste hat jetzt pro Infekt einen `Löschen`-Button
- Gelöschte Infekte entfernen nur die Infekt-Zuordnung, die Einträge bleiben erhalten
- Backend-Endpunkt `DELETE /api/illness/{illness_id}` ergänzt


## Änderungen in 1.0.86-test

- Neuer Menüpunkt `Suche`
- Einfache globale Volltextsuche ohne Datums- oder Kategoriepflicht
- Durchsucht Symptome, Notizen, Medikamente, Essen, Schlaf, Windel/Toilette, Stimmung, Temperatur, Flüssigkeit, Bilder und Infekt-Namen
- Treffer werden nach Tagen gruppiert
- Treffer können geöffnet, bearbeitet oder in der Historie angesehen werden


## Änderungen in 1.0.87-test

- Suche aus dem Drei-Punkt-Menü entfernt
- Suche als eigener Button `🔎` oben in der Kopfzeile ergänzt
- Auswertung bleibt im Drei-Punkt-Menü, bekommt aber das Statistik-Icon `📈`
- Volltextsuche selbst bleibt unverändert


## Änderungen in 1.0.88-test

- `Infekt` aus dem Drei-Punkt-Menü entfernt
- Infekt bleibt über den direkten Kopfzeilen-Button `🩺` erreichbar
- Redundantes Verlauf-/Übersichts-Feld unter den Infekt-Einstellungen entfernt
- Infekt-Liste bleibt als eigentliche Verlauf/Historie erhalten


## Änderungen in 1.0.89-test

- Beim Starten eines neuen Infekts wird jetzt immer nach einer Bezeichnung gefragt
- Ohne eingegebenen Namen wird kein Infekt gestartet
- Der eingegebene Name wird in das Bezeichnungsfeld übernommen


## Änderungen in 1.0.90-test

- Bezeichnungsfeld aus der Infekt-Startansicht entfernt
- Name wird weiterhin beim Starten per Abfrage eingegeben
- Beim Stoppen eines Infekts wird ein eventuell noch vorhandenes Bezeichnungsfeld geleert
- Bearbeiten-Popup behält weiterhin das Bezeichnungsfeld zum nachträglichen Umbenennen


## Änderungen in 1.0.91-test

- Namensabfrage beim Starten eines Infekts zeigt jetzt immer ein leeres Eingabefeld
- Der Name des letzten Infekts wird nicht mehr als Vorschlag übernommen
- Ohne Eingabe wird weiterhin kein Infekt gestartet


## Änderungen in 1.0.92-test

- Startdatum und Enddatum aus der normalen Infekt-Startansicht entfernt
- Beim Starten wird das Startdatum automatisch auf heute gesetzt
- Beim Stoppen wird das Enddatum automatisch auf heute gesetzt
- Im Bearbeiten-Popup bleiben Startdatum und Enddatum erhalten, damit man später korrigieren kann


## Änderungen in 1.0.93-test

- Bei Flüssigkeit kann jetzt zusätzlich `wenig`, `mittel` oder `viel` getrunken ausgewählt werden
- Ergänzt im normalen Eintragsformular
- Ergänzt im Schnell-Eintrag Flüssigkeit
- Ergänzt beim Bearbeiten eines Flüssigkeits-Eintrags
- Anzeige, Historie, Auswertung, Export und Volltextsuche berücksichtigen die Einschätzung


## Änderungen in 1.0.94-test

- Trinkmenge wird jetzt als eigener Punkt neben der ml-Menge behandelt
- Tagesübersicht zeigt `Flüssigkeit` und `Trinkmenge` getrennt
- Historie führt `Trinkmenge` als eigenes Feld
- Auswertung und Export können `Trinkmenge` separat anzeigen
- Volltextsuche zeigt `Trinkmenge` separat im Treffertext


## Änderungen in 1.0.95-test

- `Trinkmenge` ist jetzt als eigener Punkt direkt bearbeitbar
- Bearbeiten-Sheet für `Trinkmenge` ergänzt
- Auswahl: Keine Einschätzung, Wenig, Mittel, Viel
- Historie zeigt Änderungen an `Trinkmenge` weiterhin als eigenes Feld


## Änderungen in 1.0.96-test

- Bearbeiten-Popup für `Trinkmenge` zeigt jetzt erzwungen ein Dropdown
- Auswahl: Keine Einschätzung, Wenig, Mittel, Viel
- Freies Textfeld für `Trinkmenge` wird nicht mehr gerendert


## Änderungen in 1.0.97-test

- Im Suche-Popup wurden die Buttons `Historie` und `Bearbeiten` entfernt
- Suchtreffer bleiben weiterhin antippbar und springen zum passenden Tag/Eintrag


## Änderungen in 1.0.98-test

- Datum in der Volltextsuche besser lesbar gemacht
- Suchtreffer-Gruppen zeigen jetzt ausgeschriebene Datumsüberschriften, z. B. `Montag, 03. Mai 2026`
- Darstellung stärker an die Auswertungsansicht angepasst


## Änderungen in 1.0.99-test

- Datumsformat in der Suche wieder auf `DD.MM.YYYY` zurückgestellt
- Datumsüberschrift in der Suche als eigener Balken gestaltet
- Optik stärker an die Auswertung angepasst


## Änderungen in 1.1.00-test

- Reihenfolge der Kopfzeilen-Buttons geändert
- Neue Reihenfolge: Infekt → Profil → Suche → Drei-Punkt-Menü
- Keine funktionalen Änderungen


## Änderungen in 1.1.01-test

- Infekt-Arztbericht komplett neu strukturiert
- Klare Kopfzeile mit Name, Infekt, Zeitraum und Erstellzeit
- Kurzzusammenfassung verbessert
- Tagesverlauf übersichtlicher gruppiert
- Separate Abschnitte für Temperatur, Symptome, Medikamente, Flüssigkeit/Trinkmenge und Beobachtungen
- Bericht bleibt als kopierbarer Text/TXT exportierbar


## Änderungen in 1.1.02-test

- TXT-Arztbericht repariert
- Bericht nutzt jetzt echte Zeilenumbrüche statt literalem `\\n`
- Abschnitte, Leerzeilen und Überschriften erscheinen in der TXT-Datei wieder strukturiert


## Änderungen in 1.1.03-test

- Neuer Button `HTML mit Bildern` im Infekt-Arztbericht
- HTML-Bericht enthält hochgeladene Fotos als echte Bilder
- Fotos erscheinen direkt bei den passenden Tagesverlauf-Einträgen und zusätzlich in einer Fotoübersicht
- HTML-Datei kann in Safari geöffnet und dort als PDF gesichert/gedruckt werden
- TXT-Bericht bleibt unverändert ohne Bilder


## Änderungen in 1.1.04-test

- HTML-Arztbericht mit Bildern repariert
- Bilder werden jetzt vor dem Speichern als Base64 direkt in die HTML-Datei eingebettet
- Dadurch sollten die Bilder auch beim lokalen Öffnen in Safari sichtbar sein
- Falls ein Bild nicht gelesen werden kann, bleibt der ursprüngliche Link als Fallback erhalten


## Änderungen in 1.1.05-test

- Druck-/PDF-Layout des HTML-Arztberichts verbessert
- Fotoblöcke werden beim Drucken/PDF-Speichern möglichst nicht mehr zwischen zwei Seiten getrennt
- Bilder werden im Druckmodus mit `object-fit: contain` dargestellt, damit sie nicht abgeschnitten werden
- Fotoübersicht druckt mit zwei Spalten und begrenzter Bildhöhe


## Änderungen in 1.1.06-test

- Große Bilder im Abschnitt `Fotos` des HTML-Arztberichts repariert
- Kleine Bilder im Tagesverlauf bleiben klein
- Fotoübersicht bekommt eigene Bildgrößen für Bildschirm und PDF/Druck
- Seitenumbruch-Schutz bleibt erhalten, ohne die große Fotoübersicht auszublenden


## Änderungen in 1.1.07-test

- PDF-Erzeugung aus dem HTML-Arztbericht für Safari/iOS robuster gemacht
- Fotoübersicht nutzt im Druckmodus kein CSS-Grid mehr, sondern einfache Bildblöcke
- Bilder bekommen explizite Klassen und Größenattribute
- Große Fotos werden für den PDF-Druck als normale Block-Bilder gerendert
- Hinweis im HTML-Bericht ergänzt, falls Safari Bilder erst verzögert in die Druckvorschau übernimmt


## Änderungen in 1.1.08-test

- Speicherverwaltung erkennt jetzt verwaiste Bilder, also Uploads ohne Eintragsverknüpfung
- Verwaiste Bilder können über `Speicher → Verwaiste Bilder → Anzeigen` geöffnet, markiert und gelöscht werden
- Auswertung zeigt kleine Diagramme für Temperaturverlauf und Flüssigkeit pro Tag
- Bei `Alle Einträge` werden Temperatur- und Flüssigkeitsdiagramm zusammen angezeigt, sofern Daten vorhanden sind
- Arztbericht nutzt jetzt `Bericht öffnen` als Hauptbutton für den HTML-Bericht mit Bildern
- TXT bleibt als Zusatzoption erhalten


## Änderungen in 1.1.09-test

- Arztbericht-Button von `Bericht öffnen` auf `Bericht exportieren` geändert
- Buttons `TXT speichern` und `Text markieren` aus dem Arztbericht-Dialog entfernt
- Diagramme aus der Auswertung wieder entfernt, da die bisherige Darstellung keinen ausreichenden Mehrwert hatte
- Verwaiste-Bilder-Funktion bleibt erhalten


## Änderungen in 1.1.10-test

- Ereignis-Markierungen ergänzt: Wichtig, Arzt-relevant, Kontrollieren
- Markierungen erscheinen als eigener Punkt in der Tagesübersicht
- Markierungen sind direkt bearbeitbar und werden in der Historie als eigenes Feld geführt
- Markierungen werden in Suche und Arztbericht berücksichtigt
- Arztbericht-Popup zeigt jetzt eine strukturierte Vorschau statt nur Rohtext
- Export des HTML-Berichts bleibt über `Bericht exportieren` erhalten


## Änderungen in 1.1.11-test

- Direkter `🏷️`-Button an jedem Eintrag in der Tagesübersicht ergänzt
- Darüber können Markierungen erstmalig gesetzt und später geändert werden
- Markierte Einträge zeigen ihre Markierungen zusätzlich direkt in der Zeile an


## Änderungen in 1.1.12-test

- Speichern von Markierungen repariert
- Fehler behoben: Markierungs-Popup hat kein freies Textfeld, der Speichern-Code wollte aber trotzdem `fieldEditValue` auslesen
- Markierungen sollten jetzt gespeichert, angezeigt und in der Historie geführt werden
