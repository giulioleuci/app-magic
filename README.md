[English](#english) | [Italiano](#italiano)

# ProxyForge Web

---

<a name="english"></a>
## ProxyForge Web (English)

### Overview

This is a web application built with Next.js designed for card game players. It allows users to search for cards using various providers (Scryfall for Magic: The Gathering, and Pokemon TCG API for Pokémon TCG), build a list of cards, and generate a print-friendly view to create proxies for playtesting and casual games.

The application features a clean, modern interface built with shadcn/ui and supports both English and Italian languages.

### Key Features

- **Multi-Provider Card Search**: Integrated search modals for different card games.
  - **Magic: The Gathering**: Search any card by name using the Scryfall API.
  - **Pokémon TCG**: Search any card by name using the official Pokemon TCG API.
- **Card Management**: Add and remove cards from a list, which is managed globally via React Context.
- **Multiple Layouts**: View your card list as a simple list, a table, or a grid of images.
- **Print-Friendly Output**: A dedicated `/print` route formats the selected cards to be easily printed on A4 paper.
- **Internationalization**: Full support for English and Italian, managed via a dedicated `LanguageContext`.
- **Import/Export**: Save and load your card lists as `.xlsx` files.

### Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
-_UI_: React, shadcn/ui, Tailwind CSS
- **State Management**: React Context (`CardContext`, `LanguageContext`, `SearchContext`)
- **Card Data APIs**:
  - Scryfall API
  - Pokemon TCG API

### Project Structure

- `src/app`: Main application routes, including the home page (`/`) and the print page (`/print`).
- `src/components`: Reusable React components, including UI elements from shadcn/ui and custom components like `CardList`, `CardTable`, and search modals.
- `src/context`: Global state management for the card list, language settings, and search state.
- `src/hooks`: Custom hooks for handling card search and other logic.
- `src/lib`: Utility functions and internationalization (i18n) files.
- `src/api`: Provider definitions and search logic.

---

<a name="italiano"></a>
## ProxyForge Web (Italiano)

### Panoramica

Questa è un'applicazione web realizzata con Next.js e pensata per i giocatori di carte. Permette agli utenti di cercare carte utilizzando vari provider (Scryfall per Magic: The Gathering e l'API Pokemon TCG per Pokémon TCG), costruire una lista di carte e generare una visualizzazione pronta per la stampa per creare "proxy" da usare durante playtest o partite amichevoli.

L'applicazione presenta un'interfaccia pulita e moderna, costruita con shadcn/ui, e supporta sia la lingua inglese che quella italiana.

### Funzionalità Chiave

- **Ricerca Carte Multi-Provider**: Modali di ricerca integrati per diversi giochi di carte.
  - **Magic: The Gathering**: Cerca qualsiasi carta per nome utilizzando le API di Scryfall.
  - **Pokémon TCG**: Cerca qualsiasi carta per nome utilizzando l'API ufficiale di Pokemon TCG.
- **Gestione Carte**: Aggiungi e rimuovi carte da una lista, gestita globalmente tramite React Context.
- **Layout Multipli**: Visualizza la tua lista di carte come elenco semplice, tabella o griglia di immagini.
- **Stampa Ottimizzata**: Un percorso dedicato `/print` formatta le carte selezionate per essere stampate facilmente su fogli A4.
- **Internazionalizzazione**: Supporto completo per inglese e italiano, gestito tramite un `LanguageContext` dedicato.
- **Import/Export**: Salva e carica le tue liste di carte come file `.xlsx`.

### Stack Tecnologico

- **Framework**: Next.js
- **Linguaggio**: TypeScript
- **UI**: React, shadcn/ui, Tailwind CSS
- **Gestione dello Stato**: React Context (`CardContext`, `LanguageContext`, `SearchContext`)
- **API Dati Carte**:
  - API di Scryfall
  - API di Pokemon TCG

### Struttura del Progetto

- `src/app`: Route principali dell'applicazione, inclusa la home page (`/`) e la pagina di stampa (`/print`).
- `src/components`: Componenti React riutilizzabili, inclusi elementi UI di shadcn/ui e componenti personalizzati come `CardList`, `CardTable` e le modali di ricerca.
- `src/context`: Gestione dello stato globale per la lista di carte, le impostazioni della lingua e lo stato di ricerca.
- `src/hooks`: Hook personalizzati per la gestione della ricerca di carte e altre logiche.
- `src/lib`: Funzioni di utilità e file per l'internazionalizzazione (i18n).
- `src/api`: Definizioni dei provider e logica di ricerca.
