# Audio-Lernplattform-Server
Der Audio-Lernplattform-Server ist ein nodebasierter Server, der mithilfe einer MySQL-Datenbank, Prisma und Apollo-Server eine GraphQL-API bereitstellt.

Er bildet die Serverschnittstelle für die Digitale Musikplattform. 
Dieses Projekt umfasst alle notwendigen Bestandteile um...
* Die Datenbank aufzusetzen & das Datenmodell zu initialisieren
* Die Authentifizierung einzurichten
* Den Server aufzusetzen & zu starten

## Über die Audio-Lernplattform
Die Digitale Musikplattform ist eine musikpädagogische Cordova-App, welche mehrere Features umfasst:
* Nutzerverwaltung: Schüler, Lehrer & Eltern: Alle in einer Anwendung mit unterschiedlichen Features, ...
* Verbindungen aufbauen: Nutzer können sich verknüpfen, ...
* Chatting: Verknüpfte User können miteinander Chatten
* Aufgabenverwaltung: Mithilfe eines Kanban-Boards können Aufgaben organisiert werden
* Dateiverwaltung
* Bibliothek
* Interaktiver Audio-Player: Musikstücke können abgespielt, die Lautstärke einzelner Spuren, der Pitch und die Wiedergabegeschwindigkeit verändert werden; Ausschnitte aus dem Track können ausgewählt werden; Optional mit Video
* Korrepititionsmöglichkeit: Innerhalb des Audio-Players kann parallel Musik aufgenommen und abgespielt werden
* Browser-Funktionalität: Ein Teil der Features ist ebenfalls im Browser verfügbar
...

Dieses Projekt ist Teil einer gesamten Plattform.
Folgende weitere Projekte gehören dazu:
* Audio-Lernplattform-Client
* Audio-Lernplattform-UI-Komponentenbiliothek
* Audio-Lernplattform-Bibliothek
* Audio-Lernplattform-Chatting
...

## Technologien / Features
Folgende Technologien werden verwendet: 
* MySQL-Datenbank
* GraphQL-Schnittstelle mit [Apollo Server](https://github.com/apollographql/apollo-server)
* Websocket-Schnittstelle für GraphQL-Subscriptions 
* Autorisierung + Validierung auf API-Level durch GraphQL Shield, Keycloak & keycloak-connect-graphql
...

## Voraussetzungen
* Node.js vorinstalliert (Version noch prüfen)
* MariaDB 10.4.8

## Setup
* Packages installieren: `npm i`
* Datenbank aufsetzen: 
  * `etc/db-dump/schema.sql` für das Datenbank-Schema
  * `etc/db-dump/daten.sql` für Dummy-Daten
* `.env` aus `.env.base` erstellen, ggf. Ports + Pfad anpassen
* Prisma initialisieren: `npm init -y
npm install @prisma/cli --save-dev
npx prisma
npx prisma init
`
*`prisma/.env.base` mit der Datenbank-URL anpassen
* Prisma-Client erstellen: `npx prisma generate`
* [Keycloak installieren / einrichten](https://www.keycloak.org/docs/latest/server_installation/)
* `keycloak.json` aus Keycloak-Instanz exportieren und austauschen

Der Server ist nun bereit.

* Start durch `npm run start`
* Start mit Live Reload via `npm run start:watch`
  * Via [nodemon](https://www.npmjs.com/package/nodemon)
  * Startet Server neu wenn .js und .json-Files aktualisiert werden
    * zB Schemas, Resolver, ...
    * nodemon.json hat config
* GraphQL-Playground verfügbar unter `http://localhost:4000/graphql` (bzw. den in .env angegebenem Port und Endpunkt)
* Für Keycloak-Authentifizierung: 
  * Access-Token via `npm run keycloak:grant --user=<user> --password=<password>` erhalten, Werte sind für einen Keycloak-User
  * In graphql Playground in headers kopieren

### Aufbau

`src` : Die eigentliche Programmlogik
* `src/index.js` : Haupt-Serverlogik, startet Apollo-Server-Express + Subscriptionserver
* `src/authorization`: Komponente zum Definieren von Autorisierungs-Regeln
  * `src/authorization/helpers`: Helferfunktionen für die Rules: Funktionen, die in mehreren Rules aufgerufen werden, z.B. GetUser
  * `src/authorization/rules`: GraphQL-Shield-Rules für verschiedene Bereiche der Anwendung (Anwendung in `src/authorization/index.js`)
* `src/dataSources`: Komponente für Datenquellen, welche in den GraphQL Resolvern verwendet werden. Aktuell nur Prisma. In `src/index.js` dem Apollo-Server angehängt.
  * `src/dataSources/prisma`: Definiert die Prisma-Datenquelle, können von den Resolvern aufgerufen werden. Für Modularität aufgegliedert in verschiedene Bereiche der Anwendung (z.B. User oder Bibliothek)
* `src/resolver`: Komponente für die GraphQL-Resolver. In `src/index.js` zu einem Schema zusammengefügt.
* `src/schema`: Komponente für das GraphQL-Schema. In `src/index.js` zu einem Schema zusammengefügt.

`prisma`
* Prisma-Konfigurationen, siehe Setup.

`etc`
* `scripts`: verschiedene Skripte, die nützlich sein können
    * `obtainKeycloakToken.js` Skript, um einen Keycloak Access Token zu erhalten, siehe Setup.
