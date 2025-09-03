[English](#english) | [Italiano](#italiano)

# MTG Proxy Generator

> This project was developed using **Google Firebase Studio**.

---

<a name="english"></a>
## MTG Proxy Generator (English)

### Overview

This is a web application built with Next.js designed for Magic: The Gathering players. It allows users to search for cards using the Scryfall API, build a list of cards, and generate a print-friendly view to create proxies for playtesting and casual games.

The application features a clean, modern interface built with shadcn/ui and supports both English and Italian languages.

### Key Features

- **Card Search**: Integrated `ScryfallSearchModal` to search for any Magic: The Gathering card by name.
- **Card Management**: Add and remove cards from a list, which is managed globally via React Context.
- **Multiple Layouts**: View your card list as a simple list, a table, or a grid of images.
- **Print-Friendly Output**: A dedicated `/print` route formats the selected cards to be easily printed on A4 paper.
- **Internationalization**: Full support for English and Italian, managed via a dedicated `LanguageContext`.

### Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **UI**: React, shadcn/ui, Tailwind CSS
- **State Management**: React Context (`CardContext`, `LanguageContext`)
- **Card Data**: Scryfall API

### Project Structure

- `src/app`: Main application routes, including the home page (`/`) and the print page (`/print`).
- `src/components`: Reusable React components, including UI elements from shadcn/ui and custom components like `CardList`, `CardTable`, and `ScryfallSearchModal`.
- `src/context`: Global state management for the card list and language settings.
- `src/hooks`: Custom hooks for handling card search and other logic.
- `src/lib`: Utility functions and internationalization (i18n) files.

---

<a name="italiano"></a>
## Generatore di Proxy per MTG (Italiano)

> Questo progetto è stato realizzato tramite **Google Firebase Studio**.

### Panoramica

Questa è un'applicazione web realizzata con Next.js e pensata per i giocatori di Magic: The Gathering. Permette agli utenti di cercare carte utilizzando le API di Scryfall, costruire una lista di carte e generare una visualizzazione pronta per la stampa per creare "proxy" da usare durante playtest o partite amichevoli.

L'applicazione presenta un'interfaccia pulita e moderna, costruita con shadcn/ui, e supporta sia la lingua inglese che quella italiana.

### Funzionalità Chiave

- **Ricerca Carte**: Una modale `ScryfallSearchModal` integrata per cercare qualsiasi carta di Magic: The Gathering per nome.
- **Gestione Carte**: Aggiungi e rimuovi carte da una lista, gestita globalmente tramite React Context.
- **Layout Multipli**: Visualizza la tua lista di carte come elenco semplice, tabella o griglia di immagini.
- **Stampa Ottimizzata**: Un percorso dedicato `/print` formatta le carte selezionate per essere stampate facilmente su fogli A4.
- **Internazionalizzazione**: Supporto completo per inglese e italiano, gestito tramite un `LanguageContext` dedicato.

### Stack Tecnologico

- **Framework**: Next.js
- **Linguaggio**: TypeScript
- **UI**: React, shadcn/ui, Tailwind CSS
- **Gestione dello Stato**: React Context (`CardContext`, `LanguageContext`)
- **Dati Carte**: API di Scryfall

### Struttura del Progetto

- `src/app`: Route principali dell'applicazione, inclusa la home page (`/`) e la pagina di stampa (`/print`).
- `src/components`: Componenti React riutilizzabili, inclusi elementi UI di shadcn/ui e componenti personalizzati come `CardList`, `CardTable` e `ScryfallSearchModal`.
- `src/context`: Gestione dello stato globale per la lista di carte e le impostazioni della lingua.
- `src/hooks`: Hook personalizzati per la gestione della ricerca di carte e altre logiche.
- `src/lib`: Funzioni di utilità e file per l'internazionalizzazione (i18n).
