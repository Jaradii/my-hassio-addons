# KindGesund Home Assistant Add-on

Version 1.1.5

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


## Änderungen in 1.1.3

- Untere Menüleiste entfernt
- Unten bleibt nur noch ein fester Button „Neuer Eintrag“
- Profil und Backup sind jetzt über Icons oben erreichbar
- Floating-Button bleibt fest unten verankert


## Änderungen in 1.1.4

- „Neuer Eintrag“ ist jetzt wirklich fest unten mittig am Bildschirm verankert
- Die Tagesübersicht scrollt hinter dem Button weiter
- Profil und Backup öffnen als Fullscreen-Ansicht
- Kein Scrollen in einem kleinen unteren Drittel mehr


## Änderungen in 1.1.5

- „Neuer Eintrag“ ist ein echter Floating-Button unten mittig und scrollt nicht mit
- Profil und Backup sind wieder mittige Dialoge statt Fullscreen
- Dialoge sind größer, zentriert und animiert
- Bottom-Sheet öffnet weicher
