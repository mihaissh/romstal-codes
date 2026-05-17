import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StoreSelector from "./StoreSelector";

describe("StoreSelector", () => {
    it("renders the current store", () => {
        render(<StoreSelector currentStore="1BN1" onStoreSelect={() => {}} />);
        expect(screen.getByText("1BN1")).toBeInTheDocument();
    });

    it("calls onStoreSelect when a store is clicked", () => {
        const onStoreSelect = vi.fn();
        render(<StoreSelector currentStore="1BN1" onStoreSelect={onStoreSelect} />);
        
        // Open dropdown
        fireEvent.click(screen.getByText("1BN1"));
        
        // Click another store
        fireEvent.click(screen.getByText("1BV1"));
        
        expect(onStoreSelect).toHaveBeenCalledWith("1BV1");
    });
});
