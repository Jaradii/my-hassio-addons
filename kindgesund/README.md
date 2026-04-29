# KindGesund Home Assistant Add-on

Version 1.1.2

Mobile, tageszentrierte Gesundheits-Tagebuch-App für Home Assistant Ingress.

## Änderungen in 1.1.0

- Tagesansicht statt Dashboard
- Datum oben umschaltbar
- Keine letzten Einträge auf der Startseite
- Neuer Eintrag als Bottom-Sheet
- Uhrzeit wird automatisch beim Speichern gesetzt
- Kompakteres, App-ähnlicheres UI
- Optionaler Darkmode

## Optionen

```yaml
app_title: "KindGesund"
child_name: "Kind"
fever_threshold: 38.5
high_fever_threshold: 39.5
dark_mode: false
pin_enabled: false
pin_code: ""
```

## Speicherung

Die Daten liegen im Add-on unter:

```txt
/data/diary.json
```


## Änderungen in 1.1.2

- Tagesansicht aus 1.1.0 beibehalten
- Horizontales Scrollen in der Home-Assistant-App korrigiert
- Lange Texte und Karten umbrechen jetzt sauber
