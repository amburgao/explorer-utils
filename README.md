<!-- markdownlint-disable MD033 -->

<h1 style="border-style: none; text-align: center;">Explorer Utils</h1>

## Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Usage](#usage)
- [Contributing](../CONTRIBUTING.md)

## About <a name = "about"></a>

The "Explorer Utils" extension provides a set of utilities to enhance the VS Code Explorer context menu and status bar. It allows users to quickly add files/folders to `.gitignore`, toggle the visibility of `.gitignore` files, hide specific files or folders, toggle the visibility of all hidden files, and clear predefined "garbage" files or folders from the workspace.

## Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need [Node.js](https://nodejs.org/) (which includes npm) and [Visual Studio Code](https://code.visualstudio.com/) installed on your system.

### Installing

1. **Clone the repository:**

    ```bash
    git clone https://github.com/amburgao/explorer-utils.git
    cd explorer-utils
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Compile the TypeScript source code:**

    ```bash
    npm run compile
    ```

    Alternatively, you can run `npm run watch` to automatically recompile on file changes.

4. **Run the extension in a development host:**
    Open the project in VS Code and press `F5`. This will open a new VS Code window with the "Explorer Utils" extension activated.

## Usage <a name = "usage"></a>

The extension adds several commands to the Explorer context menu:

- **Add to .gitignore**: Adds the selected file or folder's relative path to the workspace's `.gitignore` file.
- **Toggle .gitignore**: Toggles the `explorer.excludeGitIgnore` setting, which controls whether files ignored by Git are hidden in the Explorer.
- **Hide file/folder**: Adds the selected file or folder's relative path to the `files.exclude` setting, effectively hiding it from the Explorer.
- **Toggle hidden files**: Toggles the visibility of files and folders configured in the `files.exclude` setting. If all are hidden, it will show them; if some are shown, it will hide all.
- **Clear workspace garbage**: Deletes files and folders specified in the `explorerUtils.garbageList` configuration setting.

You can configure the list of items to be cleared by the "Clear workspace garbage" command in your VS Code settings:

```json
// filepath: .vscode/settings.json
{
    "explorerUtils.garbageList": [
        "node_modules",
        "out",
        "dist"
    ]
}
