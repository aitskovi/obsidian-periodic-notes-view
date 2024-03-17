import {
    App,
    Editor,
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TAbstractFile,
    WorkspaceLeaf,
} from "obsidian";
import {
    PERIODIC_NOTES_VIEW_TYPE,
    PeriodicNotesView,
} from "./PeriodicNotesView";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: "default",
};

const DAILY_FOLDER_PATH = "daily";
const INDEX_FILENAME = "index.md";

export default class ObsidianPeriodicNotesViewPlugin extends Plugin {
    settings: MyPluginSettings;

    /**
     * Get a list of all the daily periodic notes in descending order.
     * @returns
     */
    async getDailyPeriodicNotes() {
        console.log("Regenerating periodic notes");
        const folder = this.app.vault.getFolderByPath(DAILY_FOLDER_PATH);
        if (!folder) {
            console.log("Could not find daily folder");
            new Notice("Could not find daily folder");
            return;
        }

        console.log(folder);

        const dailyNotes = folder.children.filter(
            (file) => file.name !== INDEX_FILENAME
        );

        const sortedDailyNotes = [...dailyNotes].sort((a, b) => {
            return b.name.localeCompare(a.name);
        });

        return sortedDailyNotes;
    }

    async writePeriodicNotesIndex(notes: Array<TAbstractFile>) {
        let indexFile = this.app.vault.getFileByPath(
            `${DAILY_FOLDER_PATH}/${INDEX_FILENAME}`
        );

        if (!indexFile) {
            indexFile = await this.app.vault.create(
                `${DAILY_FOLDER_PATH}/${INDEX_FILENAME}`,
                ""
            );
        }

        const indexPreamble = `---\ncssclasses: ['clean-embeds']\n\n---`;
        const indexContent = notes
            .map((note) => {
                return `### ${note.name.replace(".md", "")}\n![[${
                    note.name
                }]]\n\n---`;
            })
            .join("\n");

        await this.app.vault.modify(
            indexFile,
            [indexPreamble, indexContent].join("\n")
        );
    }

    async regeneratePeriodicNotesIndex() {
        const notes = await this.getDailyPeriodicNotes();
        if (!notes) {
            new Notice("Unable to find daily notes.");
            return;
        }
        return this.writePeriodicNotesIndex(notes);
    }

    async onload() {
        await this.loadSettings();

        this.regeneratePeriodicNotesIndex();

        this.registerView(
            PERIODIC_NOTES_VIEW_TYPE,
            (leaf) => new PeriodicNotesView(leaf)
        );

        this.app.vault.on("create", () => this.regeneratePeriodicNotesIndex());
        this.app.vault.on("delete", () => this.regeneratePeriodicNotesIndex());
        this.app.vault.on("rename", () => this.regeneratePeriodicNotesIndex());
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async activateView() {
        // TODO(aitskovi): Ensure that we are not opening multiple views of the same type (just focus on previous).

        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(PERIODIC_NOTES_VIEW_TYPE);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            leaf = workspace.getLeaf(true);
            if (leaf === null) {
                return;
            }
            await leaf.setViewState({
                type: PERIODIC_NOTES_VIEW_TYPE,
                active: true,
            });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf);
    }
}

class PeriodicNotesViewSettingsTab extends PluginSettingTab {
    plugin: ObsidianPeriodicNotesViewPlugin;

    constructor(app: App, plugin: ObsidianPeriodicNotesViewPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Setting #1")
            .setDesc("It's a secret")
            .addText((text) =>
                text
                    .setPlaceholder("Enter your secret")
                    .setValue(this.plugin.settings.mySetting)
                    .onChange(async (value) => {
                        this.plugin.settings.mySetting = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
