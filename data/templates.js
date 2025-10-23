window.MARKDOWN_TEMPLATES = Object.freeze({
  categories: [
    {
      id: 'quickstart',
      label: 'Schnellstart',
      icon: 'lucide:zap',
      snippets: [
        {
          id: 'quick-meeting-notes',
          title: 'Meeting-Notizen',
          description: 'Kurzprotokoll mit Agenda, Entscheidungen und Aufgaben.',
          content: `# {{title}}

**Datum:** {{date}}
**Teilnehmende:** 

## Agenda
- Punkt 1
- Punkt 2
- Punkt 3

## Wichtige Entscheidungen
- Entscheidung 1 – Hintergrund/Begründung
- Entscheidung 2 – Verantwortlich: Name

## Aufgaben
- [ ] Aufgabe 1 (Owner, Deadline)
- [ ] Aufgabe 2 (Owner, Deadline)

## Notizen
- Kernpunkt oder Zitat
- Weitere Details`
        },
        {
          id: 'quick-status-update',
          title: 'Status-Update',
          description: 'Strukturiertes Update mit Highlights, Risiken und Nächsten Schritten.',
          content: `# {{title}}

**Stand:** {{date}}

## Highlights
- Wichtigster Fortschritt
- Weitere positive Entwicklung

## Herausforderungen & Risiken
- Risiko inklusive Auswirkung
- Hindernis & aktueller Umgang

## Nächste Schritte
1. Schritt 1 (Owner, Termin)
2. Schritt 2 (Owner, Termin)
3. Schritt 3 (Owner, Termin)`
        },
        {
          id: 'quick-project-brief',
          title: 'Projekt-Briefing',
          description: 'Komprimierte Übersicht über Ziel, Zeitplan und Verantwortlichkeiten.',
          content: `# {{title}}

**Letzte Aktualisierung:** {{date}}

## Ziel
- Kurzbeschreibung des Projektziels

## Hintergrund
- Kontext oder Problemstellung

## Zeitplan
- Phase 1 – Zeitraum & Ergebnis
- Phase 2 – Zeitraum & Ergebnis

## Verantwortlichkeiten
- Rolle A – Name, Aufgaben
- Rolle B – Name, Aufgaben

## Erfolgskriterien
- Messgröße 1
- Messgröße 2`
        },
        {
          id: 'quick-daily-standup',
          title: 'Daily Stand-up',
          description: 'Kurzbericht zu Gestern, Heute und Blockern für Teams.',
          content: `# {{title}}

**Datum:** {{date}}
**Team:**

## Gestern erledigt
- Aufgabe oder Ergebnis
- Wichtige Erkenntnis

## Heute geplant
- Aufgabe mit Ziel
- Abstimmungen

## Blocker
- Hindernis – benötigte Unterstützung
- Risiko – geplante Maßnahme`
        },
        {
          id: 'quick-project-kickoff',
          title: 'Kick-off Agenda',
          description: 'Struktur für Kick-off-Meetings mit Zielen, Rollen und Nächsten Schritten.',
          content: `# {{title}}

**Datum:** {{date}}
**Moderation:**

## Begrüßung & Kontext
- Vorstellung der Teilnehmenden
- Hintergrund & Anlass

## Projektziele
- Ziel 1 – Kennzahl
- Ziel 2 – Nutzen

## Rollen & Verantwortlichkeiten
- Rolle – Person – Hauptaufgabe

## Zeitplan & Meilensteine
- Phase – Zeitraum – Deliverable

## Nächste Schritte
1. Schritt – Owner – Termin
2. Schritt – Owner – Termin`
        },
        {
          id: 'quick-retrospective',
          title: 'Team-Retrospektive',
          description: 'Zeitsparende Retro mit Fokus auf Highlights, Lowlights und Maßnahmen.',
          content: `# {{title}}

**Sprint/Zeitraum:** {{date}}
**Teilnehmende:**

## Was lief gut?
- Erfolg oder hilfreiche Zusammenarbeit
- Tool oder Prozess, der überzeugt hat

## Was lief weniger gut?
- Hindernis oder Stolperstein
- Kommunikations- oder Prozesslücke

## Experimente & Ideen
- Verbesserungsvorschlag mit Nutzen
- Experiment zum Testen

## Maßnahmen
- [ ] Aktion – Owner – Termin
- [ ] Aktion – Owner – Termin`
        },
        {
          id: 'quick-decision-log',
          title: 'Entscheidungsprotokoll',
          description: 'Kurzprotokoll für Entscheidungen mit Kontext, Optionen und Folgen.',
          content: `# {{title}}

**Datum:** {{date}}
**Thema:**

## Kontext
- Ausgangssituation oder Problem
- Relevante Daten/Fakten

## Bewertete Optionen
- Option A – Vorteile/Nachteile
- Option B – Vorteile/Nachteile

## Entscheidung
- Gewählte Option & Begründung
- Verantwortliche Person

## Auswirkungen & Folgeaufgaben
- Erwarteter Effekt
- [ ] Aufgabe – Owner – Termin`
        },
        {
          id: 'quick-action-plan',
          title: '30-60-90 Tage Plan',
          description: 'Schneller Startplan für neue Rollen mit Zielen je Phase.',
          content: `# {{title}}

**Rolle:**
**Startdatum:** {{date}}

## Erste 30 Tage
- Fokus 1 – Lernziel
- Beziehung oder Ressource aufbauen

## Tage 31-60
- Initiative oder Projekt übernehmen
- Messbarer Erfolg definieren

## Tage 61-90
- Skalierung oder Optimierung
- Stakeholder-Abgleich/Review

## Unterstützungsbedarf
- Coaching oder Mentoring
- Tools/Training`
        }
      ]
    },
    {
      id: 'docs',
      label: 'Dokumentation',
      icon: 'lucide:book-open-check',
      snippets: [
        {
          id: 'doc-how-to',
          title: 'How-To Anleitung',
          description: 'Schritt-für-Schritt-Erklärung mit Voraussetzungen und Troubleshooting.',
          content: `# {{title}}

**Zuletzt geprüft:** {{date}}

## Voraussetzungen
- Zugang oder Berechtigungen
- Benötigte Tools oder Versionen

## Schritte
1. Schritt 1 – Erwartetes Ergebnis
2. Schritt 2 – Screenshot/Codebeispiel
3. Schritt 3 – Validierung

## Häufige Fragen
- Frage: Kurze Antwort

## Troubleshooting
- Problem: Lösung`
        },
        {
          id: 'doc-release-notes',
          title: 'Release Notes',
          description: 'Changelog mit Highlights, Fixes und bekannten Einschränkungen.',
          content: `# {{title}}

_Veröffentlicht am {{date}}_

## Highlights
- Feature 1 – Nutzen
- Feature 2 – Nutzen

## Verbesserungen
- Punkt 1
- Punkt 2

## Fehlerbehebungen
- Ticket/ID – Kurzbeschreibung

## Bekannte Einschränkungen
- Thema – Workaround`
        },
        {
          id: 'doc-architecture-decision',
          title: 'Architecture Decision Record',
          description: 'Kompakter ADR mit Kontext, Entscheidung und Konsequenzen.',
          content: `# {{title}}

**Status:** Vorgeschlagen · **Datum:** {{date}}

## Kontext
- Problemstellung & Rahmenbedingungen

## Entscheidung
- Gewählte Option
- Alternativen kurz begründen

## Konsequenzen
- Positive Effekte
- Negative Effekte

## Nächste Schritte
- Umsetzungsschritt 1
- Review/Check-in`
        },
        {
          id: 'doc-api-reference',
          title: 'API Referenz',
          description: 'Übersicht über Endpunkte mit Parametern, Responses und Beispielen.',
          content: `# {{title}}

**Letzte Aktualisierung:** {{date}}

## Übersicht
- Service oder Modul
- Authentifizierung

## Endpunkte
### \`{{endpoint}}\`
- Methode: GET/POST
- Beschreibung: Zweck des Endpunkts
- Parameter:
  - \`name\` (Typ) – Bedeutung
  - \`limit\` (optional) – Standardwert
- Antwort:
  - Status 200 – Schema oder Beispiel
  - Fehlercodes – Hinweise

## Beispiele
\`\`\`bash
curl -X GET "https://api.example.com/{{endpoint}}" \
  -H "Authorization: Bearer <token>"
\`\`\`

## Hinweise
- Rate Limits
- Kontakt für Fragen`
        },
        {
          id: 'doc-onboarding-guide',
          title: 'Onboarding Guide',
          description: 'Checkliste für neue Teammitglieder mit Aufgaben nach Woche.',
          content: `# {{title}}

**Startdatum:** {{date}}
**Rolle:**

## Woche 1
- [ ] Vorstellung im Team
- [ ] Zugang zu Tools
- [ ] Erste Aufgaben

## Woche 2
- [ ] Shadowing/Tandem
- [ ] Training oder Kurs
- [ ] Feedback-Gespräch

## Woche 3
- [ ] Eigenständiges Projekt
- [ ] Review der Ziele

## Ressourcen
- Handbuch oder Wiki
- Ansprechpartner:innen`
        },
        {
          id: 'doc-runbook',
          title: 'Incident Runbook',
          description: 'Standardverfahren mit Alarmierung, Sofortmaßnahmen und Eskalation.',
          content: `# {{title}}

**Letzte Aktualisierung:** {{date}}
**System/Service:**

## Trigger & Symptome
- Monitoring-Alarm oder Log-Muster
- Auswirkungen für Nutzer:innen

## Sofortmaßnahmen
1. Schritt – Erwartetes Ergebnis
2. Schritt – Validierung/Beobachtung

## Eskalation & Kommunikation
- Ansprechpartner:in – Kanal – Reaktionszeit
- Status-Update Vorlage

## Ursachenanalyse
- Checkliste mit Prüfungen
- Bekannte Fehlerbilder

## Wiederherstellung & Follow-up
- Abschlusskriterien
- Postmortem-Link`
        },
        {
          id: 'doc-style-guide',
          title: 'Styleguide (Docs)',
          description: 'Redaktionsleitfaden mit Tonalität, Formatierung und Freigabeprozess.',
          content: `# {{title}}

**Version:** {{date}}

## Tonalität & Stimme
- Leitprinzipien (z. B. klar, hilfreich)
- Wörter, die vermieden werden sollen

## Formatierung
- Überschriften-Hierarchie
- Code- und Hinweisblöcke

## Terminologie
- Bevorzugte Begriffe
- Glossar-Link

## Review & Freigabe
- Autor:in – Reviewer – Abnahme
- Checkliste vor Veröffentlichung

## Lokalisierung
- Übersetzungsprozess
- Kontaktpunkte für Rückfragen`
        },
        {
          id: 'doc-qa-checklist',
          title: 'QA Checkliste',
          description: 'Qualitätssicherungsliste mit Testfällen, Kriterien und Ergebnissen.',
          content: `# {{title}}

**Projekt/Version:**
**Datum:** {{date}}

## Testumgebung
- Umgebung/Build
- Testdaten vorbereitet?

## Testfälle
| ID | Beschreibung | Status | Notizen |
| --- | --- | --- | --- |
| TC-1 | | | |
| TC-2 | | | |

## Abweichungen
- Fehler-ID – Schweregrad – Status

## Abnahme
- Kriterien erfüllt?
- Freigabe durch (Name)

## Nachverfolgung
- Offene Punkte
- Retrospektive-Link`
        }
      ]
    },
    {
      id: 'creative',
      label: 'Kreativ',
      icon: 'lucide:sparkles',
      snippets: [
        {
          id: 'creative-newsletter',
          title: 'Newsletter-Intro',
          description: 'Aufhänger mit Call-to-Action und persönlicher Ansprache.',
          content: `# {{title}}

Hallo {{title}},

Willkommen zur Ausgabe vom {{date}}!

## Was dich erwartet
- Thema 1 mit Nutzen
- Thema 2 mit Nutzen

## Call-to-Action
> Kurzer motivierender Satz.

Viel Freude beim Lesen!`
        },
        {
          id: 'creative-storyboard',
          title: 'Storyboard Vorlage',
          description: 'Storyboard mit Szenenbeschreibung, Ziel und Assets.',
          content: `# {{title}}

**Datum:** {{date}}

## Szenenübersicht
| Szene | Ziel | Setting | Notizen |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |

## Kernbotschaft
- Wichtigste Aussage

## Assets
- Bilder/Clips
- Sounds/Musik`
        },
        {
          id: 'creative-social-post',
          title: 'Social Media Post',
          description: 'Kurzer Social-Post mit Hook, Botschaft und CTA.',
          content: `# {{title}}

**Datum:** {{date}}

## Hook
- Aufhänger oder Frage

## Kernbotschaft
- Wichtigste Info oder Nutzen

## CTA
- Was soll passieren?

## Hashtags
- #Hashtag1 #Hashtag2 #Hashtag3`
        },
        {
          id: 'creative-blog-outline',
          title: 'Blogpost-Gliederung',
          description: 'Struktur für Blogartikel mit Hook, Argumenten und CTA.',
          content: `# {{title}}

**Datum:** {{date}}

## Hook
- Frage, Statistik oder Story

## Zielgruppe
- Wer soll den Beitrag lesen?
- Welches Problem wird gelöst?

## Hauptargumente
1. Argument – Beweis oder Beispiel
2. Argument – Beweis oder Beispiel
3. Argument – Beweis oder Beispiel

## Zwischenüberschriften
- Abschnittstitel – Kernaussage
- Abschnittstitel – Kernaussage

## Call-to-Action
- Angebot, Demo, Newsletter

## Weiterführende Links
- Quelle oder Ressource`
        },
        {
          id: 'creative-campaign-brief',
          title: 'Kampagnen-Briefing',
          description: 'Vorlage für Marketingkampagnen mit Ziel, Botschaft und Kanälen.',
          content: `# {{title}}

**Datum:** {{date}}
**Projekt:**

## Zielsetzung
- Geschäftsziel
- Kommunikationsziel

## Zielgruppe
- Persona oder Segment
- Bedürfnis/Insight

## Kernbotschaft
- Hauptversprechen
- Tone of Voice

## Kanäle & Formate
- Kanal – Format – Frequenz

## Assets & Deliverables
- Asset – Verantwortliche Person – Termin

## KPIs & Erfolgsmessung
- Kennzahl – Zielwert

## Budget & Ressourcen
- Budgetrahmen
- Externe Partner`
        },
        {
          id: 'creative-podcast-outline',
          title: 'Podcast-Outline',
          description: 'Gliederung für Podcast-Folgen mit Segmenten, Gästen und CTA.',
          content: `# {{title}}

**Folgen-Nr.:**
**Aufnahmedatum:** {{date}}

## Intro
- Begrüßung & Hook
- Sponsor/Callout

## Hauptsegmente
1. Segment – Kernthema – Fragen
2. Segment – Gast – Kernzitate

## Hörerfragen/Interaktion
- Frage 1 – Antwortpunkte
- Frage 2 – Antwortpunkte

## CTA & Outro
- Abonnieren, Feedback, Sharing
- Ausblick auf nächste Folge`
        },
        {
          id: 'creative-email-campaign',
          title: 'E-Mail-Kampagne',
          description: 'Planungsvorlage für E-Mail-Sequenzen mit Ziel, Segment und Timing.',
          content: `# {{title}}

**Kampagnenziel:**
**Zeitraum:** {{date}}

## Zielgruppe & Segmentierung
- Persona/Segment
- Pain Points & Bedürfnisse

## Sequenzübersicht
| Versanddatum | Betreffidee | Ziel | CTA |
| --- | --- | --- | --- |
| | | | |
| | | | |

## Inhalte & Assets
- Content-Snippets
- Visuals oder Downloads

## KPIs & Monitoring
- Öffnungsrate, CTR, Conversion
- Reporting-Rhythmus`
        },
        {
          id: 'creative-brand-voice',
          title: 'Brand Voice Leitfaden',
          description: 'Definition der Markenstimme mit Dos & Don’ts sowie Beispielen.',
          content: `# {{title}}

**Stand:** {{date}}

## Markenwerte
- Wert 1 – Bedeutung
- Wert 2 – Bedeutung

## Dos
- Erwünschtes Wording oder Ton
- Stilistische Elemente

## Don’ts
- Tabuwörter oder Stile
- Fehler, die vermieden werden

## Beispieltexte
- Beispiel für kurzen Social-Post
- Beispiel für längere Story

## Review
- Ansprechpartner:in für Freigaben
- Aktualisierungsfrequenz`
        }
      ]
    },
    {
      id: 'school',
      label: 'Schule & Studium',
      icon: 'lucide:graduation-cap',
      snippets: [
        {
          id: 'school-lesson-notes',
          title: 'Unterrichtsnotizen',
          description: 'Struktur für Lernziele, Kernaussagen und offene Fragen.',
          content: `# {{title}}

**Datum:** {{date}}
**Fach:** 
**Dozent:in/Lehrkraft:** 

## Lernziele
- Ziel 1
- Ziel 2
- Ziel 3

## Kernaussagen
- Wichtigster Punkt mit Beispiel
- Formel/Definition

## Anwendungen & Beispiele
- Anwendung oder Rechenweg

## Offene Fragen
- Frage 1
- Frage 2

## Aufgaben & To-Dos
- [ ] Aufgabe (Abgabedatum)
- [ ] Aufgabe (Vorbereitung)`
        },
        {
          id: 'school-study-plan',
          title: 'Wöchentlicher Lernplan',
          description: 'Wochenübersicht mit Prioritäten, Lernblöcken und Pausen.',
          content: `# {{title}}

**Woche ab:** {{date}}

## Prioritäten
1. Wichtigstes Thema
2. Prüfung/Abgabe vorbereiten
3. Wiederholung

## Lernblöcke
| Tag | Fach/Thema | Dauer | Ziel |
| --- | --- | --- | --- |
| Montag | | | |
| Dienstag | | | |
| Mittwoch | | | |
| Donnerstag | | | |
| Freitag | | | |
| Wochenende | | | |

## Ressourcen
- Kapitel/Quelle
- Video/Übung

## Reflexion
- Was hat gut funktioniert?
- Was verbessern?`
        },
        {
          id: 'school-presentation-outline',
          title: 'Präsentations-Gliederung',
          description: 'Struktur für Referate mit Thesen, Quellen und Interaktion.',
          content: `# {{title}}

**Datum:** {{date}}
**Anlass:** 

## Einleitung
- Aufmerksamkeitshaken
- Fragestellung oder These

## Hauptteil
### Punkt 1
- Kernaussage
- Beleg/Quelle

### Punkt 2
- Kernaussage
- Beleg/Quelle

### Punkt 3
- Kernaussage
- Beleg/Quelle

## Interaktive Elemente
- Frage ans Publikum
- Kurze Übung

## Fazit
- Wichtigstes Learning
- Ausblick

## Quellen
- Quelle 1 (Autor, Jahr)
- Quelle 2 (URL, Abrufdatum)`
        },
        {
          id: 'school-lab-report',
          title: 'Laborbericht',
          description: 'Aufbau für Experimente mit Hypothese, Methode und Ergebnissen.',
          content: `# {{title}}

**Datum:** {{date}}
**Fach/Labor:**
**Teammitglieder:**

## Ziel & Fragestellung
- Forschungsfrage oder Hypothese

## Materialien & Methoden
- Material 1
- Methode/Versuchsaufbau

## Durchführung
- Schritt 1 – Beobachtung
- Schritt 2 – Beobachtung

## Ergebnisse
- Tabelle, Messwerte oder Grafiken

## Auswertung
- Interpretation der Ergebnisse
- Fehlerquellen

## Fazit
- Kurze Zusammenfassung
- Ausblick oder nächste Schritte`
        },
        {
          id: 'school-study-summary',
          title: 'Lernzusammenfassung',
          description: 'Komprimiertes Dokument mit Kernideen, Formeln und Merksätzen.',
          content: `# {{title}}

**Datum:** {{date}}
**Thema/Fach:**

## Kerngedanken
- Wichtigster Begriff – Erklärung
- Zusammenhang – Beispiel

## Formeln & Regeln
- Formel – Bedeutung
- Regel – Anwendung

## Grafiken/Visualisierung
- Beschreibung der Grafik

## Merksätze & Eselsbrücken
- Merksatz 1
- Merksatz 2

## Übungsaufgaben
- Frage oder Aufgabe – Lösungsidee
- Aufgabe zur Wiederholung

## Offene Fragen
- Punkt zur Klärung`
        },
        {
          id: 'school-research-plan',
          title: 'Forschungsplan',
          description: 'Planungsvorlage für Seminar- oder Abschlussarbeiten.',
          content: `# {{title}}

**Thema:**
**Betreuer:in:**
**Startdatum:** {{date}}

## Forschungsfrage & Zielsetzung
- Leitfrage/n
- Erwarteter Beitrag

## Methodik
- Qualitativ/Quantitativ – Begründung
- Datenquellen

## Zeitplan
- Meilenstein – Datum – Ergebnis
- Meilenstein – Datum – Ergebnis

## Literatur & Ressourcen
- Schlüsselquellen
- Tools oder Software

## Risiken & Absicherung
- Mögliche Hürden
- Plan B`
        },
        {
          id: 'school-revision-tracker',
          title: 'Prüfungsvorbereitung Tracker',
          description: 'Fortschrittsübersicht für Lernziele, Aufgaben und Wiederholungen.',
          content: `# {{title}}

**Fach/Modul:**
**Prüfungstermin:** {{date}}

## Lernziele
| Kapitel | Status | Verständnis | Wiederholen am |
| --- | --- | --- | --- |
| | | | |
| | | | |

## Aufgaben
- [ ] Aufgabe – Quelle – Schwierigkeitsgrad
- [ ] Aufgabe – Quelle – Schwierigkeitsgrad

## Wiederholungen
- Datum – Thema – Ergebnis
- Datum – Thema – Ergebnis

## Reflexion
- Fokus für die nächste Woche
- Motivation/Belohnung`
        },
        {
          id: 'school-group-project',
          title: 'Gruppenprojekt-Plan',
          description: 'Abstimmungsvorlage mit Rollen, Deliverables und Meilensteinen.',
          content: `# {{title}}

**Kurs:**
**Team:**
**Projektstart:** {{date}}

## Ziel & Deliverable
- Ergebnisbeschreibung
- Bewertungskriterien

## Rollen & Verantwortlichkeiten
- Rolle – Name – Aufgabe
- Rolle – Name – Aufgabe

## Zeitplan & Meilensteine
- Meilenstein – Termin – Verantwortlich
- Meilenstein – Termin – Verantwortlich

## Kommunikation
- Meeting-Cadence
- Tools & Dokumente

## Risiken & Vereinbarungen
- Erwartete Herausforderungen
- Team-Commitments`
        }
      ]
    },
    {
      id: 'work',
      label: 'Arbeit & Karriere',
      icon: 'lucide:briefcase',
      snippets: [
        {
          id: 'work-okrs-checkin',
          title: 'OKR Check-in',
          description: 'Kurzes Update zu Objectives, Key Results und Blockern.',
          content: `# {{title}}

**Zeitraum:** {{date}}

## Objective
- Kurzbeschreibung des Ziels

## Fortschritt je Key Result
| Key Result | Status | Messwert | Nächste Schritte |
| --- | --- | --- | --- |
| KR1 | | | |
| KR2 | | | |
| KR3 | | | |

## Blocker & Unterstützungsbedarf
- Hindernis 1 – benötigt Unterstützung von …
- Hindernis 2 – Entscheidung ausstehend

## Risiken & Maßnahmen
- Risiko – geplanter Gegenstoß

## Highlights
- Erfolg oder Learnings`
        },
        {
          id: 'work-one-on-one',
          title: '1:1 Meeting Agenda',
          description: 'Vorlage für regelmäßige Mitarbeitergespräche mit Follow-ups.',
          content: `# {{title}}

**Datum:** {{date}}
**Teilnehmende:** 

## Rückblick
- Erfolge seit dem letzten Gespräch
- Herausforderungen

## Themen der Führungskraft
- Feedback oder Ankündigungen

## Themen der Mitarbeiter:innen
- Anliegen 1
- Anliegen 2

## Entwicklung & Ziele
- Langfristiges Ziel – Status
- Maßnahme für die nächste Woche

## Vereinbarte To-Dos
- [ ] Aufgabe – Owner – Termin
- [ ] Aufgabe – Owner – Termin`
        },
        {
          id: 'work-cover-letter',
          title: 'Bewerbungsanschreiben',
          description: 'Aufbau mit Einleitung, Mehrwert und Call-to-Action.',
          content: `# {{title}}

{{date}}

Sehr geehrte:r Ansprechpartner:in,

## Einleitung
- Bezug auf Stelle und Motivation

## Warum ich?
- Relevante Erfahrung oder Projekt
- Passende Stärke mit Beispiel

## Beitrag für das Unternehmen
- Nutzen oder Idee, die Mehrwert schafft

## Abschluss
- Hinweis auf Gesprächsbereitschaft
- Freundliche Grußformel

Mit freundlichen Grüßen

{{Name}}`
        },
        {
          id: 'work-project-status',
          title: 'Projektstatusbericht',
          description: 'Statusübersicht mit Fortschritt, Risiken und Entscheidungen.',
          content: `# {{title}}

**Berichtszeitraum:** {{date}}
**Projekt:**

## Gesamtstatus
- Ampelbewertung & kurze Begründung

## Fortschritt nach Arbeitspaket
- Arbeitspaket – Status – Highlight
- Arbeitspaket – Status – Highlight

## Risiken & Issues
- Risiko – Auswirkung – Maßnahme
- Issue – Verantwortlich – Frist

## Entscheidungen
- Entscheidung – Datum – Impact

## Finanz- & Ressourcenstatus
- Budgetverbrauch
- Kapazitäten

## Nächste Schritte
1. Aktion – Owner – Termin
2. Aktion – Owner – Termin`
        },
        {
          id: 'work-feedback-notes',
          title: 'Feedback-Protokoll',
          description: 'Vorlage für strukturierte Feedback-Gespräche mit Maßnahmen.',
          content: `# {{title}}

**Datum:** {{date}}
**Teilnehmende:**

## Kontext
- Anlass des Feedbacks
- Beobachteter Zeitraum

## Beobachtungen
- Situation – Verhalten – Wirkung
- Situation – Verhalten – Wirkung

## Stärken
- Positive Beobachtung
- Unterstützende Beispiele

## Entwicklungsfelder
- Thema – Vereinbarte Veränderung
- Unterstützung/Training

## Vereinbarte Maßnahmen
- [ ] Maßnahme – Owner – Termin
- [ ] Follow-up – Datum`
        },
        {
          id: 'work-sprint-review',
          title: 'Sprint Review',
          description: 'Agenda für Reviews mit Demo, Feedback und Backlog-Updates.',
          content: `# {{title}}

**Sprint:**
**Datum:** {{date}}
**Team:**

## Ziele & Kontext
- Sprint-Ziel – Status
- Wichtige Kennzahlen

## Demo der Ergebnisse
- Item – Owner – Feedback
- Item – Owner – Feedback

## Feedback & Fragen
- Stakeholder-Feedback
- Offene Fragen

## Backlog & Next Steps
- Neue Items
- Anpassungen am Sprint-Ziel

## Dank & Abschluss
- Anerkennung fürs Team
- Hinweise auf nächste Termine`
        },
        {
          id: 'work-operational-meeting',
          title: 'Operations Meeting',
          description: 'Struktur für operative Abstimmungen zu Kennzahlen und Maßnahmen.',
          content: `# {{title}}

**Datum:** {{date}}
**Bereich/Team:**

## KPI-Überblick
- Kennzahl – Ist vs. Ziel
- Kennzahl – Ist vs. Ziel

## Highlights & Warnsignale
- Erfolg inkl. Ursache
- Issue inkl. Auswirkung

## Maßnahmenplan
- [ ] Aktion – Owner – Fällig am
- [ ] Aktion – Owner – Fällig am

## Entscheidungen & Eskalationen
- Entscheidung – Verantwortliche Person
- Eskalation – nächste Schritte

## Offene Punkte
- Thema – Status
- Thema – Status`
        },
        {
          id: 'work-performance-review',
          title: 'Performance Review',
          description: 'Vorlage für Jahresgespräche mit Zielen, Feedback und Entwicklung.',
          content: `# {{title}}

**Mitarbeitende:r:**
**Zeitraum:** {{date}}

## Ziele & Ergebnisse
- Ziel – Bewertung – Beleg
- Ziel – Bewertung – Beleg

## Kompetenzen
- Kompetenz – Einschätzung – Beispiel
- Kompetenz – Einschätzung – Beispiel

## Feedback
- Selbstreflexion
- Feedback der Führungskraft

## Entwicklung & Karriere
- Entwicklungsziel
- Maßnahmen/Trainings

## Vereinbarte Schritte
- [ ] Maßnahme – Owner – Termin
- [ ] Follow-up – Datum`
        }
      ]
    }
  ]
});
