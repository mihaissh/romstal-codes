import { useEffect } from 'react';
import type { RefObject } from 'react';

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
