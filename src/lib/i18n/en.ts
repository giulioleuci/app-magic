
export const en = {
  header: {
    addCard: 'Add Card',
    searchAll: 'Search All',
    import: 'Import',
    export: 'Export',
    printPdf: 'Print PDF',
  },
  table: {
    image: 'Image',
    cardName: 'Card Name',
    quantity: 'Quantity',
    provider: 'Provider',
    actions: 'Actions',
  },
  card: {
    placeholder: 'Enter card name...',
    selectProvider: 'Select provider',
    search: 'Search',
    remove: 'Remove',
    notFound: 'No cards found',
    fetchError: 'Failed to fetch',
    scryfallSettings: 'Scryfall search settings',
    pokemonTcgSettings: 'Pokemon TCG search settings'
  },
  modal: {
    title: 'Multiple cards found for "{query}"',
    searchAgain: 'Search Again',
    filterPlaceholder: 'Filter by name, set, or artist...',
    noFilterResults: 'No cards match your filter.',
    close: 'Close',
  },
  scryfallModal: {
    title: 'Scryfall Search Options',
    unique: 'Omit similar cards',
    order: 'Sort cards by',
    dir: 'Sort direction',
    include_extras: 'Include extras (tokens, etc.)',
    include_multilingual: 'Include multilingual cards',
    include_variations: 'Include rare variants',
    save: 'Save',
    cancel: 'Cancel',
    uniqueOptions: {
      cards: 'Cards',
      art: 'Art',
      prints: 'Prints',
    },
    orderOptions: {
      name: 'Name',
      set: 'Set',
      released: 'Release Date',
      rarity: 'Rarity',
      color: 'Color',
      usd: 'USD Price',
      tix: 'TIX Price',
      eur: 'EUR Price',
      cmc: 'CMC',
      power: 'Power',
      toughness: 'Toughness',
      edhrec: 'EDHREC Rank',
      artist: 'Artist',
    },
    dirOptions: {
      auto: 'Auto',
      asc: 'Ascending',
      desc: 'Descending',
    }
  },
  pokemonTcgModal: {
    title: 'Pokemon TCG Search Options',
    order: 'Sort cards by',
    dir: 'Sort direction',
    save: 'Save',
    cancel: 'Cancel',
    apiInfo: {
      title: 'API Information',
      description: 'This search uses the public Pokemon TCG API without an API key. To avoid rate limits, please search responsibly.',
    },
    orderOptions: {
      name: 'Name',
      'set.releaseDate': 'Release Date',
      'set.name': 'Set Name',
      number: 'Card Number',
      artist: 'Artist',
      rarity: 'Rarity',
      nationalPokedexNumbers: 'Pokedex Number',
    },
    dirOptions: {
      asc: 'Ascending',
      desc: 'Descending',
    }
  },
  printPreview: {
    title: 'Print Preview',
    backToEditor: 'Back to Editor',
    saveAsPdf: 'Save as PDF',
    noCardsTitle: 'No Cards to Print',
    noCardsMessage: 'Go back to the editor to add some cards.',
  },
  toast: {
    searchingAll: {
      title: 'Searching all cards...',
      description: 'Please wait while we fetch card data.',
    },
    searchComplete: {
      title: 'Search complete!',
      description: 'All cards have been processed.',
    },
    searchFailed: {
      title: 'Search failed',
      description: 'An error occurred while searching for cards.',
      cardNotFound: 'Could not find card: {query}',
    },
    noCardsToPrint: {
      title: 'No cards to print',
      description: 'Please add and find some cards before printing.',
    },
    noCardsToExport: {
      title: 'No cards to export',
      description: 'Please add some cards before exporting.',
    },
    exportSuccess: {
      title: 'Export successful',
      description: 'Your card list has been saved.',
    },
    importSuccess: {
      title: 'Import successful',
      description: 'Your card list has been loaded.',
    },
    importFailed: {
      title: 'Import failed',
      description: 'The selected file is not a valid XLSX file.',
    },
  },
};
