import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Custom hook to detect clicks outside a specified element
 * @param ref - Reference to the element to monitor
 * @param callback - Callback function when click occurs outside
 */
export function useClickOutside(ref: RefObject<HTMLElement | null>, callback: () => void): void {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref, callback]);
}
