
import type { NormalizedCard, ScryfallSearchOptions } from '@/lib/types';

const normalizeScryfallData = (card: any): NormalizedCard => {
    const image_uris = card.image_uris || (card.card_faces && card.card_faces[0].image_uris);
    const back_image_uris = card.card_faces && card.card_faces.length > 1 ? card.card_faces[1].image_uris : null;
    
    return {
      id: card.id,
      name: card.name,
      set: card.set_name,
      artist: card.artist,
      image_uris: {
        front: image_uris?.large || image_uris?.normal || '',
        back: back_image_uris?.large || back_image_uris?.normal,
      },
      is_dfc: !!back_image_uris,
      url: card.scryfall_uri,
    };
  };

export const useCardSearch = () => {
  const search = async (query: string, options?: ScryfallSearchOptions): Promise<NormalizedCard[] | null> => {
    if (!query) return null;

    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (options) {
        if (options.unique) params.append('unique', options.unique);
        if (options.order) params.append('order', options.order);
        if (options.dir) params.append('dir', options.dir);
        if (options.include_extras) params.append('include_extras', 'true');
        if (options.include_multilingual) params.append('include_multilingual', 'true');
        if (options.include_variations) params.append('include_variations', 'true');
      } else {
        // Default search behavior
        params.append('unique', 'prints');
        params.append('include_extras', 'true');
      }

      const response = await fetch(`https://api.scryfall.com/cards/search?${params.toString()}`);
      
      // Scryfall API has a rate limit, a small delay helps to avoid hitting it.
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Card "${query}" not found on Scryfall.`);
          return null;
        }
        const errorData = await response.json();
        throw new Error(`Scryfall API error: ${errorData.details || response.statusText}`);
      }

      const searchData = await response.json();
      
      if (searchData && searchData.data && searchData.data.length > 0) {
        return searchData.data.map(normalizeScryfallData);
      }
    } catch (error) {
        console.error("Failed to fetch from Scryfall", error);
        // Let the caller handle the error state
        throw error;
    }
    
    return null;
  };

  return { search };
};
