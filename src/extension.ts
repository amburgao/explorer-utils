import * as vscode from 'vscode';

let gitignoreStatusBarItem: vscode.StatusBarItem;
let hiddenFilesStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext)
{
	const addToGitignore = vscode.commands.registerCommand('explorer-utils.add-to-gitignore', async (uri: vscode.Uri) =>
	{
		try
		{
			const relativePath = vscode.workspace.asRelativePath(uri);
			const gitignoreUri = await vscode.workspace.findFiles(".gitignore", null, 1);
			if (gitignoreUri[0] === null)
			{
				const confirmation = await vscode.window.showInformationMessage('No .gitignore found. Create a new one?', 'Yes', 'No');
				if (confirmation === 'No')
				{
					return;
				}
				if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
				{
					const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
					await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(workspaceFolderUri, ".gitignore"), new TextEncoder().encode(relativePath));
					vscode.window.showInformationMessage(`Created .gitignore and added ${relativePath}.`);
					return;
				}
				vscode.window.showErrorMessage("No workspace folder is open.");
				return;
			}

			const oldContent = new TextDecoder().decode(await vscode.workspace.fs.readFile(gitignoreUri[0]));
			const newContent = oldContent.length === 0 ? relativePath : oldContent + "\n" + relativePath;
			await vscode.workspace.fs.writeFile(gitignoreUri[0], new TextEncoder().encode(newContent));
			vscode.window.showInformationMessage(`Added ${relativePath} to .gitignore.`);
		} catch (err)
		{
			vscode.window.showErrorMessage(`Failed to add to .gitignore: ${err}`);
		}
	});

	const toggleGitignore = vscode.commands.registerCommand('explorer-utils.toggle-gitignore', async () =>
	{
		const config = vscode.workspace.getConfiguration();
		const settingKey = 'explorer.excludeGitIgnore';
		const currentValue = config.get<boolean>(settingKey);
		const newValue = !currentValue;
		await config.update(settingKey, newValue, vscode.ConfigurationTarget.Workspace);
		vscode.window.showInformationMessage(`Explorer: exclude .gitignore is now ${newValue ? 'enabled' : 'disabled'}.`);
		updateGitignoreStatus(!(newValue));
	});

	const toggleHiddenFiles = vscode.commands.registerCommand('explorer-utils.toggle-hidden-files', async () =>
	{
		const config = vscode.workspace.getConfiguration();
		const settingKey = 'files.exclude';
		const currentKeys = config.get<{ [key: string]: boolean; }>(settingKey) || {};
		const currentValues = Object.values(currentKeys);
		const hasTrue = currentValues.includes(true);
		const hasFalse = currentValues.includes(false);
		const hasTrueAndFalse = hasTrue && hasFalse;
		const newKeys = hasTrueAndFalse ? Object.fromEntries(Object.keys(currentKeys).map(key => [key, true])) : Object.fromEntries(Object.keys(currentKeys).map(key => [key, !(currentValues[0])]));
		await config.update(settingKey, newKeys, vscode.ConfigurationTarget.Workspace);
		updateHiddenFilesStatus(currentValues[0]);
	});

	const hideFileFolder = vscode.commands.registerCommand('explorer-utils.hide-file-folder', async (uri: vscode.Uri) =>
	{
		const config = vscode.workspace.getConfiguration();
		const settingKey = 'files.exclude';
		const relativePath = vscode.workspace.asRelativePath(uri);
		const currentKeys = config.get<{ [key: string]: boolean; }>(settingKey) || {};
		const newKeys = { ...currentKeys, [relativePath]: true };
		await config.update(settingKey, newKeys, vscode.ConfigurationTarget.Workspace);
	});

	const garbageCollector = vscode.commands.registerCommand('explorer-utils.clear-garbage', async () =>
	{
		const config = vscode.workspace.getConfiguration();
		const settingKey = 'explorerUtils.garbageList';
		const garbagePatternList = config.get<string[]>(settingKey) || [];
		if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
		{
			const workspaceRootUri = vscode.workspace.workspaceFolders[0].uri;
			const itemsToDelete: vscode.Uri[] = [];
			const processedPaths = new Set<string>();

			for (const pattern of garbagePatternList) 
			{
				const potentialDirUri = vscode.Uri.joinPath(workspaceRootUri, pattern);
				try
				{
					const stat = await vscode.workspace.fs.stat(potentialDirUri);
					if (stat.type === vscode.FileType.Directory && !processedPaths.has(potentialDirUri.fsPath))
					{
						itemsToDelete.push(potentialDirUri);
						processedPaths.add(potentialDirUri.fsPath);
						continue;
					}
				} catch (e)
				{ console.error(e); }
				const files = await vscode.workspace.findFiles(pattern);
				for (const fileUri of files)
				{
					if (!processedPaths.has(fileUri.fsPath))
					{
						itemsToDelete.push(fileUri);
						processedPaths.add(fileUri.fsPath);
					}
				}
			}

			if (itemsToDelete.length === 0)
			{
				vscode.window.showInformationMessage("No garbage found to discard.");
				return;
			}

			for (const itemUri of itemsToDelete)
			{
				try
				{
					const stat = await vscode.workspace.fs.stat(itemUri);
					if (stat.type === vscode.FileType.Directory)
					{
						await vscode.workspace.fs.delete(itemUri, { recursive: true, useTrash: false });
						vscode.window.showInformationMessage(`Deleted directory: ${vscode.workspace.asRelativePath(itemUri)}`);
					} else if (stat.type === vscode.FileType.File)
					{
						await vscode.workspace.fs.delete(itemUri, { recursive: false, useTrash: false });
						vscode.window.showInformationMessage(`Deleted file: ${vscode.workspace.asRelativePath(itemUri)}`);
					}
				} catch (err)
				{
					vscode.window.showErrorMessage(`Failed to delete ${vscode.workspace.asRelativePath(itemUri)}: ${err}`);
				}
			}
			vscode.window.showInformationMessage("Garbage collection complete!");

		} else
		{
			vscode.window.showErrorMessage('No workspace folder is open.');
		}
	});

	gitignoreStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99999);
	gitignoreStatusBarItem.command = 'explorer-utils.toggle-gitignore';
	const _config = vscode.workspace.getConfiguration();
	const _settingKey = 'explorer.excludeGitIgnore';
	const _currentValue = _config.get<boolean>(_settingKey);
	updateGitignoreStatus(_currentValue);


	hiddenFilesStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99999);
	hiddenFilesStatusBarItem.command = 'explorer-utils.toggle-hidden-files';

	const config = vscode.workspace.getConfiguration();
	const settingKey = 'files.exclude';
	const currentKeys = config.get<{ [key: string]: boolean; }>(settingKey) || {};
	const currentValue = Object.values(currentKeys)[0];
	updateHiddenFilesStatus(currentValue);


	context.subscriptions.push(addToGitignore, toggleGitignore, toggleHiddenFiles, hideFileFolder, garbageCollector, gitignoreStatusBarItem, hiddenFilesStatusBarItem);
}

function updateGitignoreStatus(value: boolean | undefined): void
{
	const gitignoreState = value ? "$(eye)" : "$(eye-closed)";
	gitignoreStatusBarItem.text = `.gitignore ${gitignoreState}`;

	gitignoreStatusBarItem.show();
};

function updateHiddenFilesStatus(value: boolean | undefined): void
{

	const hiddenFilesState = value ? "$(eye)" : "$(eye-closed)";
	hiddenFilesStatusBarItem.text = `Hidden files ${hiddenFilesState}`;

	hiddenFilesStatusBarItem.show();
};

export function deactivate() { }