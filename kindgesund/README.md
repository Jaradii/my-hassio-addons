# KindGesund Home Assistant Add-on

Version 1.4.3

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


## Änderungen in 1.1.7

- „Neuer Eintrag“ ist nicht mehr als Floating-Button umgesetzt
- Neue echte Bottom-Menüleiste mit Button darin
- Alte Floating-Regeln deaktiviert
- Profil und Backup oben als Icons
- Profil und Backup öffnen als mittige animierte Dialoge


## Änderungen in 1.1.8

- „Neuer Eintrag“ sitzt jetzt als schwebendes Dock oberhalb des unteren Bildschirmrands
- Keine vollbreite untere Leiste mehr
- Button klebt nicht direkt am Rand


## Änderungen in 1.1.9

- Dock-Button aus dem scrollenden `<main>` herausgelöst
- problematische CSS-Containment-Regel entfernt
- Dock liegt jetzt direkt unter `body` als feste Ebene


## Änderungen in 1.1.10

- Dock-Button auf Smartphones weiter nach unten gesetzt
- Desktop-Position bleibt unverändert
- Seitliches Scrollen erneut abgesichert
- Fixed-Layer erzeugen keinen horizontalen Scrollbereich mehr


## Änderungen in 1.2.0

- Eintragsformular vollständig überarbeitet
- Dock-Button wird ausgeblendet, sobald Formular, Profil oder Backup offen ist
- Speichern-Button liegt nicht mehr hinter dem Dock
- Formular nutzt Safe-Area-Abstände und wird oben nicht abgeschnitten
- Profil/Backup bleiben mittige Dialoge mit Animation
- Seitliches Scrollen erneut hart abgesichert


## Änderungen in 1.2.1

- Hintergründe/Balken bei Popup-Überschriften entfernt
- Betrifft Neuer Eintrag, Profil und Backup
- Layout und Animationen aus 1.2.0 bleiben erhalten


## Änderungen in 1.2.2

- Geburtsdatum-Feld im Profil läuft nicht mehr über die Seite hinaus
- Date-Inputs für iOS/WebView begrenzt
- Profilfelder bleiben innerhalb des Dialogs


## Änderungen in 1.2.3

- Alle sichtbaren Felder, Karten, Buttons, Dialoge, Chips und Leisten auf 10px Kantenradius gesetzt
- Pillenförmige Buttons und Tags ebenfalls auf 10px reduziert
- Checkboxen bleiben technisch nutzbar und bekommen nur 3px Radius


## Änderungen in 1.3.0

- Tagesübersicht zeigt nicht mehr jeden Eintrag einzeln
- Werte eines Tages werden zusammengefasst
- Flüssigkeit wird aufsummiert
- Symptome werden gezählt und zusammengefasst
- Medikamente, Essen, Schlaf, Windel/Toilette und Notizen werden als Tagesblöcke zusammengeführt
- Erweitern-Button zeigt die genauen Einzelzeiten und Mengen
- Eintrags-Popup öffnet mit stärkerer Animation


## Änderungen in 1.3.1

- Tagesübersicht als quadratische Kacheln umgesetzt
- Kacheln enthalten Icons
- Smartphone zeigt die Kacheln kompakter, primär mit Icons und Werten
- Desktop zeigt Icons plus Text
- Speichern-Button im Eintragsformular ist jetzt optisch so groß wie „Neuer Eintrag“
- Neuer-Eintrag-Dock sitzt auf Smartphones weiter unten


## Änderungen in 1.3.2

- Löschen-Button beim Bearbeiten ist nicht mehr transparent
- Löschen-Button hat dieselbe Größe wie Speichern
- Löschen-Button ist vollflächig rot dargestellt


## Änderungen in 1.3.3

- Separater Profilblock oben entfernt
- Aktives Profil steht jetzt oben unter „Gesundheitstagebuch“
- „KindGesund“-Titel in der App-Ansicht entfernt
- Einzelne Einträge in der erweiterten Übersicht haben jetzt Bearbeiten und Löschen


## Änderungen in 1.3.4

- Toast/Speicher-Meldung auf gleiche Breite und Höhe wie die Hauptbuttons gesetzt
- Farbschema auf dunkles Babyblau umgestellt
- Akzente, Buttons, Kacheln, Tags und Karten farblich vereinheitlicht


## Änderungen in 1.3.5

- Speicher-Meldung/Toast verdeckt den Neuer-Eintrag-Button nicht mehr
- Toast erscheint kompakter oberhalb des Buttons
- Toast verschwindet vollständig über `.hidden`


## Änderungen in 1.3.6

- Speicher-Meldung wieder als dezenter Toast statt Button-Stil
- Transparenter Hintergrund mit Blur
- Kleiner als die Buttons
- Maximale Breite an Hauptbuttons orientiert


## Änderungen in 1.3.7

- „Neuer Eintrag“-Button im iOS-Liquid-Glass-Stil gestaltet
- Glas-Effekt mit Blur, Reflex, heller Kante und Tiefenschatten
- Darkmode-Variante mit dunklem Babyblau-Schimmer ergänzt


## Änderungen in 1.3.8

- Temperatur/Fieber bekommt je nach Höhe eigene Farben
- Bis 37,5 °C grün
- Ab 37,6 °C gelb
- Ab 38,5 °C orange
- Ab 39,0 °C rot
- Temperatur-Kachel und Temperatur-Pill verwenden diese Farben


## Änderungen in 1.4.0

- Farbthemes eingebaut
- Theme-Auswahl im Profil-Popup ergänzt
- Themes werden im Browser gespeichert und sofort angewendet
- Enthaltene Themes: Dunkles Babyblau, Sanftes Mint, Lavendel, Pfirsich, Rosa, Schieferblau
- Darkmode funktioniert weiterhin zusammen mit jedem Theme


## Änderungen in 1.4.1

- Popup-Hintergründe reagieren jetzt korrekt auf das gewählte Farbtheme
- Neuer-Eintrag-Button optisch beruhigt und an das Theme angepasst
- Speichern-Button und Löschen-Button im Eintragsformular vereinheitlicht
- Profil-/Backup-Buttons und Detail-Buttons an denselben Stil angepasst
- Karten, Eingaben und Sektionen nutzen konsistente Theme-Flächen


## Änderungen in 1.4.2

- Gesamtes Design flacher und ruhiger gestaltet
- Künstliche 3D-, Gloss- und Tiefeneffekte entfernt
- Buttons, Karten, Popups und Eingaben konsistenter im Stil
- Symptome haben jetzt Icons
- Symptom-Icons erscheinen in der Übersicht und in den Detail-Einträgen


## Änderungen in 1.4.3

- Symptom-Icons jetzt auch im „Neuer Eintrag“-Popup sichtbar
- Symptom-Auswahlchips optisch an Übersicht und Details angepasst
