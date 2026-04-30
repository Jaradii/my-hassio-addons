# Gesundheitstracker Home Assistant Add-on

Version 2.2.6

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
app_title: "Gesundheitstracker"
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
- „Gesundheitstracker“-Titel in der App-Ansicht entfernt
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


## Änderungen in 1.4.4

- Neuer-Eintrag-Button folgt jetzt zuverlässig dem gewählten Farbtheme
- Alte Liquid-Glass/Override-Regeln für diesen Button endgültig überschrieben
- Darkmode-Themefarben werden ebenfalls korrekt übernommen


## Änderungen in 1.4.5

- Kopfzeile im „Neuer Eintrag“-Popup ist nicht mehr sticky
- „Neuer Eintrag“ scrollt normal mit dem Formularinhalt
- Oben mehr Safe-Area-Abstand, damit nichts abgeschnitten wird
- Profil-/Backup-Köpfe ebenfalls entschärft


## Änderungen in 1.5.0

- Temperaturfeld hat jetzt zusätzlich einen Schieberegler
- Temperatur-Slider synchronisiert sich mit dem Zahlenfeld
- Slider zeigt farbliche Temperaturbereiche
- Stimmung ist jetzt eine Icon-Auswahl statt Dropdown
- Stimmung kann per Tippen gewählt oder wieder abgewählt werden


## Änderungen in 1.5.1

- Home-Assistant-Benutzer wird bei neuen Einträgen automatisch gespeichert
- Beim Bearbeiten wird der zuletzt bearbeitende Benutzer gespeichert
- Erweiterte Einzelansicht zeigt „Erstellt von“ und, falls abweichend, „Bearbeitet von“
- Alte Einträge ohne Benutzerinformationen werden als „Unbekannt“ angezeigt


## Änderungen in 1.5.2

- Button „Erweitern“ heißt jetzt „Details“
- Temperaturfeld formatiert beim Tippen nicht mehr sofort auf eine Nachkommastelle
- Cursor springt beim Eingeben der Temperatur nicht mehr hinter das Komma
- Temperatur wird erst beim Verlassen des Feldes oder über den Slider sauber auf eine Nachkommastelle formatiert


## Änderungen in 1.5.3

- Temperatur-Kachel zeigt keinen zusätzlichen Temperaturtext mehr unter dem Wert
- Essen/Schlaf-Kachel zeigt jetzt Teller- und Schlaf-Icon
- Textfelder für Medikamente, Essen, Schlaf, Windel/Toilette und Notizen optisch verbessert
- Diese Textfelder haben jetzt Icons und bessere Platzhaltertexte


## Änderungen in 1.5.4

- Min/Max-Text in der Temperatur-Kachel wiederhergestellt
- Zusätzliche Temperatur-Pill oben rechts in der Tagesübersicht entfernt
- Zusammengefasste Tagesfelder wie Medikamente, Essen, Schlaf, Windel/Toilette und Notizen schöner gestaltet
- Diese Felder haben jetzt Icons, Uhrzeit-Badges und ein saubereres Kartenlayout


## Änderungen in 1.6.0

- Weitere Farbthemes hinzugefügt
- Neues Theme: Dunkles Slate
- Neue Themes: Ocean, Forest, Sand, Berry, Monochrom
- Alle neuen Themes unterstützen Light- und Darkmode


## Änderungen in 1.6.1

- „Bearbeitet von“ wird jetzt auch angezeigt, wenn dieselbe Person den Eintrag später bearbeitet hat
- Neue Einträge bekommen exakt gleiche Werte für `created_at` und `updated_at`, damit sie nicht fälschlich als bearbeitet gelten
- Die Bearbeitet-Zeile wird in der Detailansicht optisch etwas klarer getrennt


## Änderungen in 1.7.0

- Audit-Historie pro Eintrag ergänzt
- Neue Einträge speichern ein `created`-Historienereignis
- Bearbeitungen speichern ein `updated`-Historienereignis mit geänderten Feldern
- Löschungen werden als Snapshot in `deleted_entries` mit `deleted`-Historienereignis archiviert
- Detailansicht enthält jetzt einen aufklappbaren Bereich „Historie“
- Bestehende alte Einträge erhalten automatisch eine einfache Fallback-Historie aus created_at/updated_at


## Änderungen in 1.7.1

- Historie wird als echte Liste aus `entry.history` angezeigt
- Alte Einträge ohne Historie werden beim Lesen mit einem persistenten Created-Ereignis versehen
- Bei Bearbeitungen wird die vorhandene Historie zuverlässiger erhalten und erweitert
- Historie-Button ist jetzt viel kleiner und subtiler
- Auf Smartphone wird die Historie primär als Icon mit Zähler angezeigt


## Änderungen in 1.7.2

