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
- Basis ist die funktionierende Version 1.0.7
