# Wehgehts.de Dokumentation

# Was ist wehgehts?

Wehgehts ist eine Organisations-App für WGs, in dieser kann man zum Beispiel Finanzen, To-Dos und weitere Dinge die einfach im Alltag einer WG wichtig sind, überblicken.

Da ich und mein anfänglicher Projektpartner auch mein WG-Mitbewohner hat das Thematisch perfekt gepasst und wir hatten direkt eine echte User-Story am eigenen Leib.

# Elementarste Entscheidungen

## Framework

Erster Prompt und Ideenentwicklung was gebaut wird. 

-> 1. Entscheidung: Express & React+Vite

Vite statt next.js da next.js hier nicht nötig war und eher overkill ist bei einem internen Tracker, SEO ist hier erstmal eher unwichtig und liegt sowieso hinter einem Login.

## API

Flache Struktur mit Query Parametern statt starre URL-Hierarchie
-> mehrere WGs gleichzeitig nutzbar (WG-übergreifend nutzbar) außerdem leichtere API-Entwicklung
-> Elemente werden immer einer WG-ID zugeordnet

## Datenbank

Diese Entscheidung wurde in zwei Schritten gefällt:

1. Am Anfang des Projekts wurde SQLite als Datenbank gewählt, das war rein für die lokale Entwicklung, da SQLite deutlich schneller und simpler ist

2. Später im laufe des projekts wechselten wir dann auf MySQL 
-> effektiver und stabiler für späteres Hetzner-Hosting

## ORM

Prisma als ORM
-> leichte und sichere Option Prisma als API-Schnittstelle mit der Datenbank
-> Wichtig: mehrere Nutzer innerhalb einer WG

Im Laufe des Projekts haben wir das ursprüngliche Prisma Schema aufgeteilt. Undzwar in schema.prisma (MySQL) und schema.test.prisma (SQLite). 

## Auth

JWT-Authentification
-> Nutzer bekommen nach dem Login ein personalisierten Token, dieser wird bei jeder Anfrage mitgesendet

Die Alternative express-session schien uns für diesen WG-tracker nicht nötig und somit konnten wir uns den extra Aufwand hier sparen.

Zusammen mit dem Agent haben wir noch eine Middleware entwickelt die überprüft welcher WG der Nutzer zugehört. 

## Realtime

Wegen unserem Live-chat und dem "Gerade im Supermarkt"-Modus war uns wichtig, dass das ohne Reload passieren kann und haben uns hier für die etwas komplexere Variant mit WebSocket entschieden und nicht nur für SSE

## Notifications

Wir haben sowohl E-mail als auch Push-Benachrichtigungen, da es eine Web-App ist, ist für bestimmte Dinge die man mitbekommen sollte auch wenn man nicht in der Web-App gerade ist eine E-mail notification nötig.

Beispiel: ToDo heute fällig.

## Hetzner + GitHub

Wichtig war uns vorallem für die spätere weiterarbeit nach der Projektabgabe, dass wir einen leichten Process zum publishen neuer changes der Website auf Hetzner haben und haben deshalb die CI/CD-Pipeline eingerichtet