- Separate Zeilen „Erstellt von“ und „Bearbeitet von“ entfernt
- Alle Erstellungs- und Bearbeitungsdaten stehen jetzt nur noch in der Historie
- Historie öffnet als kompakte Liste
- Jedes Historienereignis steht in einer eigenen Zeile
- Geänderte Felder werden innerhalb der jeweiligen Historienzeile angezeigt


## Änderungen in 1.7.3

- App in „Gesundheitstracker“ umbenannt
- Add-on-Name, Panel-Titel, App-Titel und Standardtitel angepasst


## Änderungen in 1.7.4

- Symptom-Auswahl im „Neuer Eintrag“-Popup als 3-Spalten-Grid gestaltet
- Schrift in den Symptom-Chips verkleinert
- Icons und Texte gleichmäßiger ausgerichtet
- Drei Symptome passen nebeneinander auf normale Smartphone-Breite
- Sehr schmale Displays wechseln auf 2 Spalten


## Änderungen in 1.7.5

- Kreise/Hintergründe um Symptom-Icons entfernt
- Kreise/Hintergründe um Detail-Icons entfernt
- Icons bleiben sichtbar, aber ohne Badge-Fläche


## Änderungen in 1.7.6

- Animationen verlangsamt und weicher gestaltet
- Neuer-Eintrag-Popup öffnet sichtbar sanfter
- Profil/Backup-Dialoge öffnen weicher
- Toast-Meldungen blenden angenehmer ein
- Details/Historie animieren subtil beim Aufklappen
- Tageskacheln erscheinen mit leichtem Stagger-Effekt
- Auswahl von Stimmung und Symptomen hat dezentes Feedback
- `prefers-reduced-motion` wird respektiert


## Änderungen in 1.7.7

- Flackern der Tageskacheln beim Öffnen von Details behoben
- Tageskacheln animieren nicht mehr bei jedem Re-Render
- Details und Historie öffnen weiterhin sanft
- Eintragsformular hat jetzt eine Schließanimation
- Profil- und Backup-Dialoge haben jetzt eine Schließanimation
- Öffnungsanimationen wurden etwas entschärft, damit sie stabiler wirken


## Änderungen in 1.7.8

- Details öffnen jetzt ohne kompletten Re-Render der Tagesübersicht
- Tageskacheln werden beim Öffnen von Details nicht mehr neu aufgebaut
- Dadurch wird das Zucken/Flackern der Übersicht deutlich reduziert
- Nur der Detailbereich selbst animiert beim Einblenden


## Änderungen in 1.7.9

- Öffnen und Schließen des „Neuer Eintrag“-Popups verwenden jetzt dieselbe Dauer
- Öffnen und Schließen verwenden dieselbe Bewegungskurve
- Öffnen bewegt sich von unten nach oben
- Schließen bewegt sich von oben nach unten
- Opacity, Skalierung und Backdrop-Blur sind symmetrisch abgestimmt


## Änderungen in 1.8.0

- Historie speichert bei neuen Bearbeitungen jetzt detaillierte Vorher/Nachher-Werte
- Historie zeigt pro geändertem Feld den alten und neuen Wert
- Alte Historieneinträge ohne Detailwerte bleiben kompatibel und zeigen weiterhin die geänderten Felder
- Symptom-Auswahl ist deutlicher markiert
- Ausgewählte Symptome bekommen eine stärkere Hervorhebung und ein Häkchen


## Änderungen in 1.8.1

- Desktop-Layout nutzt mehr Breite
- Smartphone-Layout bleibt unverändert
- Tageskacheln auf Desktop in einer breiteren 6-Spalten-Ansicht
- Details, Historie und zusammengefasste Tagesfelder sind auf Desktop übersichtlicher angeordnet
- Neuer-Eintrag-Popup ist auf Desktop breiter
- Symptom-Auswahl nutzt auf Desktop mehr Spalten


## Änderungen in 1.8.2

- Ausgewählte Stimmung zeigt jetzt ebenfalls ein Häkchen
- Stimmungsauswahl ist optisch an die Symptomauswahl angepasst
- Aktive Stimmung wird deutlicher hervorgehoben


## Änderungen in 1.8.3

- Tageskacheln sind jetzt klickbare Schnellaktionen
- Klick auf Flüssigkeit öffnet direkt einen neuen Eintrag mit Fokus auf Flüssigkeit
- Klick auf Temperatur fokussiert das Temperaturfeld
- Klick auf Stimmung, Symptome, Medikamente und Essen/Schlaf springt zum passenden Bereich
- Kacheln zeigen ein kleines Plus als Hinweis auf die Schnellaktion


## Änderungen in 1.9.1

- Rollback auf die letzte stabile Version vor den Mini-Popups
- Die kaputte Schnellaktions-Mini-Popup-Änderung aus 1.9.0 wurde entfernt
- Tageskacheln öffnen wieder das normale Eintragsformular mit Fokus auf den passenden Bereich


