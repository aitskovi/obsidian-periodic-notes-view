import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { PeriodicNotesPage } from "./PeriodicNotesPage";
import * as React from "react";

export const PERIODIC_NOTES_VIEW_TYPE = "periodic-notes-view";

export class PeriodicNotesView extends ItemView {
    root: Root | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return PERIODIC_NOTES_VIEW_TYPE;
    }

    getDisplayText() {
        return "Periodic Notes View";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <StrictMode>
                <PeriodicNotesPage />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}
