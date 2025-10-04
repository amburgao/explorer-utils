import { join } from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext)
{
	const addToGitignore = vscode.commands.registerCommand('explorer-utils.add-to-gitignore', async (uri: vscode.Uri) =>
	{
		const relativePath = vscode.workspace.asRelativePath(uri);
		const gitignoreUris = await vscode.workspace.findFiles(".gitignore");
		if (gitignoreUris.length > 0)
		{
			const gitignore = gitignoreUris[0];
			const oldContent = new TextDecoder().decode(await vscode.workspace.fs.readFile(gitignore));
			if (oldContent.length === 0)
			{
				await vscode.workspace.fs.writeFile(gitignore, new TextEncoder().encode(relativePath));
			} else
			{
				const newContent = new TextEncoder().encode(oldContent + "\n" + relativePath);
				await vscode.workspace.fs.writeFile(gitignore, newContent);
			}
			vscode.window.showInformationMessage(`Added ${relativePath} to .gitignore.`);
		} else
		{
			vscode.window.showInformationMessage('No .gitignore found.');
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
	});


	const toggleHiddenFiles = vscode.commands.registerCommand('explorer-utils.toggle-hidden-files', async () =>
	{
		const config = vscode.workspace.getConfiguration();
		const settingKey = 'files.exclude';

		const currentKeys = config.get<{ [key: string]: boolean }>(settingKey) || {};
		const currentValues = Object.values(currentKeys);
		const hasTrue = currentValues.includes(true);
		const hasFalse = currentValues.includes(false);
		const hasTrueAndFalse = hasTrue && hasFalse;

		if (hasTrueAndFalse)
		{
			const newKeys = Object.fromEntries(Object.keys(currentKeys).map(key => [key, true]));
			await config.update(settingKey, newKeys, vscode.ConfigurationTarget.Workspace);
		} else
		{
			const newKeys = Object.fromEntries(Object.keys(currentKeys).map(key => [key, !(currentValues[0])]));
			await config.update(settingKey, newKeys, vscode.ConfigurationTarget.Workspace);
		}


	});
	const hideFileFolder = vscode.commands.registerCommand('explorer-utils.hide-file-folder', async (uri: vscode.Uri) =>
	{
		const config = vscode.workspace.getConfiguration();
		const settingKey = 'files.exclude';
		const relativePath = vscode.workspace.asRelativePath(uri);
		const currentKeys = config.get<{ [key: string]: boolean }>(settingKey) || {};
		const newKeys = { ...currentKeys, [relativePath]: true };
		await config.update(settingKey, newKeys, vscode.ConfigurationTarget.Workspace);


	});
	const garbageCollector = vscode.commands.registerCommand('explorer-utils.clear-garbage', async () =>
	{
		const config = vscode.workspace.getConfiguration();
		const settingKey = 'explorerUtils.garbageList';
		const garbageList = config.get<string[]>(settingKey) || [];

		if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
		{
			const workspaceRootUri = vscode.workspace.workspaceFolders[0].uri;
			const dirContent = await vscode.workspace.fs.readDirectory(workspaceRootUri);
			console.log("Workspace directory content:", dirContent);
			garbageList.forEach(async (value) =>
			{
				console.log("Garbage item:", value);
				await vscode.workspace.fs.delete(vscode.Uri.joinPath(workspaceRootUri, value), { recursive: true, useTrash: false });
			});
		}


	});
	context.subscriptions.push(addToGitignore, toggleGitignore, toggleHiddenFiles, hideFileFolder, garbageCollector);
}

export function deactivate() { }
