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
