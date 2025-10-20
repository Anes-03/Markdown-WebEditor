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
        }
      ]
    }
  ]
});
