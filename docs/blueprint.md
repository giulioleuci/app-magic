# **App Name**: ProxyForge Web

## Core Features:

- Card Row Management: Add and remove rows to manage the list of desired cards.
- API Provider Selection: Select the API provider (e.g., Scryfall) for each card row. availableProviders are managed in `src/api/providers.ts`.
- Card Search: Search for cards via the selected API provider. Fetches and displays normalized card data using `useCardSearch.ts`.
- Quantity Adjustment: Adjust the desired quantity for each card.  State managed via Zustand.
- "Search All" Function: Triggers individual card searches for all rows in the table, respecting the `providerId` assigned to that particular card row.
- XLSX Import/Export: Import card data from and export to XLSX files.
- PDF Generation: Generates a PDF document suitable for printing proxies using the card data; the document uses a 3x3 grid with card dimensions of 63mm x 88mm. Correctly displays single and double faced cards. The layout is perfect centered on A4 pages.

## Style Guidelines:

- Primary color: Deep indigo (#4F46E5) for a sophisticated, focused feel.
- Background color: Dark gray (#282B30) to support a dark theme.
- Accent color: Vibrant violet (#A78BFA) for interactive elements and highlights.
- Body text: 'Inter' (sans-serif) for readability; Headline Font: 'Space Grotesk' (sans-serif)
- Use icons from Lucide React.
- Mobile-first, responsive design using Tailwind CSS. Table layout for desktop, vertical list for mobile. Utilize the shadcn library for UI components.
- Subtle transitions for card searches and loading states.