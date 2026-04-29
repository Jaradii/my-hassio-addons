# KindGesund Home Assistant Add-on

Tägliches Gesundheits-Tagebuch fürs Kind als Home-Assistant-Add-on mit Ingress.

## Funktionen

- Profil für ein Kind
- Temperatur, Symptome, Medikamente, Flüssigkeit, Essen, Schlaf, Windel/Toilette und Notizen
- Verlauf mit Suche und Datumfilter
- Übersicht mit Statistiken
- JSON Export und Import
- Optionaler Darkmode über Add-on-Option `dark_mode`
- Optionaler lokaler PIN-Schutz über Add-on-Optionen
- Speicherung in `/data/diary.json` innerhalb des Add-ons

## Installation

1. Ordner `kindgesund` in dein Home-Assistant-Add-on-Repository kopieren.
2. Repository in Home Assistant unter Add-on Store hinzufügen.
3. Add-on Store neu laden.
4. Add-on `KindGesund` installieren.
5. Starten.
6. Optional: Seitenleisten-Anzeige aktivieren.

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