## Änderungen in 1.9.2

- Kachel-Schnellaktionen öffnen jetzt eigene kleine Mini-Popups
- Das vollständige Neuer-Eintrag-Formular bleibt unverändert
- Flüssigkeit, Temperatur, Stimmung, Symptome, Medikamente und Essen/Schlaf haben jeweils eigene reduzierte Eingaben
- Mini-Popups speichern direkt einen neuen Eintrag mit nur dem jeweiligen Wert


## Änderungen in 1.9.3

- Fehler aus 1.9.2 behoben: Quick-Popup-HTML fehlte, obwohl JavaScript es verwenden wollte
- Quick-Popup-Struktur korrekt in die Seite eingefügt
- Quick-Popup-Eventlistener zusätzlich defensiv abgesichert
- Kachel-Schnellaktionen öffnen weiterhin kleine spezifische Popups


## Änderungen in 1.9.4

- Mittlere Datumsfläche oben ist jetzt klickbar
- Beim Tippen auf das Datum öffnet sich der native Datepicker
- Nach Auswahl springt die Tagesübersicht direkt auf den gewählten Tag
- Pfeile und Heute-Button bleiben unverändert nutzbar


## Änderungen in 1.9.5

- Datepicker-Öffnung auf iOS/Home-Assistant-WebView robuster umgesetzt
- Das native Date-Feld liegt jetzt als transparente klickbare Ebene über der Datumsfläche
- `pointer-events: none` für den Datepicker wurde entfernt
- Datumsfläche ist kein Button mehr mit verschachteltem Input, sondern ein sauberer Container


## Änderungen in 2.0.0

- Nativer Datepicker durch eigenen Kalender ersetzt
- Tage mit Einträgen werden mit einem kleinen Punkt markiert
- Der aktuell ausgewählte Tag wird hervorgehoben
- Der heutige Tag bekommt eine dezente Markierung
- Monatsnavigation und Heute-Button im Kalender ergänzt


## Änderungen in 2.1.1

- Rollback auf Version 2.2.6 vor der Apple-Watch/Quick-API-Erweiterung
- Quick-API-Endpunkte und Apple-Watch-Skriptbeispiele entfernt
- Eigener Kalender mit Punkten für Tage mit Einträgen bleibt erhalten


## Änderungen in 2.2.0

- Nachträgliche Einträge möglich: Datum und Uhrzeit sind im Eintragsformular wählbar
- Datum und Uhrzeit bestehender Einträge können beim Bearbeiten geändert werden
- Backup-Icon geändert
- Kalender verwendet immer ein 6-Wochen-Raster und bleibt dadurch pro Monat gleich groß
- Symptome haben jetzt eine Intensität: leicht, mittel oder stark
- Symptom-Intensitäten werden gespeichert, angezeigt und in der Historie berücksichtigt


## Änderungen in 2.2.1

- Symptom-Intensitätsauswahl sichtbar gemacht
- Intensität erscheint jetzt direkt unter einem ausgewählten Symptom
- Auf Smartphone wird die Symptom-Auswahl auf 2 Spalten reduziert, damit die Intensität lesbar bleibt


## Änderungen in 2.2.2

- Symptom-Intensität ist jetzt auch im kleinen Symptome-Popup der Symptom-Kachel verfügbar
- Intensität erscheint dort direkt unter ausgewählten Symptomen
- Die im kleinen Popup gewählte Intensität wird mitgespeichert


## Änderungen in 2.2.3

- Uhrzeitfeld von nativem `type=time` auf WebView-sicheres Textfeld umgestellt
- Uhrzeit wird automatisch als HH:MM formatiert und validiert
- Speichern-/Aktionsbuttons werden begrenzt und ragen nicht mehr aus dem Popup heraus
- Symptom-Intensität wird jetzt immer angezeigt, nicht erst nach Auswahl
- Intensität ist im großen Eintrag-Popup und im kleinen Symptome-Popup dauerhaft sichtbar


## Änderungen in 2.2.4

- Intensitäts-Auswahlmenüs werden jetzt dauerhaft sichtbar erzwungen
- Alte CSS-Regeln, die die Intensität erst nach Auswahl angezeigt haben, werden überschrieben
- Gilt für das große Eintrag-Popup und das kleine Symptome-Popup


## Änderungen in 2.2.5

- Backup-Icon auf Diskette geändert: 💾


## Änderungen in 2.2.6

- Klick auf das Uhrzeitfeld öffnet jetzt einen eigenen Timepicker
- Kein nativer `type=time` Picker, damit Home Assistant/iOS nicht abstürzt
- Timepicker mit separater Stunden- und Minuten-Auswahl
- Button „Jetzt“ ergänzt
- Button „Übernehmen“ übernimmt die gewählte Uhrzeit ins Eintragsformular
